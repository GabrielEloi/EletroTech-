import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, transaction } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler, created, legacy, ok } from '../shared/http.js';
import { requireAdmin, requireAuth, requirePermission, requireManagement, requireOrderManager } from '../middlewares/auth.js';

import { permissions, electricianPermissions, supervisorPermissions, supervisorMarker, normalizedUser, canManageOrders } from '../shared/access.js';
import { obterDashboard } from '../services/dashboard.service.js';

const router = Router();
const today = () => new Date().toISOString().slice(0, 10);
const id = (value) => { const n = Number(value); if (!Number.isInteger(n) || n < 1) throw new AppError(400, 'Identificador inválido.', 'VALIDATION_ERROR'); return n; };
const number = (value, label = 'Valor') => { const n = Number(value); if (!Number.isFinite(n)) throw new AppError(422, `${label} inválido.`, 'VALIDATION_ERROR'); return n; };
const list = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const pageInfo = (req) => { const page = Math.max(1, Number(req.query.page) || 1); const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20)); return { page, pageSize, offset: (page - 1) * pageSize }; };
const item = async (sql, params, msg = 'Registro não encontrado.') => { const rows = await query(sql, params); if (!rows[0]) throw new AppError(404, msg, 'NOT_FOUND'); return rows[0]; };
const isLegacy = (req) => req.path.startsWith('/legacy/');
const respond = (req, res, data, status = 200, meta) => isLegacy(req) ? legacy(res, data, status) : status === 201 ? created(res, data) : ok(res, data, meta);

async function userForLogin(login) {
  const rows = await query(`SELECT u.id,u.usuario,u.senha,u.is_admin,u.eletricista_id,e.nome AS eletricista_nome,e.data_demissao,
    COALESCE(JSON_ARRAYAGG(up.permissao), JSON_ARRAY()) AS permissoesJson
    FROM tabela_usuarios u LEFT JOIN tabela_eletricistas e ON e.id=u.eletricista_id
    LEFT JOIN tabela_usuario_permissao up ON up.usuario_id=u.id
    WHERE u.usuario=? OR e.cpf=? GROUP BY u.id LIMIT 1`, [login, login.replace(/\D/g, '')]);
  if (!rows[0]) return null;
  const row = rows[0]; row.permissoes = typeof row.permissoesJson === 'string' ? JSON.parse(row.permissoesJson) : (row.permissoesJson || []);
  row.permissoes = row.permissoes.filter(Boolean); return row;
}
async function login(req, res) {
  const loginName = String(req.body.nome ?? req.body.usuario ?? req.body.login ?? '').trim(); const password = String(req.body.senha ?? '');
  if (!loginName || !password) throw new AppError(422, 'Usuário e senha são obrigatórios.', 'VALIDATION_ERROR');
  const row = await userForLogin(loginName);
  if (!row || !(await bcrypt.compare(password, row.senha))) throw new AppError(401, 'Credenciais inválidas.', 'INVALID_CREDENTIALS');
  if (row.eletricista_id && row.data_demissao) throw new AppError(403, 'Acesso desativado. Fale com o administrador.', 'INACTIVE_USER');
  const user = normalizedUser(row); user.nome = row.eletricista_nome || row.usuario;
  // O destino e as permissões são calculados pelo perfil em normalizedUser.
  const accessToken = jwt.sign({ id: user.id, nome: user.nome, usuario: user.usuario, isAdmin: user.isAdmin, is_admin: user.isAdmin, isSupervisor: user.isSupervisor, perfil: user.perfil, eletricistaId: user.eletricistaId, eletricista_id: user.eletricistaId, permissoes: user.permissoes }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  return isLegacy(req) ? legacy(res, { ...user, accessToken }) : ok(res, { usuario: user, accessToken, tokenType: 'Bearer', expiresIn: env.jwtExpiresIn });
}

router.post('/auth/login', asyncHandler(login));
router.get('/auth/me', requireAuth, (req, res) => ok(res, req.user));
router.post('/auth/logout', requireAuth, (_req, res) => res.status(204).end());
router.post('/auth/refresh', (_req, _res, next) => next(new AppError(501, 'Refresh token ainda não configurado.', 'NOT_IMPLEMENTED')));

// Somente o administrador escolhe perfis; permissões de supervisor e eletricista são fixas.
function userAccess(body, current = {}) {
  const rawId = body.eletricistaId ?? body.eletricista_id ?? current.eletricista_id;
  const electricId = rawId ? id(rawId) : null;
  const perfil = body.perfil ?? (Number(body.isAdmin ?? body.is_admin ?? current.is_admin) === 1 ? 'admin' : electricId ? 'eletricista' : current.perfil === 'supervisor' ? 'supervisor' : 'padrao');
  if (!['admin','supervisor','padrao','eletricista'].includes(perfil)) throw new AppError(422,'Perfil inválido.','VALIDATION_ERROR');
  if (electricId && perfil !== 'eletricista') throw new AppError(422,'Conta de eletricista mantém seu perfil próprio.','VALIDATION_ERROR');
  if (!electricId && perfil === 'eletricista') throw new AppError(422,'O perfil de eletricista exige um vínculo.','VALIDATION_ERROR');
  const perms = electricId ? [...electricianPermissions] : perfil === 'supervisor' ? [...supervisorPermissions,supervisorMarker] : [...new Set(list(body.permissoes ?? current.permissoes).filter(p => permissions.includes(p)))];
  return { electricId, isAdmin: perfil === 'admin', perms };
}

async function validateElectricianLink(connection, electricId, userId = 0) {
  if (!electricId) return;
  const [active] = await connection.execute('SELECT id FROM tabela_eletricistas WHERE id=? AND data_demissao IS NULL',[electricId]);
  if (!active[0]) throw new AppError(422,'Eletricista não encontrado ou inativo.','VALIDATION_ERROR');
  const [bound] = await connection.execute('SELECT id FROM tabela_usuarios WHERE eletricista_id=? AND id<>?',[electricId,userId]);
  if (bound[0]) throw new AppError(409,'Eletricista já possui usuário vinculado.','CONFLICT');
}

router.get('/usuarios', requireAuth, requireAdmin, asyncHandler(async (req,res) => {
  const { page,pageSize,offset } = pageInfo(req);
  const total = (await query('SELECT COUNT(*) total FROM tabela_usuarios'))[0].total;
  const rows = await query(`SELECT u.id,u.usuario,u.is_admin,u.eletricista_id,e.nome eletricista_nome,
    COALESCE(JSON_ARRAYAGG(up.permissao),JSON_ARRAY()) permissoes
    FROM tabela_usuarios u LEFT JOIN tabela_eletricistas e ON e.id=u.eletricista_id
    LEFT JOIN tabela_usuario_permissao up ON up.usuario_id=u.id
    GROUP BY u.id ORDER BY u.id DESC LIMIT ? OFFSET ?`,[pageSize,offset]);
  // Retorna o perfil efetivo, sem exibir o marcador interno como módulo.
  respond(req,res,rows.map(row => ({...row,...normalizedUser(row)})),200,{page,pageSize,total});
}));
router.post('/usuarios', requireAuth, requireAdmin, asyncHandler(async (req,res) => {
  const usuario = String(req.body.usuario ?? '').trim(), senha = String(req.body.senha ?? '');
  if (!usuario || senha.length < 6) throw new AppError(422,'Usuário e senha (mínimo 6 caracteres) são obrigatórios.','VALIDATION_ERROR');
  const { electricId,isAdmin,perms } = userAccess(req.body);
  const newId = await transaction(async c => {
    const [exists] = await c.execute('SELECT id FROM tabela_usuarios WHERE usuario=?',[usuario]);
    if (exists[0]) throw new AppError(409,'Nome de usuário já utilizado.','CONFLICT');
    await validateElectricianLink(c,electricId);
    const [insert] = await c.execute('INSERT INTO tabela_usuarios (usuario,senha,is_admin,eletricista_id) VALUES (?,?,?,?)',[usuario,await bcrypt.hash(senha,10),isAdmin ? 1 : 0,electricId]);
    for (const p of perms) await c.execute('INSERT INTO tabela_usuario_permissao (usuario_id,permissao) VALUES (?,?)',[insert.insertId,p]);
    return insert.insertId;
  });
  respond(req,res,{id:newId,mensagem:'Usuário criado com sucesso.'},201);
}));
router.put('/usuarios/:id', requireAuth, requireAdmin, asyncHandler(async (req,res) => {
  const userId = id(req.params.id);
  const current = await item('SELECT * FROM tabela_usuarios WHERE id=?',[userId]);
  const stored = await query('SELECT permissao FROM tabela_usuario_permissao WHERE usuario_id=?',[userId]);
  const profile = normalizedUser({...current,permissoes:stored.map(row => row.permissao)});
  const { electricId,isAdmin,perms } = userAccess(req.body,{...current,perfil:profile.perfil,permissoes:profile.permissoes});
  if (current.is_admin && !isAdmin && (await query('SELECT COUNT(*) total FROM tabela_usuarios WHERE is_admin=1'))[0].total === 1) throw new AppError(409,'Não é possível remover o último administrador.','LAST_ADMIN');
  // Salva perfil, senha e permissões juntos para evitar uma atualização parcial.
  await transaction(async c => {
    await validateElectricianLink(c,electricId,userId);
    await c.execute('UPDATE tabela_usuarios SET usuario=?,is_admin=?,eletricista_id=? WHERE id=?',[String(req.body.usuario ?? current.usuario).trim(),isAdmin ? 1 : 0,electricId,userId]);
    if (req.body.senha) await c.execute('UPDATE tabela_usuarios SET senha=? WHERE id=?',[await bcrypt.hash(String(req.body.senha),10),userId]);
    await c.execute('DELETE FROM tabela_usuario_permissao WHERE usuario_id=?',[userId]);
    for (const p of perms) await c.execute('INSERT INTO tabela_usuario_permissao (usuario_id,permissao) VALUES (?,?)',[userId,p]);
  });
  respond(req,res,{id:userId,mensagem:'Usuário atualizado com sucesso.'});
}));
router.delete('/usuarios/:id', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{const userId=id(req.params.id);const u=await item('SELECT * FROM tabela_usuarios WHERE id=?',[userId]);if(u.is_admin&&(await query('SELECT COUNT(*) total FROM tabela_usuarios WHERE is_admin=1'))[0].total===1)throw new AppError(409,'Não é possível excluir o último administrador.','LAST_ADMIN');await query('DELETE FROM tabela_usuarios WHERE id=?',[userId]);res.status(204).end();}));

