import { query, transaction } from '../../config/database.js';
import { AppError } from '../../shared/http.js';
import { electricianScope, assertElectrician, teamOptions } from '../../shared/scope.js';
import { id, amount, date, today, list, pageInfo, text, invalid } from '../../shared/validation.js';
import { canManageOrders } from '../../shared/access.js';

const execute = async (connection, sql, params = []) => connection ? (await connection.execute(sql, params))[0] : query(sql, params);

export async function order(user, orderId, connection) {
  const rows = await execute(connection, `SELECT os.*,e.nome nome_eletricista FROM tabela_ordens_servico os
    JOIN tabela_eletricistas e ON e.id=os.eletricista_os WHERE os.id=?${connection ? ' FOR UPDATE' : ''}`, [id(orderId)]);
  if (!rows[0]) throw new AppError(404, 'Ordem de serviço não encontrada.', 'NOT_FOUND');
  await assertElectrician(user, rows[0].eletricista_os, { connection });
  return rows[0];
}

export async function event(connection, osId, userId, action, observation = null) {
  await connection.execute('INSERT INTO tabela_os_eventos (id_os,id_usuario,acao,observacao) VALUES (?,?,?,?)', [osId, userId, action, observation]);
}

export async function selectedChecklist(type, connection) {
  const rows = await execute(connection, 'SELECT * FROM tabela_checklist WHERE tipo=? AND selecionado=1', [type]);
  if (rows.length !== 1) return null;
  const questions = await execute(connection, 'SELECT p.*,p.texto_pergunta pergunta FROM tabela_checklist_perguntas p WHERE p.id_checklist=? ORDER BY p.ordem,p.id', [rows[0].id]);
  return { ...rows[0], perguntas: questions.map(p => ({ ...p, tipo_resposta: p.tipo_resposta === 'radio' ? 'sim_nao' : 'text', bloqueia_normalizado: p.bloqueia_abertura })) };
}

export async function listOrders(user, req) {
  const pagination = pageInfo(req), scope = electricianScope(user, 'os.eletricista_os');
  const filters = [scope.sql], params = [...scope.params];
  if (req.query.status && req.query.status !== 'todas') {
    if (!['solicitada', 'aberta', 'bloqueada', 'fechada'].includes(req.query.status)) throw invalid('Status inválido.');
    filters.push('os.status=?'); params.push(req.query.status);
  }
  if (req.query.eletricistaId && !user.eletricistaId) { filters.push('os.eletricista_os=?'); params.push(id(req.query.eletricistaId)); }
  const where = filters.join(' AND ');
  const [totals, rows, options, products, start, end] = await Promise.all([
    query(`SELECT COUNT(*) total FROM tabela_ordens_servico os WHERE ${where}`, params),
    query(`SELECT os.*,e.nome nome_eletricista FROM tabela_ordens_servico os JOIN tabela_eletricistas e ON e.id=os.eletricista_os
      WHERE ${where} ORDER BY os.id DESC LIMIT ? OFFSET ?`, [...params, pagination.pageSize, pagination.offset]),
    teamOptions(user), query('SELECT id,nome_produto,qtd_estoque FROM tabela_produtos WHERE qtd_estoque>0 ORDER BY nome_produto'),
    selectedChecklist('inicio'), selectedChecklist('fim'),
  ]);
  return { ordensServico: rows, eletricistasAtivos: options, produtosDisponiveis: products,
    checklistInicio: start, checklistFim: end, podeSolicitar: canManageOrders(user),
    paginacao: { page: pagination.page, pageSize: pagination.pageSize, total: Number(totals[0].total) } };
}

export async function details(user, orderId) {
  const os = await order(user, orderId);
  const [materiais, respostas, comentarios, pendencias, historico, fotos] = await Promise.all([
    query('SELECT m.*,p.nome_produto FROM tabela_os_materiais m JOIN tabela_produtos p ON p.id=m.id_produto WHERE m.id_os=?', [os.id]),
    query(`SELECT r.*,p.texto_pergunta,c.tipo FROM tabela_os_checklist_respostas r JOIN tabela_checklist_perguntas p ON p.id=r.id_pergunta
      JOIN tabela_checklist c ON c.id=p.id_checklist WHERE r.id_os=? ORDER BY r.id`, [os.id]),
    query('SELECT * FROM tabela_os_comentarios WHERE id_os=? ORDER BY data_comentario DESC,id DESC', [os.id]),
    query('SELECT * FROM tabela_os_checklist_status WHERE id_os=? ORDER BY id', [os.id]),
    query(`SELECT h.*,u.usuario autor FROM tabela_os_eventos h LEFT JOIN tabela_usuarios u ON u.id=h.id_usuario WHERE h.id_os=? ORDER BY h.id DESC`, [os.id]),
    query('SELECT id,etapa,criado_em FROM tabela_os_fotos WHERE id_os=? ORDER BY id', [os.id]),
  ]);
  return { ...os, materiais, respostas, comentarios, pendencias, historico, fotos };
}

