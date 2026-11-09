import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler, created, legacy, ok } from '../shared/http.js';
import { requireAdmin, requireAuth, requirePermission, requireManagement } from '../middlewares/auth.js';

import { permissions, electricianPermissions, supervisorPermissions, supervisorMarker, normalizedUser } from '../shared/access.js';
import { obterDashboard } from '../services/dashboard.service.js';

import authRoutes from './auth/auth.routes.js';
import supervisorRoutes from './supervisores/supervisores.routes.js';
import teamRoutes from './supervisores/equipe.routes.js';
import goalRoutes from './metas/metas.routes.js';
import checklistRoutes from './checklist/checklist.routes.js';
import orderRoutes from './ordens-servico/ordens.routes.js';
import { movements, launches, baixaReport } from './baixas/baixas.routes.js';
import { id, amount as number, list, today, pageInfo, date, text, invalid } from '../shared/validation.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/supervisores', supervisorRoutes);
router.use('/equipe', teamRoutes);
router.use('/metas', goalRoutes);
router.use('/checklists', checklistRoutes);
router.use('/ordens-servico', orderRoutes);
router.use('/movimentacoes', movements);
router.use('/lancamentos', launches);
router.get('/baixas/:id', requireAuth, requirePermission('baixas'), asyncHandler(async (req,res) => ok(res,await baixaReport(req.params.id))));
const item = async (sql, params, msg = 'Registro não encontrado.') => { const rows = await query(sql, params); if (!rows[0]) throw new AppError(404, msg, 'NOT_FOUND'); return rows[0]; };
const isLegacy = (req) => req.path.startsWith('/legacy/');
const respond = (req, res, data, status = 200, meta) => isLegacy(req) ? legacy(res, data, status) : status === 201 ? created(res, data) : ok(res, data, meta);

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
  const [active] = await connection.execute('SELECT id FROM tabela_eletricistas WHERE id=? AND data_demissao IS NULL FOR UPDATE',[electricId]);
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
  const usuario = text(req.body.usuario, 'Usuário', 50), senha = String(req.body.senha ?? '');
  if (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) throw new AppError(422,'Usuário e senha (8 a 72 caracteres) são obrigatórios.','VALIDATION_ERROR');
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
  const userId=id(req.params.id);
  if (req.body.senha && (String(req.body.senha).length < 8 || Buffer.byteLength(String(req.body.senha),'utf8') > 72)) throw invalid('A senha deve ter entre 8 e 72 caracteres (até 72 bytes).');
  await transaction(async c => {
    // Serializa alterações administrativas antes de revalidar o perfil atual.
    const [admins]=await c.execute('SELECT id FROM tabela_usuarios WHERE is_admin=1 ORDER BY id FOR UPDATE');
    const [rows]=await c.execute('SELECT * FROM tabela_usuarios WHERE id=? FOR UPDATE',[userId]);
    const current=rows[0];
    if (!current) throw new AppError(404,'Usuário não encontrado.','NOT_FOUND');
    const [stored]=await c.execute('SELECT permissao FROM tabela_usuario_permissao WHERE usuario_id=?',[userId]);
    const profile=normalizedUser({...current,permissoes:stored.map(row=>row.permissao)});
    const {electricId,isAdmin,perms}=userAccess(req.body,{...current,perfil:profile.perfil,permissoes:profile.permissoes});
    if (Number(current.is_admin)===1 && !isAdmin && admins.length===1) throw new AppError(409,'Não é possível remover o último administrador.','LAST_ADMIN');
    const username=text(req.body.usuario??current.usuario,'Usuário',50);
    const [duplicate]=await c.execute('SELECT id FROM tabela_usuarios WHERE usuario=? AND id<>?',[username,userId]);
    if (duplicate.length) throw new AppError(409,'Nome de usuário já utilizado.','CONFLICT');
    await validateElectricianLink(c,electricId,userId);
    if (!perms.includes(supervisorMarker)) await c.execute('DELETE FROM tabela_supervisor_eletricista WHERE supervisor_id=?',[userId]);
    await c.execute('UPDATE tabela_usuarios SET usuario=?,is_admin=?,eletricista_id=? WHERE id=?',[username,isAdmin?1:0,electricId,userId]);
    if (req.body.senha) {
      await c.execute('UPDATE tabela_usuarios SET senha=?,sessao_versao=sessao_versao+1 WHERE id=?',[await bcrypt.hash(String(req.body.senha),10),userId]);
      await c.execute('DELETE FROM tabela_sessoes WHERE usuario_id=?',[userId]);
    }
    await c.execute('DELETE FROM tabela_usuario_permissao WHERE usuario_id=?',[userId]);
    for (const p of perms) await c.execute('INSERT INTO tabela_usuario_permissao (usuario_id,permissao) VALUES (?,?)',[userId,p]);
  });
  respond(req,res,{id:userId,mensagem:'Usuário atualizado com sucesso.'});
}));
router.delete('/usuarios/:id', requireAuth, requireAdmin, asyncHandler(async (req,res) => {
  const userId = id(req.params.id);
  await transaction(async c => {
    const [admins] = await c.execute('SELECT id FROM tabela_usuarios WHERE is_admin=1 ORDER BY id FOR UPDATE');
    const [rows] = await c.execute('SELECT id,is_admin FROM tabela_usuarios WHERE id=? FOR UPDATE',[userId]);
    if (!rows[0]) throw new AppError(404,'Usuário não encontrado.','NOT_FOUND');
    if (Number(rows[0].is_admin) === 1 && admins.length === 1) throw new AppError(409,'Não é possível excluir o último administrador.','LAST_ADMIN');
    await c.execute('DELETE FROM tabela_usuarios WHERE id=?',[userId]);
  });
  res.status(204).end();
}));

