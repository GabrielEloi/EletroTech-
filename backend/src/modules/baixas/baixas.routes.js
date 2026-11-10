import { Router } from 'express';
import { query, transaction } from '../../config/database.js';
import { requireAuth, requireAdmin, requirePermission } from '../../middlewares/auth.js';
import { AppError, asyncHandler, ok, created } from '../../shared/http.js';
import { id, list, amount, date, today, text, invalid } from '../../shared/validation.js';

export const movements = Router();
export const launches = Router();
movements.use(requireAuth, requirePermission('baixas'));
launches.use(requireAuth, requireAdmin);

function movementFilter(filters) {
  const clauses = [], params = [];
  if (filters.tipo) {
    if (!['entrada', 'saida'].includes(filters.tipo)) throw invalid('Tipo de movimentação inválido.');
    clauses.push('m.tipo=?'); params.push(filters.tipo);
  }
  const product = filters.produtoId ?? filters.id_produto;
  if (product) { clauses.push('m.id_produto=?'); params.push(id(product)); }
  const start = filters.dataInicio ?? filters.data_inicio, end = filters.dataFim ?? filters.data_fim;
  if (start) { clauses.push('m.data_mov>=?'); params.push(date(start)); }
  if (end) { clauses.push('m.data_mov<=?'); params.push(date(end)); }
  if (start && end && start > end) throw invalid('A data inicial deve ser anterior à data final.');
  return { sql: clauses.length ? ' WHERE ' + clauses.join(' AND ') : '', params };
}

const movementSelect = 'SELECT m.*,p.nome_produto,m.quantidade*m.valor_unitario valor_total FROM tabela_movimentacoes m JOIN tabela_produtos p ON p.id=m.id_produto';
movements.get('/opcoes', asyncHandler(async (_req, res) => ok(res, await query('SELECT id,nome_produto FROM tabela_produtos ORDER BY nome_produto'))));
movements.get('/', asyncHandler(async (req, res) => {
  const filter = movementFilter(req.query);
  ok(res, await query(`${movementSelect}${filter.sql} ORDER BY m.data_mov DESC,m.id DESC`, filter.params));
}));
movements.get('/totais', asyncHandler(async (req, res) => {
  const filter = movementFilter(req.query);
  ok(res, (await query(`SELECT COALESCE(SUM(CASE WHEN m.tipo='entrada' THEN m.quantidade*m.valor_unitario ELSE 0 END),0) totalEntrada,
    COALESCE(SUM(CASE WHEN m.tipo='saida' THEN m.quantidade*m.valor_unitario ELSE 0 END),0) totalSaida FROM tabela_movimentacoes m${filter.sql}`, filter.params))[0]);
}));
movements.post('/relatorio', asyncHandler(async (req, res) => {
  const ids = [...new Set(list(req.body.ids).map(id))];
  if (!ids.length || ids.length > 500) throw invalid('Selecione entre 1 e 500 movimentações.');
  ok(res, await query(`${movementSelect} WHERE m.id IN (${ids.map(() => '?').join(',')}) ORDER BY m.data_mov,m.id`, ids));
}));
movements.get('/:id', asyncHandler(async (req, res) => {
  const rows = await query(`${movementSelect} WHERE m.id=?`, [id(req.params.id)]);
  if (!rows.length) throw new AppError(404, 'Movimentação não encontrada.', 'NOT_FOUND');
  ok(res, rows[0]);
}));

async function draft(connection, user, launchId) {
  const [rows] = await connection.execute('SELECT * FROM tabela_baixas WHERE id=? AND id_usuario=? FOR UPDATE', [id(launchId), user.id]);
  if (!rows[0]) throw new AppError(404, 'Rascunho não encontrado para o usuário atual.', 'NOT_FOUND');
  if (rows[0].status !== 'rascunho') throw new AppError(409, 'Somente rascunhos podem ser alterados.', 'INVALID_STATE');
  return rows[0];
}