export async function requestOrder(user, body) {
  const electricId = id(body.eletricistaId ?? body.eletricista_os);
  const data = body.dataOs || body.data_os || today();
  date(data);
  const value = amount(body.valor_servico ?? 0, 'Valor do serviço');
  const description = body.descricao ? text(body.descricao, 'Descrição', 4000) : null;
  const location = body.local_servico ? text(body.local_servico, 'Local do serviço') : null;
  return transaction(async c => {
    await assertElectrician(user, electricId, { active: true, connection: c });
    const [result] = await c.execute("INSERT INTO tabela_ordens_servico (eletricista_os,data_os,status,valor_servico,descricao,local_servico) VALUES (?,?,'solicitada',?,?,?)", [electricId, data, value, description, location]);
    await event(c, result.insertId, user.id, 'solicitacao');
    return result.insertId;
  });
}

function json(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { throw invalid('Dados de materiais ou checklist inválidos.'); }
}

async function saveAnswers(connection, os, body, type) {
  const checklist = await selectedChecklist(type, connection);
  if (!checklist?.perguntas.length) throw new AppError(409, `Não há checklist de ${type === 'inicio' ? 'início' : 'fim'} selecionado com perguntas.`, 'CHECKLIST_REQUIRED');
  const answers = json(body.checklistRespostas ?? body.checklist_resposta, {});
  const reasons = json(body.motivos, {});
  if (!answers || typeof answers !== 'object' || Array.isArray(answers) || !reasons || typeof reasons !== 'object' || Array.isArray(reasons)) throw invalid('Respostas do checklist inválidas.');
  let blocked = false;
  for (const question of checklist.perguntas) {
    const answer = text(answers[question.id], 'Resposta do checklist', 4000);
    if (question.tipo_resposta === 'sim_nao' && !['sim', 'nao'].includes(answer)) throw invalid('Responda Sim ou Não às perguntas de seleção.');
    const blocks = question.bloqueia_abertura && answer === question.bloqueia_abertura;
    const reason = reasons[question.id] ? text(reasons[question.id], 'Justificativa', 4000) : null;
    if (blocks && type === 'fim' && !reason) throw invalid('Justifique as respostas que impedem o fechamento.');
    blocked ||= Boolean(blocks);
    await connection.execute('INSERT INTO tabela_os_checklist_respostas (id_os,id_pergunta,resposta,motivo_nao) VALUES (?,?,?,?)', [os.id, question.id, answer, reason]);
  }
  return blocked;
}

export async function pending(connection, osId, type, userId, { origin = 'checklist', previous = null, observation = null } = {}) {
  const [existing] = await connection.execute('SELECT id FROM tabela_os_checklist_status WHERE id_os=? AND tipo=? FOR UPDATE', [osId, type]);
  if (existing[0]) await connection.execute(`UPDATE tabela_os_checklist_status SET bloqueado=1,decisao=NULL,observacao=?,data_bloqueio=NOW(),
    data_finalizacao=NULL,id_usuario=?,origem=?,status_anterior=? WHERE id=?`, [observation, userId, origin, previous, existing[0].id]);
  else await connection.execute(`INSERT INTO tabela_os_checklist_status (id_os,tipo,bloqueado,data_bloqueio,id_usuario,origem,status_anterior,observacao)
    VALUES (?,?,1,NOW(),?,?,?,?)`, [osId, type, userId, origin, previous, observation]);
}

export async function openOrder(user, orderId, body, savePhoto) {
  let materials = body.itens != null ? json(body.itens, []) : list(body.id_produto).map((p, i) => ({ produtoId: p, quantidade: list(body.qtd_utilizada)[i] }));
  if (!Array.isArray(materials)) throw invalid('Lista de materiais inválida.');
  const products = new Set();
  materials = materials.map(row => {
    if (!row || typeof row !== 'object') throw invalid('Material inválido.');
    const productId = id(row.produtoId ?? row.id), quantity = amount(row.quantidade ?? row.qtd, 'Quantidade', { integer: true, positive: true });
    if (products.has(productId)) throw invalid('Não repita um material na mesma OS.');
    products.add(productId);
    return { productId, quantity };
  }).sort((a, b) => a.productId - b.productId);
  return transaction(async c => {
    // O estado é lido dentro da transação e com trava da OS, evitando baixa dupla.
    const os = await order(user, orderId, c);
    if (os.status !== 'solicitada') throw new AppError(409, 'A OS não está disponível para abertura.', 'INVALID_STATE');
    if (os.data_os > today()) throw new AppError(409, 'Aguarde a data programada para abrir esta OS.', 'INVALID_STATE');
    const blocked = await saveAnswers(c, os, body, 'inicio');
    for (const { productId, quantity } of materials) {
      const [rows] = await c.execute('SELECT * FROM tabela_produtos WHERE id=? FOR UPDATE', [productId]);
      const product = rows[0];
      if (!product || Number(product.qtd_estoque) < quantity) throw new AppError(409, 'Estoque insuficiente para os materiais solicitados.', 'INSUFFICIENT_STOCK');
      await c.execute('INSERT INTO tabela_os_materiais (id_os,id_produto,qtd_utilizada) VALUES (?,?,?)', [os.id, productId, quantity]);
      await c.execute('UPDATE tabela_produtos SET qtd_estoque=qtd_estoque-? WHERE id=?', [quantity, productId]);
      await c.execute("INSERT INTO tabela_movimentacoes (id_produto,tipo,quantidade,valor_unitario,data_mov,origem,id_os,id_usuario) VALUES (?,'saida',?,?,?,?,?,?)", [productId, quantity, product.vlr_unitario, today(), `OS #${os.id}`, os.id, user.id]);
    }
    if (blocked) await pending(c, os.id, 'inicio', user.id);
    await c.execute('UPDATE tabela_ordens_servico SET status=? WHERE id=?', [blocked ? 'bloqueada' : 'aberta', os.id]);
    await event(c, os.id, user.id, blocked ? 'abertura_bloqueada' : 'abertura');
    if (savePhoto) await savePhoto(c, os.id, 'inicio');
    return { id: os.id, bloqueada: blocked, mensagem: blocked ? 'Abertura registrada. OS bloqueada, aguardando revisão.' : 'Ordem de serviço aberta.' };
  });
}