router.get('/eletricistas', requireAuth, requirePermission('eletricistas'), asyncHandler(async (req,res) => {
  const rows = await query(`SELECT e.*,u.id usuario_id,su.usuario supervisor,
    (SELECT COUNT(*) FROM tabela_ordens_servico os WHERE os.eletricista_os=e.id AND os.status='fechada') total_os,
    (SELECT COALESCE(SUM(m.vlr_meta),0) FROM tabela_metas m WHERE m.eletricista_meta=e.id AND m.tipo_periodo='mensal' AND m.mes_meta=?) meta_atual
    FROM tabela_eletricistas e LEFT JOIN tabela_usuarios u ON u.eletricista_id=e.id
    LEFT JOIN tabela_supervisor_eletricista se ON se.eletricista_id=e.id LEFT JOIN tabela_usuarios su ON su.id=se.supervisor_id
    ${req.query.status==='ativos' ? 'WHERE e.data_demissao IS NULL' : ''} ORDER BY e.nome`,[today().slice(0,7)]);
  respond(req,res,rows);
}));
router.post('/eletricistas', requireAuth, requirePermission('eletricistas'), asyncHandler(async (req,res) => {
  const nome = text(req.body.nome,'Nome',100), cpf = String(req.body.cpf ?? '').replace(/\D/g,''), data = date(req.body.dataContratacao ?? req.body.data_contratacao);
  const senha = String(req.body.senha ?? '');
  if (cpf.length !== 11 || data > today() || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) throw invalid('Informe CPF com 11 dígitos, contratação não futura e senha entre 8 e 72 caracteres.');
  const newId = await transaction(async c => {
    const [existing] = await c.execute('SELECT id FROM tabela_eletricistas WHERE cpf=?',[cpf]);
    if (existing.length) throw new AppError(409,'CPF já cadastrado.','CONFLICT');
    const [e] = await c.execute('INSERT INTO tabela_eletricistas (nome,cpf,data_contratacao) VALUES (?,?,?)',[nome,cpf,data]);
    const [user] = await c.execute('INSERT INTO tabela_usuarios (usuario,senha,is_admin,eletricista_id) VALUES (?,?,0,?)',[cpf,await bcrypt.hash(senha,10),e.insertId]);
    for (const p of electricianPermissions) await c.execute('INSERT INTO tabela_usuario_permissao (usuario_id,permissao) VALUES (?,?)',[user.insertId,p]);
    return e.insertId;
  });
  respond(req,res,{id:newId,mensagem:'Eletricista cadastrado com usuário de acesso.'},201);
}));
// Informar uma senha também libera o login de eletricistas antigos sem conta vinculada.
router.put('/eletricistas/:id', requireAuth, requirePermission('eletricistas'), asyncHandler(async (req,res) => {
  const electricId = id(req.params.id);
  const electric = await item('SELECT id,cpf FROM tabela_eletricistas WHERE id=?', [electricId]);
  if (req.body.senha && (String(req.body.senha).length < 8 || Buffer.byteLength(String(req.body.senha),'utf8') > 72)) throw invalid('A senha deve ter entre 8 e 72 caracteres.');
  await transaction(async c => {
    await c.execute('SELECT id FROM tabela_eletricistas WHERE id=? FOR UPDATE',[electricId]);
    if (req.body.nome != null) await c.execute('UPDATE tabela_eletricistas SET nome=? WHERE id=?', [text(req.body.nome,'Nome',100),electricId]);
    if (req.body.senha) {
      const password = await bcrypt.hash(String(req.body.senha),10);
      const [users] = await c.execute('SELECT id FROM tabela_usuarios WHERE eletricista_id=?', [electricId]);
      if (users[0]) {
        await c.execute('UPDATE tabela_usuarios SET senha=?,sessao_versao=sessao_versao+1 WHERE eletricista_id=?', [password,electricId]);
        await c.execute('DELETE FROM tabela_sessoes WHERE usuario_id=?',[users[0].id]);
      } else {
        const [user] = await c.execute('INSERT INTO tabela_usuarios (usuario,senha,is_admin,eletricista_id) VALUES (?,?,0,?)', [String(electric.cpf).replace(/\D/g,''),password,electricId]);
        for (const p of electricianPermissions) await c.execute('INSERT INTO tabela_usuario_permissao (usuario_id,permissao) VALUES (?,?)', [user.insertId,p]);
      }
    }
  });
  respond(req,res,{id:electricId,mensagem:'Eletricista atualizado com sucesso.'});
}));
router.patch('/eletricistas/:id/demissao',requireAuth,requirePermission('eletricistas'),asyncHandler(async (req,res) => {
  const electricId=id(req.params.id);
  await transaction(async c => {
    const [rows]=await c.execute('SELECT id FROM tabela_eletricistas WHERE id=? FOR UPDATE',[electricId]);
    if (!rows[0]) throw new AppError(404,'Eletricista não encontrado.','NOT_FOUND');
    await c.execute('UPDATE tabela_eletricistas SET data_demissao=? WHERE id=?',[today(),electricId]);
    await c.execute('DELETE FROM tabela_supervisor_eletricista WHERE eletricista_id=?',[electricId]);
    const [users]=await c.execute('SELECT id FROM tabela_usuarios WHERE eletricista_id=?',[electricId]);
    await c.execute('UPDATE tabela_usuarios SET sessao_versao=sessao_versao+1 WHERE eletricista_id=?',[electricId]);
    for (const u of users) await c.execute('DELETE FROM tabela_sessoes WHERE usuario_id=?',[u.id]);
  });
  respond(req,res,{mensagem:'Eletricista desligado e removido da equipe.'});
}));
router.patch('/eletricistas/:id/reativacao',requireAuth,requirePermission('eletricistas'),asyncHandler(async(req,res)=>{const electricId=id(req.params.id);await query('UPDATE tabela_eletricistas SET data_demissao=NULL WHERE id=?',[electricId]);respond(req,res,{id:electricId,mensagem:'Eletricista reativado.'});}));
router.get('/eletricistas/:id/ordens-servico',requireAuth,requirePermission('eletricistas'),asyncHandler(async(req,res)=>respond(req,res,await query('SELECT * FROM tabela_ordens_servico WHERE eletricista_os=? ORDER BY id DESC',[id(req.params.id)]))));