router.get('/eletricistas', requireAuth, requirePermission('eletricistas'), asyncHandler(async(req,res)=>{
  const active=req.query.status==='ativos';
  const mesAtual=new Date().toISOString().slice(0,7);
  const rows=await query(
    `SELECT e.*,u.id usuario_id,
      (SELECT COUNT(*) FROM tabela_ordens_servico os WHERE os.eletricista_os=e.id AND os.status='fechada') total_os,
      COALESCE((SELECT m.vlr_meta FROM tabela_metas m WHERE m.eletricista_meta=e.id AND m.mes_meta=? LIMIT 1),0) meta_atual
      FROM tabela_eletricistas e
      LEFT JOIN tabela_usuarios u ON u.eletricista_id=e.id
      ${active?'WHERE e.data_demissao IS NULL':''}
      ORDER BY e.nome`,
    [mesAtual]
  );
  respond(req,res,rows);
}));
router.post('/eletricistas', requireAuth, requirePermission('eletricistas'), asyncHandler(async(req,res)=>{const {nome,cpf}=req.body;const data=req.body.dataContratacao??req.body.data_contratacao;if(!nome||!cpf||!data)throw new AppError(422,'Nome, CPF e data de contratação são obrigatórios.','VALIDATION_ERROR');const newId=await transaction(async c=>{const [e]=await c.execute('INSERT INTO tabela_eletricistas (nome,cpf,data_contratacao) VALUES (?,?,?)',[String(nome).trim(),String(cpf).replace(/\D/g,''),data]);const [user]=await c.execute('INSERT INTO tabela_usuarios (usuario,senha,is_admin,eletricista_id) VALUES (?,?,0,?)',[String(cpf).replace(/\D/g,''),await bcrypt.hash(String(req.body.senha||cpf),10),e.insertId]);/* Salva os três acessos junto com o login na mesma transação. */for(const p of electricianPermissions)await c.execute('INSERT INTO tabela_usuario_permissao (usuario_id,permissao) VALUES (?,?)',[user.insertId,p]);return e.insertId;});respond(req,res,{id:newId,mensagem:'Eletricista cadastrado com usuário de acesso.'},201);}));
// Informar uma senha também libera o login de eletricistas antigos sem conta vinculada.
router.put('/eletricistas/:id', requireAuth, requirePermission('eletricistas'), asyncHandler(async (req,res) => {
  const electricId = id(req.params.id);
  const electric = await item('SELECT id,cpf FROM tabela_eletricistas WHERE id=?', [electricId]);
  await transaction(async c => {
    if (req.body.nome) await c.execute('UPDATE tabela_eletricistas SET nome=? WHERE id=?', [String(req.body.nome).trim(),electricId]);
    if (req.body.senha) {
      const password = await bcrypt.hash(String(req.body.senha),10);
      const [users] = await c.execute('SELECT id FROM tabela_usuarios WHERE eletricista_id=?', [electricId]);
      if (users[0]) {
        await c.execute('UPDATE tabela_usuarios SET senha=? WHERE eletricista_id=?', [password,electricId]);
      } else {
        const [user] = await c.execute('INSERT INTO tabela_usuarios (usuario,senha,is_admin,eletricista_id) VALUES (?,?,0,?)', [String(electric.cpf).replace(/\D/g,''),password,electricId]);
        for (const p of electricianPermissions) await c.execute('INSERT INTO tabela_usuario_permissao (usuario_id,permissao) VALUES (?,?)', [user.insertId,p]);
      }
    }
  });
  respond(req,res,{id:electricId,mensagem:'Eletricista atualizado com sucesso.'});
}));
router.patch('/eletricistas/:id/demissao',requireAuth,requirePermission('eletricistas'),asyncHandler(async(req,res)=>{const electricId=id(req.params.id);await query('UPDATE tabela_eletricistas SET data_demissao=? WHERE id=?',[today(),electricId]);respond(req,res,{id:electricId,mensagem:'Eletricista desligado.'});}));
router.patch('/eletricistas/:id/reativacao',requireAuth,requirePermission('eletricistas'),asyncHandler(async(req,res)=>{const electricId=id(req.params.id);await query('UPDATE tabela_eletricistas SET data_demissao=NULL WHERE id=?',[electricId]);respond(req,res,{id:electricId,mensagem:'Eletricista reativado.'});}));
router.get('/eletricistas/:id/ordens-servico',requireAuth,requirePermission('eletricistas'),asyncHandler(async(req,res)=>respond(req,res,await query('SELECT * FROM tabela_ordens_servico WHERE eletricista_os=? ORDER BY id DESC',[id(req.params.id)]))));