export async function closeOrder(user, orderId, body, savePhoto) {
  return transaction(async c => {
    const os = await order(user, orderId, c);
    if (os.status !== 'aberta') throw new AppError(409, 'Somente uma OS aberta e sem bloqueios pode ser encerrada.', 'INVALID_STATE');
    const [blocked] = await c.execute('SELECT id FROM tabela_os_checklist_status WHERE id_os=? AND bloqueado=1', [os.id]);
    if (blocked.length) throw new AppError(409, 'Resolva as pendências antes do fechamento.', 'INVALID_STATE');
    const hasBlock = await saveAnswers(c, os, body, 'fim');
    if (hasBlock) await pending(c, os.id, 'fim', user.id);
    await c.execute('UPDATE tabela_ordens_servico SET status=?,data_fechamento=? WHERE id=?', [hasBlock ? 'bloqueada' : 'fechada', hasBlock ? null : today(), os.id]);
    await event(c, os.id, user.id, hasBlock ? 'fechamento_bloqueado' : 'fechamento');
    if (savePhoto) await savePhoto(c, os.id, 'fim');
    return { id: os.id, bloqueada: hasBlock, mensagem: hasBlock ? 'Encerramento registrado. OS bloqueada, aguardando revisão.' : 'Ordem de serviço fechada.' };
  });
}

export async function blockOrder(user, orderId, body) {
  const observation = text(body.motivo ?? body.observacao, 'Motivo do bloqueio', 4000);
  return transaction(async c => {
    const os = await order(user, orderId, c);
    if (!['solicitada', 'aberta'].includes(os.status)) throw new AppError(409, 'A OS já está bloqueada ou fechada.', 'INVALID_STATE');
    await pending(c, os.id, 'inicio', user.id, { origin: 'manual', previous: os.status, observation });
    await c.execute("UPDATE tabela_ordens_servico SET status='bloqueada' WHERE id=?", [os.id]);
    await event(c, os.id, user.id, 'bloqueio_manual', observation);
  });
}

export async function updateOrder(user, orderId, body) {
  return transaction(async c => {
    const os = await order(user, orderId, c);
    if (os.status === 'fechada') throw new AppError(409, 'Uma OS fechada não pode ser alterada.', 'INVALID_STATE');
    const value = amount(body.valor_servico ?? os.valor_servico, 'Valor do serviço');
    const description = body.descricao == null ? os.descricao : String(body.descricao).trim();
    const location = body.local_servico == null ? os.local_servico : String(body.local_servico).trim();
    if ((description?.length || 0) > 4000 || (location?.length || 0) > 255) throw invalid('Descrição ou local do serviço excede o limite.');
    await c.execute('UPDATE tabela_ordens_servico SET valor_servico=?,descricao=?,local_servico=? WHERE id=?', [value, description || null, location || null, os.id]);
    await event(c, os.id, user.id, 'edicao', `Valor do serviço: R$ ${Number(os.valor_servico).toFixed(2)} → R$ ${value.toFixed(2)}`);
  });
}

export async function commentOrder(user, orderId, body, savePhoto) {
  const comment = body.comentario ? text(body.comentario, 'Comentário', 6000) : '';
  if (!comment && !savePhoto) throw invalid('Informe um comentário ou uma foto.');
  return transaction(async c => {
    const os = await order(user, orderId, c);
    const [result] = await c.execute('INSERT INTO tabela_os_comentarios (id_os,comentario) VALUES (?,?)', [os.id, comment]);
    await event(c, os.id, user.id, 'comentario', comment || 'Foto anexada.');
    if (savePhoto) await savePhoto(c, os.id, 'comentario');
    return result.insertId;
  });
}
