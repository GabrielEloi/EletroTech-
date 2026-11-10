import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../../config/database.js';
import { requireAuth, requireAdmin } from '../../middlewares/auth.js';
import { supervisorMarker, supervisorPermissions } from '../../shared/access.js';
import { AppError, asyncHandler, ok, created } from '../../shared/http.js';
import { id, list, text, invalid } from '../../shared/validation.js';

const router = Router();
router.use(requireAuth, requireAdmin);

async function supervisor(connection, supervisorId) {
  const [rows] = await connection.execute(`SELECT u.id,u.usuario FROM tabela_usuarios u
    WHERE u.id=? AND u.is_admin=0 AND u.eletricista_id IS NULL
    AND EXISTS (SELECT 1 FROM tabela_usuario_permissao p WHERE p.usuario_id=u.id AND p.permissao=?) FOR UPDATE`, [supervisorId, supervisorMarker]);
  if (!rows[0]) throw new AppError(404, 'Supervisor não encontrado.', 'NOT_FOUND');
  return rows[0];
}

router.get('/', asyncHandler(async (_req, res) => {
  const [supervisores, eletricistas] = await Promise.all([
    query(`SELECT u.id,u.usuario FROM tabela_usuarios u WHERE u.is_admin=0 AND u.eletricista_id IS NULL
      AND EXISTS (SELECT 1 FROM tabela_usuario_permissao p WHERE p.usuario_id=u.id AND p.permissao=?) ORDER BY u.usuario`, [supervisorMarker]),
    query(`SELECT e.id,e.nome,e.data_demissao,se.supervisor_id,u.usuario supervisor
      FROM tabela_eletricistas e LEFT JOIN tabela_supervisor_eletricista se ON se.eletricista_id=e.id
      LEFT JOIN tabela_usuarios u ON u.id=se.supervisor_id ORDER BY e.nome`),
  ]);
  ok(res, { supervisores: supervisores.map(s => ({ ...s, equipe: eletricistas.filter(e => Number(e.supervisor_id) === Number(s.id)) })), eletricistasAtivos: eletricistas.filter(e => !e.data_demissao) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const usuario = text(req.body.usuario, 'Usuário', 50);
  const senha = String(req.body.senha ?? '');
  if (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) throw invalid('A senha deve ter entre 8 e 72 caracteres.');
  const supervisorId = await transaction(async c => {
    const [existing] = await c.execute('SELECT id FROM tabela_usuarios WHERE usuario=?', [usuario]);
    if (existing.length) throw new AppError(409, 'Nome de usuário já utilizado.', 'CONFLICT');
    const [result] = await c.execute('INSERT INTO tabela_usuarios (usuario,senha,is_admin,eletricista_id) VALUES (?,?,0,NULL)', [usuario, await bcrypt.hash(senha, 10)]);
    for (const p of [...supervisorPermissions, supervisorMarker]) await c.execute('INSERT INTO tabela_usuario_permissao (usuario_id,permissao) VALUES (?,?)', [result.insertId, p]);
    return result.insertId;
  });
  created(res, { id: supervisorId, mensagem: 'Supervisor cadastrado. Associe os eletricistas da equipe.' });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const supervisorId = id(req.params.id);
  const usuario = text(req.body.usuario, 'Usuário', 50);
  const senha = req.body.senha ? String(req.body.senha) : '';
  if (senha && (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72)) throw invalid('A senha deve ter entre 8 e 72 caracteres.');
  await transaction(async c => {
    await supervisor(c, supervisorId);
    const [existing] = await c.execute('SELECT id FROM tabela_usuarios WHERE usuario=? AND id<>?', [usuario, supervisorId]);
    if (existing.length) throw new AppError(409, 'Nome de usuário já utilizado.', 'CONFLICT');
    await c.execute('UPDATE tabela_usuarios SET usuario=? WHERE id=?', [usuario, supervisorId]);
    if (senha) {
      await c.execute('UPDATE tabela_usuarios SET senha=?,sessao_versao=sessao_versao+1 WHERE id=?', [await bcrypt.hash(senha, 10), supervisorId]);
      await c.execute('DELETE FROM tabela_sessoes WHERE usuario_id=?', [supervisorId]);
    }
  });
  ok(res, { mensagem: 'Supervisor atualizado.' });
}));

router.put('/:id/equipe', asyncHandler(async (req, res) => {
  const supervisorId = id(req.params.id);
  const ids = [...new Set(list(req.body.eletricistaIds).map(id))].sort((a, b) => a - b);
  await transaction(async c => {
    await supervisor(c, supervisorId);
    // A chave primária por eletricista garante um único supervisor responsável.
    const [previous] = await c.execute('SELECT eletricista_id FROM tabela_supervisor_eletricista WHERE supervisor_id=?', [supervisorId]);
    const allIds = [...new Set([...ids, ...previous.map(e => Number(e.eletricista_id))])].sort((a,b) => a-b);
    for (const electricId of allIds) {
      const [rows] = await c.execute('SELECT id,data_demissao FROM tabela_eletricistas WHERE id=? FOR UPDATE', [electricId]);
      if (ids.includes(electricId) && (!rows.length || rows[0].data_demissao)) throw invalid('A equipe deve conter somente eletricistas ativos.');
    }
    for (const electricId of ids) {
      const [bound] = await c.execute('SELECT supervisor_id FROM tabela_supervisor_eletricista WHERE eletricista_id=?', [electricId]);
      if (bound.length && Number(bound[0].supervisor_id) !== supervisorId && req.body.transferir !== true) throw new AppError(409, 'Eletricista já associado a outro supervisor. Confirme a transferência.', 'TEAM_CONFLICT');
    }
    await c.execute('DELETE FROM tabela_supervisor_eletricista WHERE supervisor_id=?', [supervisorId]);
    for (const electricId of ids) {
      await c.execute('DELETE FROM tabela_supervisor_eletricista WHERE eletricista_id=?', [electricId]);
      await c.execute('INSERT INTO tabela_supervisor_eletricista (eletricista_id,supervisor_id) VALUES (?,?)', [electricId, supervisorId]);
    }
  });
  ok(res, { mensagem: 'Equipe atualizada. Os acessos já refletem o novo vínculo.' });
}));

export default router;