router.get('/produtos',requireAuth,requirePermission('produtos'),asyncHandler(async(req,res)=>respond(req,res,await query('SELECT * FROM tabela_produtos ORDER BY id DESC'))));
router.post('/produtos',requireAuth,requirePermission('produtos'),asyncHandler(async(req,res)=>{const name=String(req.body.nomeProduto??req.body.nome_produto??'').trim(), price=number(req.body.vlrUnitario??req.body.vlr_unitario,'Valor unitário'), qty=Math.max(0,number(req.body.qtdEstoque??req.body.qtd_estoque??0,'Quantidade'));if(!name||!Number.isInteger(qty)||price<0)throw new AppError(422,'Dados do produto inválidos.','VALIDATION_ERROR');const newId=await transaction(async c=>{const [p]=await c.execute('INSERT INTO tabela_produtos (nome_produto,vlr_unitario,qtd_estoque) VALUES (?,?,?)',[name,price,qty]);if(qty)await c.execute("INSERT INTO tabela_movimentacoes (id_produto,tipo,quantidade,valor_unitario,data_mov,origem) VALUES (?,'entrada',?,?,?,'Estoque inicial (cadastro)')",[p.insertId,qty,price,today()]);return p.insertId;});respond(req,res,{id:newId,mensagem:'Produto cadastrado com sucesso.'},201);}));
router.put('/produtos/:id',requireAuth,requirePermission('produtos'),asyncHandler(async(req,res)=>{const productId=id(req.params.id);await item('SELECT * FROM tabela_produtos WHERE id=?',[productId]);const name=String(req.body.nomeProduto??req.body.nome_produto??'').trim(),price=number(req.body.vlrUnitario??req.body.vlr_unitario,'Valor unitário');await query('UPDATE tabela_produtos SET nome_produto=?,vlr_unitario=? WHERE id=?',[name,price,productId]);respond(req,res,{id:productId,mensagem:'Produto atualizado.'});}));
async function stock(req,res,mode){const productId=id(req.params.id);const qty=mode==='zero'?null:number(req.body.quantidade??req.body.qtd_estoque,'Quantidade');const result=await transaction(async c=>{const [rows]=await c.execute('SELECT * FROM tabela_produtos WHERE id=? FOR UPDATE',[productId]);if(!rows[0])throw new AppError(404,'Produto não encontrado.','NOT_FOUND');const p=rows[0], amount=mode==='zero'?p.qtd_estoque:qty;if(amount<=0||!Number.isInteger(amount))throw new AppError(422,'Quantidade deve ser um inteiro positivo.','VALIDATION_ERROR');const type=mode==='zero'?'saida':'entrada';await c.execute(`UPDATE tabela_produtos SET qtd_estoque=qtd_estoque ${type==='saida'?'-':'+'} ? WHERE id=?`,[amount,productId]);await c.execute('INSERT INTO tabela_movimentacoes (id_produto,tipo,quantidade,valor_unitario,data_mov,origem) VALUES (?,?,?,?,?,?)',[productId,type,amount,p.vlr_unitario,today(),mode==='zero'?'Baixa manual de estoque':'Reposição de estoque']);return amount;});respond(req,res,{id:productId,quantidade:result,mensagem:'Estoque atualizado.'});}
router.post('/produtos/:id/zerar-estoque',requireAuth,requirePermission('produtos'),asyncHandler((req,res)=>stock(req,res,'zero')));router.post('/produtos/:id/entrada-estoque',requireAuth,requirePermission('produtos'),asyncHandler((req,res)=>stock(req,res,'entry')));