router.get('/produtos',requireAuth,requirePermission('produtos'),asyncHandler(async(req,res)=>respond(req,res,await query('SELECT * FROM tabela_produtos ORDER BY id DESC'))));
router.post('/produtos',requireAuth,requirePermission('produtos'),asyncHandler(async(req,res)=>{const name=text(req.body.nomeProduto??req.body.nome_produto,'Nome do produto',100), price=number(req.body.vlrUnitario??req.body.vlr_unitario,'Valor unitário'), qty=Math.max(0,number(req.body.qtdEstoque??req.body.qtd_estoque??0,'Quantidade'));if(!name||!Number.isInteger(qty)||price<0)throw new AppError(422,'Dados do produto inválidos.','VALIDATION_ERROR');const newId=await transaction(async c=>{const [p]=await c.execute('INSERT INTO tabela_produtos (nome_produto,vlr_unitario,qtd_estoque) VALUES (?,?,?)',[name,price,qty]);if(qty)await c.execute("INSERT INTO tabela_movimentacoes (id_produto,tipo,quantidade,valor_unitario,data_mov,origem,id_usuario) VALUES (?,'entrada',?,?,?,'Estoque inicial (cadastro)',?)",[p.insertId,qty,price,today(),req.user.id]);return p.insertId;});respond(req,res,{id:newId,mensagem:'Produto cadastrado com sucesso.'},201);}));
router.put('/produtos/:id',requireAuth,requirePermission('produtos'),asyncHandler(async(req,res)=>{const productId=id(req.params.id);await item('SELECT * FROM tabela_produtos WHERE id=?',[productId]);const name=text(req.body.nomeProduto??req.body.nome_produto,'Nome do produto',100),price=number(req.body.vlrUnitario??req.body.vlr_unitario,'Valor unitário');await query('UPDATE tabela_produtos SET nome_produto=?,vlr_unitario=? WHERE id=?',[name,price,productId]);respond(req,res,{id:productId,mensagem:'Produto atualizado.'});}));
async function stock(req,res,mode){const productId=id(req.params.id);const qty=mode==='zero'?null:number(req.body.quantidade??req.body.qtd_estoque,'Quantidade');const result=await transaction(async c=>{const [rows]=await c.execute('SELECT * FROM tabela_produtos WHERE id=? FOR UPDATE',[productId]);if(!rows[0])throw new AppError(404,'Produto não encontrado.','NOT_FOUND');const p=rows[0], amount=mode==='zero'?p.qtd_estoque:qty;if(amount<=0||!Number.isInteger(amount))throw new AppError(422,'Quantidade deve ser um inteiro positivo.','VALIDATION_ERROR');const type=mode==='zero'?'saida':'entrada';await c.execute(`UPDATE tabela_produtos SET qtd_estoque=qtd_estoque ${type==='saida'?'-':'+'} ? WHERE id=?`,[amount,productId]);await c.execute('INSERT INTO tabela_movimentacoes (id_produto,tipo,quantidade,valor_unitario,data_mov,origem,id_usuario) VALUES (?,?,?,?,?,?,?)',[productId,type,amount,p.vlr_unitario,today(),mode==='zero'?'Baixa manual de estoque':'Reposição de estoque',req.user.id]);return amount;});respond(req,res,{id:productId,quantidade:result,mensagem:'Estoque atualizado.'});}
router.post('/produtos/:id/zerar-estoque',requireAuth,requirePermission('produtos'),asyncHandler((req,res)=>stock(req,res,'zero')));router.post('/produtos/:id/entrada-estoque',requireAuth,requirePermission('produtos'),asyncHandler((req,res)=>stock(req,res,'entry')));

// O mesmo serviço filtra todos os indicadores pelo eletricista autenticado.
router.get('/dashboard',requireAuth,requirePermission('menu'),asyncHandler(async(req,res)=>respond(req,res,await obterDashboard(req.user,req.query))));
router.post('/chat',requireAuth,requireManagement,asyncHandler(async(req,res)=>{if(!env.flowiseApiUrl)throw new AppError(503,'FLOWISE_API_URL não está configurada.','CHAT_UNAVAILABLE');const response=await fetch(env.flowiseApiUrl,{method:'POST',headers:{'content-type':'application/json'},signal:AbortSignal.timeout(30000),body:JSON.stringify({question:text(req.body.mensagem??req.body.question,'Mensagem',4000)})});if(!response.ok)throw new AppError(502,'Não foi possível consultar o assistente.','CHAT_ERROR');const data=await response.json();respond(req,res,{resposta:data.resposta??data.text??data.answer??''});}));

export default router;