launches.get('/', asyncHandler(async (req, res) => {
  const [produtos, eletricistas, rascunhos, historico] = await Promise.all([
    query('SELECT * FROM tabela_produtos ORDER BY nome_produto'),
    query('SELECT id,nome FROM tabela_eletricistas WHERE data_demissao IS NULL ORDER BY nome'),
    query("SELECT * FROM tabela_baixas WHERE id_usuario=? AND status='rascunho' ORDER BY id", [req.user.id]),
    query("SELECT b.*,e.nome nome_eletricista FROM tabela_baixas b JOIN tabela_eletricistas e ON e.id=b.id_eletricista WHERE b.status<>'rascunho' ORDER BY b.id DESC"),
  ]);
  const abas = { entrada: { rascunho: null, itens: [] }, saida: { rascunho: null, itens: [] } };
  for (const row of rascunhos) abas[row.tipo] = { rascunho: row, itens: await query('SELECT i.*,p.nome_produto FROM tabela_baixa_itens i JOIN tabela_produtos p ON p.id=i.id_produto WHERE i.id_baixa=? ORDER BY i.id', [row.id]) };
  ok(res, { produtos, eletricistas, abas, historico });
}));
launches.post('/', asyncHandler(async (req, res) => {
  const type = req.body.tipo, data = date(req.body.dataBaixa ?? req.body.data_baixa), electricId = id(req.body.eletricistaId ?? req.body.id_eletricista);
  if (!['entrada', 'saida'].includes(type) || data > today()) throw invalid('Tipo ou data da baixa inválidos.');
  const observation = req.body.observacao ? text(req.body.observacao, 'Observação', 4000) : null;
  const launchId = await transaction(async c => {
    await c.execute('SELECT id FROM tabela_usuarios WHERE id=? FOR UPDATE', [req.user.id]);
    const [existing] = await c.execute("SELECT id FROM tabela_baixas WHERE id_usuario=? AND tipo=? AND status='rascunho'", [req.user.id, type]);
    if (existing.length) throw new AppError(409, 'Já existe um rascunho aberto deste tipo.', 'CONFLICT');
    const [electricians] = await c.execute('SELECT id FROM tabela_eletricistas WHERE id=? AND data_demissao IS NULL FOR UPDATE', [electricId]);
    if (!electricians.length) throw invalid('Selecione um eletricista ativo.');
    const [result] = await c.execute("INSERT INTO tabela_baixas (tipo,data_baixa,id_eletricista,observacao,status,id_usuario,data_abertura) VALUES (?,?,?,?,'rascunho',?,NOW())", [type, data, electricId, observation, req.user.id]);
    return result.insertId;
  });
  created(res, { id: launchId, mensagem: 'Lançamento aberto.' });
}));
launches.post('/:id/itens', asyncHandler(async (req, res) => {
  const productId = id(req.body.produtoId ?? req.body.id_produto), quantity = amount(req.body.quantidade, 'Quantidade', { integer: true, positive: true });
  const value = amount(req.body.valorUnitario ?? req.body.valor_unitario, 'Valor unitário');
  const itemId = await transaction(async c => {
    const launch = await draft(c, req.user, req.params.id);
    const [products] = await c.execute('SELECT id FROM tabela_produtos WHERE id=?', [productId]);
    if (!products.length) throw invalid('Produto não encontrado.');
    const [result] = await c.execute('INSERT INTO tabela_baixa_itens (id_baixa,id_produto,quantidade,valor_unitario) VALUES (?,?,?,?)', [launch.id, productId, quantity, value]);
    return result.insertId;
  });
  created(res, { id: itemId, mensagem: 'Item incluído.' });
}));
launches.delete('/:id/itens/:itemId', asyncHandler(async (req, res) => {
  await transaction(async c => {
    const launch = await draft(c, req.user, req.params.id);
    const [result] = await c.execute('DELETE FROM tabela_baixa_itens WHERE id=? AND id_baixa=?', [id(req.params.itemId), launch.id]);
    if (!result.affectedRows) throw new AppError(404, 'Item não encontrado.', 'NOT_FOUND');
  });
  res.status(204).end();
}));
launches.post('/:id/finalizacao', asyncHandler(async (req, res) => {
  await transaction(async c => {
    const launch = await draft(c, req.user, req.params.id);
    const [items] = await c.execute('SELECT * FROM tabela_baixa_itens WHERE id_baixa=? ORDER BY id_produto,id', [launch.id]);
    if (!items.length) throw invalid('Inclua ao menos um item.');
    for (const item of items) {
      const [products] = await c.execute('SELECT * FROM tabela_produtos WHERE id=? FOR UPDATE', [item.id_produto]);
      if (!products[0] || (launch.tipo === 'saida' && Number(products[0].qtd_estoque) < Number(item.quantidade))) throw new AppError(409, 'Estoque insuficiente.', 'INSUFFICIENT_STOCK');
      await c.execute(`UPDATE tabela_produtos SET qtd_estoque=qtd_estoque ${launch.tipo === 'entrada' ? '+' : '-'} ? WHERE id=?`, [item.quantidade, item.id_produto]);
      await c.execute('INSERT INTO tabela_movimentacoes (id_produto,tipo,quantidade,valor_unitario,data_mov,origem,id_baixa,id_usuario) VALUES (?,?,?,?,?,?,?,?)', [item.id_produto, launch.tipo, item.quantidade, item.valor_unitario, launch.data_baixa, `Baixa #${launch.id}`, launch.id, req.user.id]);
    }
    await c.execute("UPDATE tabela_baixas SET status='finalizada',data_finalizacao=NOW() WHERE id=?", [launch.id]);
  });
  ok(res, { mensagem: 'Lançamento finalizado.' });
}));
launches.post('/:id/cancelamento', asyncHandler(async (req, res) => {
  await transaction(async c => {
    const launch = await draft(c, req.user, req.params.id);
    await c.execute("UPDATE tabela_baixas SET status='cancelada' WHERE id=?", [launch.id]);
  });
  ok(res, { mensagem: 'Lançamento cancelado sem alterar o estoque.' });
}));
export async function baixaReport(launchId) {
  const [launch] = await query('SELECT b.*,e.nome nome_eletricista FROM tabela_baixas b JOIN tabela_eletricistas e ON e.id=b.id_eletricista WHERE b.id=?', [id(launchId)]);
  if (!launch) throw new AppError(404, 'Lançamento não encontrado.', 'NOT_FOUND');
  const items = await query('SELECT i.*,p.nome_produto,i.quantidade*i.valor_unitario valor_total FROM tabela_baixa_itens i JOIN tabela_produtos p ON p.id=i.id_produto WHERE i.id_baixa=? ORDER BY i.id', [launch.id]);
  return { ...launch, itens: items };
}
launches.get('/:id/relatorio', asyncHandler(async (req, res) => ok(res, await baixaReport(req.params.id))));