// Fornece opções de atribuição sem conceder acesso ao cadastro de eletricistas.
router.get('/metas/opcoes',requireAuth,requirePermission('metas'),requireManagement,asyncHandler(async(req,res)=>respond(req,res,await query('SELECT id,nome FROM tabela_eletricistas WHERE data_demissao IS NULL ORDER BY nome'))));
router.get('/metas',requireAuth,requirePermission('metas'),asyncHandler(async(req,res)=>{const filters=[],params=[];/* O vínculo autenticado prevalece sobre qualquer filtro enviado. */const e=req.user.eletricistaId??req.query.eletricistaId??req.query.filtro_eletricista,m=req.query.mes??req.query.filtro_mes;if(e){filters.push('m.eletricista_meta=?');params.push(id(e));}if(m){filters.push('m.mes_meta=?');params.push(m);}const rows=await query(`SELECT m.*,e.nome nome_eletricista FROM tabela_metas m JOIN tabela_eletricistas e ON e.id=m.eletricista_meta ${filters.length?'WHERE '+filters.join(' AND '):''} ORDER BY m.mes_meta DESC`,params);respond(req,res,rows);}));
router.post('/metas',requireAuth,requirePermission('metas'),requireManagement,asyncHandler(async(req,res)=>{const elec=id(req.body.eletricistaId??req.body.eletricista_meta),mes=String(req.body.mes??req.body.mes_meta??''),value=number(req.body.vlrMeta??req.body.vlr_meta,'Valor da meta');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)||value<0)throw new AppError(422,'Meta inválida.','VALIDATION_ERROR');try{const r=await query('INSERT INTO tabela_metas (eletricista_meta,mes_meta,vlr_meta) VALUES (?,?,?)',[elec,mes,value]);respond(req,res,{id:r.insertId,mensagem:'Meta cadastrada.'},201);}catch(e){if(e.code==='ER_DUP_ENTRY')throw new AppError(409,'Já existe meta para este eletricista e mês.','CONFLICT');throw e;}}));
router.put('/metas/:id',requireAuth,requirePermission('metas'),requireManagement,asyncHandler(async(req,res)=>{const metaId=id(req.params.id);await query('UPDATE tabela_metas SET vlr_meta=? WHERE id=?',[number(req.body.vlrMeta??req.body.vlr_meta,'Valor da meta'),metaId]);respond(req,res,{id:metaId,mensagem:'Meta atualizada.'});}));router.delete('/metas/:id',requireAuth,requirePermission('metas'),requireManagement,asyncHandler(async(req,res)=>{await query('DELETE FROM tabela_metas WHERE id=?',[id(req.params.id)]);res.status(204).end();}));

const checklistTypes = ['inicio', 'fim'];
const checklistType = (value) => {
  if (!checklistTypes.includes(value)) throw new AppError(400, 'Tipo de checklist inválido.', 'VALIDATION_ERROR');
  return value;
};

async function listarPendenciasChecklist(req, res) {
  const filters = ['s.bloqueado=1'];
  const params = [];
  const type = req.query.tipo;
  const electrician = req.query.eletricista ?? req.query.eletricistaId;
  if (type && !checklistTypes.includes(type)) {
    throw new AppError(422, 'Tipo de checklist inválido.', 'VALIDATION_ERROR');
  }
  if (checklistTypes.includes(type)) {
    filters.push('s.tipo=?');
    params.push(type);
  }
  if (electrician && !electricianFilter(electrician)) {
    throw new AppError(422, 'Eletricista inválido.', 'VALIDATION_ERROR');
  }
  if (electricianFilter(electrician)) {
    filters.push('e.id=?');
    params.push(Number(electrician));
  }
  const ordering = {
    data_desc: 's.data_bloqueio DESC',
    data_asc: 's.data_bloqueio ASC',
    os_asc: 's.id_os ASC',
    os_desc: 's.id_os DESC',
    eletricista_asc: 'e.nome ASC',
    eletricista_desc: 'e.nome DESC',
  };
  const sort = req.query.ordenar || 'data_desc';
  if (!ordering[sort]) throw new AppError(422, 'Ordenação inválida.', 'VALIDATION_ERROR');
  const [bloqueados, eletricistas] = await Promise.all([
    query(
      `SELECT s.id AS id_status,s.id_os,s.tipo,s.data_bloqueio,os.data_os,
        os.status AS status_os,e.id AS id_eletricista,e.nome AS nome_eletricista
        FROM tabela_os_checklist_status s
        JOIN tabela_ordens_servico os ON os.id=s.id_os
        LEFT JOIN tabela_eletricistas e ON e.id=os.eletricista_os
        WHERE ${filters.join(' AND ')} ORDER BY ${ordering[sort]}`,
      params
    ),
    query('SELECT id,nome FROM tabela_eletricistas ORDER BY nome'),
  ]);
  respond(req, res, { bloqueados, eletricistas });
}

function electricianFilter(value) {
  return value != null && value !== '' && /^\d+$/.test(String(value)) && Number(value) > 0;
}

async function finalizarPendenciaChecklist(req, res, idOs, tipo) {
  const osId = id(idOs);
  const checklist = checklistType(tipo);
  const observation = String(req.body.observacao ?? '').trim();
  const action = req.body.acao;
  if (!observation) throw new AppError(422, 'Informe uma observação para a decisão.', 'VALIDATION_ERROR');
  if (!['autorizar', 'negar'].includes(action)) throw new AppError(422, 'Ação inválida.', 'VALIDATION_ERROR');

  await transaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT * FROM tabela_os_checklist_status WHERE id_os=? AND tipo=? FOR UPDATE',
      [osId, checklist]
    );
    const status = rows[0];
    if (!status || Number(status.bloqueado) !== 1) {
      throw new AppError(409, 'Esta pendência não está aguardando decisão.', 'INVALID_STATE');
    }
    const authorized = action === 'autorizar';
    const nextOsStatus = checklist === 'inicio'
      ? (authorized ? 'aberta' : 'bloqueada')
      : (authorized ? 'fechada' : 'bloqueada');
    const finalizedAt = authorized ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
    await connection.execute(
      'UPDATE tabela_os_checklist_status SET bloqueado=?,observacao=?,data_finalizacao=? WHERE id=?',
      [authorized ? 0 : 1, observation, finalizedAt, status.id]
    );
    await connection.execute('UPDATE tabela_ordens_servico SET status=? WHERE id=?', [nextOsStatus, osId]);
  });
  respond(req, res, {
    id_os: osId,
    tipo: checklist,
    acao: action,
    mensagem: action === 'autorizar' ? 'Checklist autorizado.' : 'Checklist negado.',
  });
}

async function relatorioChecklist(req, res, idOs, tipo) {
  const osId = id(idOs);
  const checklist = checklistType(tipo);
  const ordem = await query(
    `SELECT os.id,os.eletricista_os,os.status,os.data_os,os.data_fechamento,
      e.nome AS nome_eletricista
      FROM tabela_ordens_servico os
      LEFT JOIN tabela_eletricistas e ON e.id=os.eletricista_os
      WHERE os.id=?`,
    [osId]
  );
  if (!ordem[0]) throw new AppError(404, 'Ordem de serviço não encontrada.', 'NOT_FOUND');
  const [respostas, statusRows] = await Promise.all([
    query(
      `SELECT r.id_pergunta,p.texto_pergunta,r.resposta,r.motivo_nao
        FROM tabela_os_checklist_respostas r
        JOIN tabela_checklist_perguntas p ON p.id=r.id_pergunta
        JOIN tabela_checklist c ON c.id=p.id_checklist
        WHERE r.id_os=? AND c.tipo=? ORDER BY p.ordem ASC`,
      [osId, checklist]
    ),
    query('SELECT * FROM tabela_os_checklist_status WHERE id_os=? AND tipo=?', [osId, checklist]),
  ]);
  respond(req, res, {
    idOs: osId,
    tipo: checklist,
    ordem: ordem[0],
    respostas,
    status: statusRows[0] || null,
  });
}

for (const path of ['/checklists/pendencias', '/consultachecklist']) {
  router.get(path, requireAuth, requirePermission('checklist'), asyncHandler(listarPendenciasChecklist));
}
router.post('/checklists/pendencias/:idOs/:tipo/resolucao', requireAuth, requirePermission('checklist'), asyncHandler(
  (req, res) => finalizarPendenciaChecklist(req, res, req.params.idOs, req.params.tipo)
));
router.post('/consultachecklist/finalizar', requireAuth, requirePermission('checklist'), asyncHandler(
  (req, res) => finalizarPendenciaChecklist(req, res, req.body.id_os, req.body.tipo)
));
router.get('/checklists/pendencias/:idOs/:tipo/relatorio', requireAuth, requirePermission('checklist'), asyncHandler(
  (req, res) => relatorioChecklist(req, res, req.params.idOs, req.params.tipo)
));
router.get('/consultachecklist/relatorio/:idOs/:tipo', requireAuth, requirePermission('checklist'), asyncHandler(
  (req, res) => relatorioChecklist(req, res, req.params.idOs, req.params.tipo)
));

async function registrarBloqueioChecklist(connection, osId, type) {
  const [rows] = await connection.execute(
    'SELECT id FROM tabela_os_checklist_status WHERE id_os=? AND tipo=? FOR UPDATE',
    [osId, type]
  );
  const blockedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (rows[0]) {
    await connection.execute(
      'UPDATE tabela_os_checklist_status SET bloqueado=1,observacao=NULL,data_bloqueio=?,data_finalizacao=NULL WHERE id=?',
      [blockedAt, rows[0].id]
    );
  } else {
    await connection.execute(
      'INSERT INTO tabela_os_checklist_status (id_os,tipo,bloqueado,data_bloqueio) VALUES (?,?,1,?)',
      [osId, type, blockedAt]
    );
  }
}

router.get('/checklists',requireAuth,requirePermission('checklist'),asyncHandler(async(req,res)=>{const f=[],p=[];if(req.query.tipo){f.push('c.tipo=?');p.push(req.query.tipo);}if(req.query.titulo){f.push('c.titulo LIKE ?');p.push(`%${req.query.titulo}%`);}respond(req,res,await query(`SELECT c.*,(SELECT COUNT(*) FROM tabela_checklist_perguntas cp WHERE cp.id_checklist=c.id) qtd_perguntas FROM tabela_checklist c ${f.length?'WHERE '+f.join(' AND '):''} ORDER BY c.id DESC`,p));}));
router.get('/checklists/selecionados',requireAuth,requirePermission('checklist'),asyncHandler(async(req,res)=>respond(req,res,await query('SELECT * FROM tabela_checklist WHERE selecionado=1 ORDER BY tipo'))));
router.get('/checklists/:id/perguntas',requireAuth,requirePermission('checklist'),asyncHandler(async(req,res)=>respond(req,res,await query('SELECT * FROM tabela_checklist_perguntas WHERE id_checklist=? ORDER BY ordem',[id(req.params.id)]))));
router.post('/checklists',requireAuth,requirePermission('checklist'),asyncHandler(async(req,res)=>{const title=String(req.body.titulo??'').trim(),type=req.body.tipo,questions=list(req.body.perguntas??req.body.pergunta);if(!title||!['inicio','fim'].includes(type)||!questions.length)throw new AppError(422,'Checklist, tipo e perguntas são obrigatórios.','VALIDATION_ERROR');const checkId=await transaction(async c=>{const [r]=await c.execute('INSERT INTO tabela_checklist (titulo,tipo) VALUES (?,?)',[title,type]);const answerTypes=list(req.body.tipoResposta??req.body.tipo_resposta), blocks=list(req.body.bloqueiaAbertura??req.body.bloqueia_abertura);for(let i=0;i<questions.length;i++){const text=String(questions[i]).trim();if(!text)throw new AppError(422,'Pergunta inválida.','VALIDATION_ERROR');await c.execute('INSERT INTO tabela_checklist_perguntas (id_checklist,texto_pergunta,ordem,tipo_resposta,bloqueia_abertura) VALUES (?,?,?,?,?)',[r.insertId,text,i+1,answerTypes[i]==='radio'?'radio':'text',blocks[i]||null]);}return r.insertId;});respond(req,res,{id:checkId,mensagem:'Checklist cadastrado.'},201);}));
router.put('/checklists/selecao',requireAuth,requirePermission('checklist'),asyncHandler(async(req,res)=>{const checkId=id(req.body.checklistId??req.body.id_checklist),type=req.body.tipo;if(!['inicio','fim'].includes(type))throw new AppError(422,'Tipo inválido.','VALIDATION_ERROR');await transaction(async c=>{const [r]=await c.execute('SELECT id FROM tabela_checklist WHERE id=? AND tipo=?',[checkId,type]);if(!r[0])throw new AppError(404,'Checklist não encontrado.','NOT_FOUND');await c.execute('UPDATE tabela_checklist SET selecionado=0 WHERE tipo=?',[type]);await c.execute('UPDATE tabela_checklist SET selecionado=1 WHERE id=?',[checkId]);});respond(req,res,{id:checkId,mensagem:'Checklist selecionado.'});}));router.delete('/checklists/:id',requireAuth,requirePermission('checklist'),asyncHandler(async(req,res)=>{await query('DELETE FROM tabela_checklist WHERE id=?',[id(req.params.id)]);res.status(204).end();}));

router.get('/ordens-servico',requireAuth,requirePermission('ordemServico'),asyncHandler(async(req,res)=>{const {page,pageSize,offset}=pageInfo(req);/* O cliente pode filtrar o status, mas não trocar o responsável. */const filters=[],params=[];if(req.user.eletricistaId){filters.push('os.eletricista_os=?');params.push(req.user.eletricistaId);}if(req.query.status&&req.query.status!=='todas'){if(!['solicitada','aberta','bloqueada','fechada'].includes(req.query.status))throw new AppError(422,'Status inválido.','VALIDATION_ERROR');filters.push('os.status=?');params.push(req.query.status);}const where=filters.length?'WHERE '+filters.join(' AND '):'';const [totalRows,rows,eletricistasAtivos,produtosDisponiveis,checklists]=await Promise.all([query(`SELECT COUNT(*) total FROM tabela_ordens_servico os ${where}`,params),query(`SELECT os.*,e.nome nome_eletricista FROM tabela_ordens_servico os JOIN tabela_eletricistas e ON e.id=os.eletricista_os ${where} ORDER BY os.id DESC LIMIT ? OFFSET ?`,[...params,pageSize,offset]),query(`SELECT id,nome FROM tabela_eletricistas WHERE data_demissao IS NULL ${req.user.eletricistaId?'AND id=?':''} ORDER BY nome`,req.user.eletricistaId?[req.user.eletricistaId]:[]),query('SELECT id,nome_produto,qtd_estoque FROM tabela_produtos WHERE qtd_estoque>0 ORDER BY nome_produto'),query('SELECT c.*,p.id pergunta_id,p.texto_pergunta,p.tipo_resposta,p.bloqueia_abertura FROM tabela_checklist c LEFT JOIN tabela_checklist_perguntas p ON p.id_checklist=c.id WHERE c.selecionado=1 ORDER BY p.ordem')]);const grouped=Object.groupBy(checklists,c=>c.tipo);const mapChecklist=(type)=>grouped[type]?.length?{...grouped[type][0],perguntas:grouped[type].map(p=>({...p,id:p.pergunta_id,pergunta:p.texto_pergunta,tipo_resposta:p.tipo_resposta==='radio'?'sim_nao':'text',bloqueia_normalizado:p.bloqueia_abertura}))}:null;respond(req,res,{ordensServico:rows,eletricistasAtivos,produtosDisponiveis,checklistInicio:mapChecklist('inicio'),checklistFim:mapChecklist('fim'),podeSolicitar:canManageOrders(req.user),paginacao:{page,pageSize,total:totalRows[0].total}});}));
router.get('/ordens-servico/opcoes',requireAuth,requirePermission('ordemServico'),asyncHandler(async(req,res)=>respond(req,res,{eletricistas:await query(`SELECT id,nome FROM tabela_eletricistas WHERE data_demissao IS NULL ${req.user.eletricistaId?'AND id=?':''} ORDER BY nome`,req.user.eletricistaId?[req.user.eletricistaId]:[]),produtos:await query('SELECT id,nome_produto,qtd_estoque FROM tabela_produtos WHERE qtd_estoque>0 ORDER BY nome_produto'),checklists:await query('SELECT * FROM tabela_checklist WHERE selecionado=1'),podeSolicitar:canManageOrders(req.user)})));
router.get('/ordens-servico/:id',requireAuth,requirePermission('ordemServico'),asyncHandler(async(req,res)=>{const os=await item('SELECT os.*,e.nome nome_eletricista FROM tabela_ordens_servico os JOIN tabela_eletricistas e ON e.id=os.eletricista_os WHERE os.id=?',[id(req.params.id)]);if(!canManageOrders(req.user)&&Number(os.eletricista_os)!==Number(req.user.eletricistaId))throw new AppError(403,'Esta OS não pertence ao usuário atual.','FORBIDDEN');const [materiais,respostas,comentarios]=await Promise.all([query('SELECT m.*,p.nome_produto FROM tabela_os_materiais m JOIN tabela_produtos p ON p.id=m.id_produto WHERE m.id_os=?',[os.id]),query('SELECT r.*,p.texto_pergunta,c.tipo FROM tabela_os_checklist_respostas r JOIN tabela_checklist_perguntas p ON p.id=r.id_pergunta JOIN tabela_checklist c ON c.id=p.id_checklist WHERE r.id_os=? ORDER BY p.ordem',[os.id]),query('SELECT * FROM tabela_os_comentarios WHERE id_os=? ORDER BY data_comentario DESC',[os.id])]);respond(req,res,{...os,materiais,respostas,comentarios});}));
router.post('/ordens-servico',requireAuth,requireOrderManager,asyncHandler(async(req,res)=>{const elec=id(req.body.eletricistaId??req.body.eletricista_os);const data=req.body.dataOs??req.body.data_os??today();const r=await query("INSERT INTO tabela_ordens_servico (eletricista_os,data_os,status) VALUES (?,?,'solicitada')",[elec,data]);respond(req,res,{id:r.insertId,mensagem:'Ordem de serviço solicitada.'},201);}));
async function ownOs(req){const os=await item('SELECT * FROM tabela_ordens_servico WHERE id=?',[id(req.params.id)]);if(!canManageOrders(req.user)&&Number(os.eletricista_os)!==Number(req.user.eletricistaId))throw new AppError(403,'Esta OS não pertence ao usuário atual.','FORBIDDEN');return os;}
const answers=(body)=>{const raw=body.checklistRespostas??body.checklist_resposta??{};if(typeof raw==='string'){try{return JSON.parse(raw);}catch{return list(raw).reduce((a,v,i)=>(a[i]=v,a),{});}}return raw;};
router.post('/ordens-servico/:id/abertura',requireAuth,requirePermission('ordemServico'),asyncHandler(async(req,res)=>{
  const os=await ownOs(req);
  if(os.status!=='solicitada')throw new AppError(409,'A OS não está disponível para abertura.','INVALID_STATE');
  const itemsRaw=req.body.itens?JSON.parse(req.body.itens):list(req.body.id_produto).map((p,i)=>({produtoId:p,quantidade:list(req.body.qtd_utilizada)[i]}));
  const resp=answers(req.body);
  const result=await transaction(async c=>{
    let blocked=false;
    const [questions]=await c.execute("SELECT p.* FROM tabela_checklist c JOIN tabela_checklist_perguntas p ON p.id_checklist=c.id WHERE c.tipo='inicio' AND c.selecionado=1 ORDER BY p.ordem");
    if(!questions.length)throw new AppError(409,'Não há checklist de início selecionado.','CHECKLIST_REQUIRED');
    for(const q of questions){
      const val=resp[q.id]??resp[String(q.id)];
      if(val==null||val==='')throw new AppError(422,'Todas as perguntas do checklist devem ser respondidas.','VALIDATION_ERROR');
      if(q.bloqueia_abertura&&String(val)===String(q.bloqueia_abertura))blocked=true;
      await c.execute('INSERT INTO tabela_os_checklist_respostas (id_os,id_pergunta,resposta) VALUES (?,?,?)',[os.id,q.id,String(val)]);
    }
    if(blocked)await registrarBloqueioChecklist(c,os.id,'inicio');
    for(const row of itemsRaw){
      const productId=id(row.produtoId??row.id),qty=number(row.quantidade??row.qtd,'Quantidade');
      if(!Number.isInteger(qty)||qty<=0)throw new AppError(422,'Quantidade inválida.','VALIDATION_ERROR');
      const [products]=await c.execute('SELECT * FROM tabela_produtos WHERE id=? FOR UPDATE',[productId]);
      if(!products[0]||products[0].qtd_estoque<qty)throw new AppError(409,'Estoque insuficiente.','INSUFFICIENT_STOCK');
      const p=products[0];
      await c.execute('INSERT INTO tabela_os_materiais (id_os,id_produto,qtd_utilizada) VALUES (?,?,?)',[os.id,productId,qty]);
      await c.execute('UPDATE tabela_produtos SET qtd_estoque=qtd_estoque-? WHERE id=?',[qty,productId]);
      await c.execute("INSERT INTO tabela_movimentacoes (id_produto,tipo,quantidade,valor_unitario,data_mov,origem,id_os) VALUES (?,'saida',?,?,?,?,?)",[productId,qty,p.vlr_unitario,os.data_os,`OS #${String(os.id).padStart(5,'0')}`,os.id]);
    }
    await c.execute('UPDATE tabela_ordens_servico SET status=? WHERE id=?',[blocked?'bloqueada':'aberta',os.id]);
    return blocked;
  });
  respond(req,res,{id:os.id,bloqueada:result,mensagem:'Ordem de serviço aberta.'});
}));
router.post('/ordens-servico/:id/fechamento',requireAuth,requirePermission('ordemServico'),asyncHandler(async(req,res)=>{
  const os=await ownOs(req);
  if(!['aberta','bloqueada'].includes(os.status))throw new AppError(409,'A OS não está disponível para fechamento.','INVALID_STATE');
  const resp=answers(req.body);
  await transaction(async c=>{
    const [questions]=await c.execute("SELECT p.* FROM tabela_checklist c JOIN tabela_checklist_perguntas p ON p.id_checklist=c.id WHERE c.tipo='fim' AND c.selecionado=1 ORDER BY p.ordem");
    if(!questions.length)throw new AppError(409,'Não há checklist de fim selecionado.','CHECKLIST_REQUIRED');
    let blocked=false;
    for(const q of questions){
      const val=resp[q.id]??resp[String(q.id)];
      if(val==null||val==='')throw new AppError(422,'Todas as perguntas do checklist devem ser respondidas.','VALIDATION_ERROR');
      if(q.bloqueia_abertura&&String(val)===String(q.bloqueia_abertura))blocked=true;
      await c.execute('INSERT INTO tabela_os_checklist_respostas (id_os,id_pergunta,resposta,motivo_nao) VALUES (?,?,?,?)',[os.id,q.id,String(val),(typeof req.body.motivos==='object'?req.body.motivos[q.id]:req.body.motivos)||null]);
    }
    if(blocked)await registrarBloqueioChecklist(c,os.id,'fim');
    await c.execute('UPDATE tabela_ordens_servico SET status=?,data_fechamento=? WHERE id=?',[blocked?'bloqueada':'fechada',blocked?null:today(),os.id]);
  });
  respond(req,res,{id:os.id,mensagem:'Ordem de serviço fechada.'});
}));
router.post('/ordens-servico/:id/comentarios',requireAuth,requirePermission('ordemServico'),asyncHandler(async(req,res)=>{const os=await ownOs(req);const comment=String(req.body.comentario??'').trim();if(!comment)throw new AppError(422,'Comentário é obrigatório.','VALIDATION_ERROR');const r=await query('INSERT INTO tabela_os_comentarios (id_os,comentario) VALUES (?,?)',[os.id,comment]);respond(req,res,{id:r.insertId,mensagem:'Comentário adicionado.'},201);}));

router.get('/movimentacoes',requireAuth,requirePermission('baixas'),asyncHandler(async(req,res)=>{
  const filters=[],params=[];
  for(const [key,column] of [['tipo','m.tipo'],['produtoId','m.id_produto'],['id_produto','m.id_produto']]){
    if(req.query[key]){filters.push(`${column}=?`);params.push(req.query[key]);}
  }
  const dateStart=req.query.dataInicio??req.query.data_inicio;
  const dateEnd=req.query.dataFim??req.query.data_fim;
  if(dateStart){filters.push('m.data_mov>=?');params.push(dateStart);}
  if(dateEnd){filters.push('m.data_mov<=?');params.push(dateEnd);}
  const rows=await query(
    `SELECT m.*,p.nome_produto,(m.quantidade*m.valor_unitario) AS valor_total
      FROM tabela_movimentacoes m
      JOIN tabela_produtos p ON p.id=m.id_produto
      ${filters.length?'WHERE '+filters.join(' AND '):''}
      ORDER BY m.data_mov DESC,m.id DESC`,
    params
  );
  respond(req,res,rows);
}));
router.get('/movimentacoes/totais',requireAuth,requirePermission('baixas'),asyncHandler(async(_req,res)=>ok(res,(await query("SELECT COALESCE(SUM(CASE WHEN tipo='entrada' THEN quantidade*valor_unitario END),0) totalEntrada,COALESCE(SUM(CASE WHEN tipo='saida' THEN quantidade*valor_unitario END),0) totalSaida FROM tabela_movimentacoes"))[0])));
router.post('/movimentacoes/relatorio',requireAuth,requirePermission('baixas'),asyncHandler(async(req,res)=>{const ids=list(req.body.ids).map(id);if(!ids.length)throw new AppError(422,'Selecione ao menos uma movimentação.','VALIDATION_ERROR');const marks=ids.map(()=>'?').join(',');respond(req,res,await query(`SELECT m.*,p.nome_produto FROM tabela_movimentacoes m JOIN tabela_produtos p ON p.id=m.id_produto WHERE m.id IN (${marks})`,ids));}));
router.get('/baixas/:id',requireAuth,requirePermission('baixas'),asyncHandler(async(req,res)=>{const baixa=await item('SELECT b.*,e.nome eletricista_nome FROM tabela_baixas b JOIN tabela_eletricistas e ON e.id=b.id_eletricista WHERE b.id=?',[id(req.params.id)]);const itens=await query('SELECT i.*,p.nome_produto FROM tabela_baixa_itens i JOIN tabela_produtos p ON p.id=i.id_produto WHERE i.id_baixa=?',[baixa.id]);respond(req,res,{...baixa,itens});}));

router.get('/lancamentos',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{const [produtos,eletricistas,rascunhos]=await Promise.all([query('SELECT * FROM tabela_produtos ORDER BY nome_produto'),query('SELECT * FROM tabela_eletricistas WHERE data_demissao IS NULL ORDER BY nome'),query("SELECT * FROM tabela_baixas WHERE id_usuario=? AND status='rascunho'",[req.user.id])]);const abas={entrada:{rascunho:null,itens:[]},saida:{rascunho:null,itens:[]}};for(const r of rascunhos){const itens=await query('SELECT i.*,p.nome_produto FROM tabela_baixa_itens i JOIN tabela_produtos p ON p.id=i.id_produto WHERE i.id_baixa=?',[r.id]);abas[r.tipo]={rascunho:r,itens};}respond(req,res,{produtos,eletricistas,abas,rascunhos});}));
router.post('/lancamentos',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{const type=req.body.tipo,data=req.body.dataBaixa??req.body.data_baixa,elec=id(req.body.eletricistaId??req.body.id_eletricista);if(!['entrada','saida'].includes(type)||!data||data>today())throw new AppError(422,'Dados da baixa inválidos.','VALIDATION_ERROR');try{const r=await query("INSERT INTO tabela_baixas (tipo,data_baixa,id_eletricista,observacao,status,id_usuario,data_abertura) VALUES (?,?,?,?, 'rascunho',?,NOW())",[type,data,elec,req.body.observacao||null,req.user.id]);respond(req,res,{id:r.insertId,mensagem:'Lançamento aberto.'},201);}catch(e){throw e;}}));
router.post('/lancamentos/:id/itens',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{const b=id(req.params.id),p=id(req.body.produtoId??req.body.id_produto),q=number(req.body.quantidade,'Quantidade'),v=number(req.body.valorUnitario??req.body.valor_unitario,'Valor unitário');if(!Number.isInteger(q)||q<=0||v<0)throw new AppError(422,'Item inválido.','VALIDATION_ERROR');const r=await query('INSERT INTO tabela_baixa_itens (id_baixa,id_produto,quantidade,valor_unitario) VALUES (?,?,?,?)',[b,p,q,v]);respond(req,res,{id:r.insertId,mensagem:'Item incluído.'},201);}));
router.delete('/lancamentos/:id/itens/:itemId',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{await query('DELETE FROM tabela_baixa_itens WHERE id=? AND id_baixa=?',[id(req.params.itemId),id(req.params.id)]);res.status(204).end();}));
router.post('/lancamentos/:id/finalizacao',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{const bid=id(req.params.id);await transaction(async c=>{const [b]=await c.execute("SELECT * FROM tabela_baixas WHERE id=? AND status='rascunho' FOR UPDATE",[bid]);if(!b[0])throw new AppError(409,'Baixa não está em rascunho.','INVALID_STATE');const [items]=await c.execute('SELECT * FROM tabela_baixa_itens WHERE id_baixa=?',[bid]);if(!items.length)throw new AppError(422,'Inclua ao menos um item.','VALIDATION_ERROR');for(const i of items){const [products]=await c.execute('SELECT * FROM tabela_produtos WHERE id=? FOR UPDATE',[i.id_produto]);if(!products[0]||(b[0].tipo==='saida'&&products[0].qtd_estoque<i.quantidade))throw new AppError(409,'Estoque insuficiente.','INSUFFICIENT_STOCK');await c.execute(`UPDATE tabela_produtos SET qtd_estoque=qtd_estoque ${b[0].tipo==='entrada'?'+':'-'} ? WHERE id=?`,[i.quantidade,i.id_produto]);await c.execute('INSERT INTO tabela_movimentacoes (id_produto,tipo,quantidade,valor_unitario,data_mov,origem,id_baixa,id_usuario) VALUES (?,?,?,?,?,?,?,?)',[i.id_produto,b[0].tipo,i.quantidade,i.valor_unitario,b[0].data_baixa,`Baixa #${bid}`,bid,req.user.id]);}await c.execute("UPDATE tabela_baixas SET status='finalizada',data_finalizacao=NOW() WHERE id=?",[bid]);});respond(req,res,{id:bid,mensagem:'Lançamento finalizado.'});}));
router.post('/lancamentos/:id/cancelamento',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{const bid=id(req.params.id);await query("UPDATE tabela_baixas SET status='cancelada' WHERE id=? AND status='rascunho'",[bid]);respond(req,res,{id:bid,mensagem:'Lançamento cancelado.'});}));router.get('/lancamentos/:id/relatorio',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{const b=await item('SELECT * FROM tabela_baixas WHERE id=?',[id(req.params.id)]);const itens=await query('SELECT i.*,p.nome_produto FROM tabela_baixa_itens i JOIN tabela_produtos p ON p.id=i.id_produto WHERE i.id_baixa=?',[b.id]);respond(req,res,{...b,itens});}));

// O mesmo serviço filtra todos os indicadores pelo eletricista autenticado.
router.get('/dashboard',requireAuth,requirePermission('menu'),asyncHandler(async(req,res)=>respond(req,res,await obterDashboard(req.user,req.query))));
router.post('/chat',requireAuth,requireManagement,asyncHandler(async(req,res)=>{if(!env.flowiseApiUrl)throw new AppError(503,'FLOWISE_API_URL não está configurada.','CHAT_UNAVAILABLE');const response=await fetch(env.flowiseApiUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:req.body.mensagem??req.body.question})});if(!response.ok)throw new AppError(502,'Não foi possível consultar o assistente.','CHAT_ERROR');respond(req,res,await response.json());}));

export default router;
