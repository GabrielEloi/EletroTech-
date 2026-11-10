import { Router } from 'express';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, transaction } from '../../config/database.js';
import { env } from '../../config/env.js';
import { normalizedUser } from '../../shared/access.js';
import { AppError, asyncHandler, ok } from '../../shared/http.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();
const attempts = new Map();
const cookieName = 'eletrotech_refresh';
const refreshLifetime = 7 * 24 * 60 * 60 * 1000;
const hash = value => createHash('sha256').update(value).digest('hex');
const cookie = req => String(req.headers.cookie || '').split(';').map(p => p.trim()).find(p => p.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/api/v1/auth' };

async function loadUser(connection, clause, params) {
  // Leitura com lock, incluindo senha e versão atuais: uma troca de senha
  // concorrente não pode deixar uma sessão renovável emitida com dados antigos.
  const [rows] = await connection.execute(`SELECT u.*,e.nome eletricista_nome,e.data_demissao
    FROM tabela_usuarios u LEFT JOIN tabela_eletricistas e ON e.id=u.eletricista_id WHERE ${clause} LIMIT 1 FOR UPDATE`, params);
  if (rows[0]) {
    const [permissions] = await connection.execute('SELECT permissao FROM tabela_usuario_permissao WHERE usuario_id=? FOR UPDATE', [rows[0].id]);
    rows[0].permissoes = permissions.map(p => p.permissao);
  }
  return rows[0];
}

function available(row) {
  if (!row) throw new AppError(401, 'Sessão inválida ou expirada.', 'UNAUTHENTICATED');
  if (row.eletricista_id && (row.data_demissao || !row.eletricista_nome)) throw new AppError(403, 'Acesso desativado. Fale com o administrador.', 'INACTIVE_USER');
  const user = normalizedUser(row);
  if (!user.isAdmin && !user.permissoes.length) throw new AppError(403, 'Nenhum acesso liberado. Fale com o administrador.', 'NO_PERMISSIONS');
  return user;
}

async function issue(connection, row, res) {
  const usuario = available(row);
  const refresh = randomBytes(32).toString('hex');
  const expiration = new Date(Date.now() + refreshLifetime).toISOString().slice(0, 19).replace('T', ' ');
  await connection.execute('INSERT INTO tabela_sessoes (token_hash,usuario_id,expira_em) VALUES (?,?,?)', [hash(refresh), row.id, expiration]);
  res.cookie(cookieName, refresh, { ...cookieOptions, maxAge: refreshLifetime });
  const accessToken = jwt.sign({ id: usuario.id, versao: Number(row.sessao_versao || 0) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  return { usuario, accessToken, tokenType: 'Bearer', expiresIn: env.jwtExpiresIn };
}

router.post('/login', asyncHandler(async (req, res) => {
  const login = String(req.body.nome ?? req.body.usuario ?? req.body.login ?? '').trim();
  const senha = String(req.body.senha ?? '');
  if (!login || !senha || login.length > 50 || Buffer.byteLength(senha, 'utf8') > 72) throw new AppError(422, 'Informe usuário e senha válidos.', 'VALIDATION_ERROR');
  const key = `${req.ip}:${login.toLowerCase()}`;
  const previous = attempts.get(key);
  if (previous && previous.until > Date.now() && previous.count >= 5) throw new AppError(429, 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.', 'TOO_MANY_ATTEMPTS');
  if (attempts.size > 10000) for (const [k, value] of attempts) if (value.until < Date.now()) attempts.delete(k);
  const result = await transaction(async c => {
    const row = await loadUser(c, 'u.usuario=? OR e.cpf=?', [login, login.replace(/\D/g, '')]);
    if (!row || !(await bcrypt.compare(senha, row.senha))) {
      attempts.set(key, { count: previous?.until > Date.now() ? previous.count + 1 : 1, until: previous?.until > Date.now() ? previous.until : Date.now() + 60000 });
      throw new AppError(401, 'Credenciais inválidas.', 'INVALID_CREDENTIALS');
    }
    available(row);
    // Evita acumular sessões vencidas sem um processo externo de limpeza.
    await c.execute('DELETE FROM tabela_sessoes WHERE usuario_id=? AND expira_em<?', [row.id, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
    return issue(c, row, res);
  });
  attempts.delete(key);
  ok(res, result);
}));

router.get('/me', requireAuth, (req, res) => ok(res, req.user));

router.post('/refresh', asyncHandler(async (req, res) => {
  const refresh = cookie(req);
  if (!refresh || !/^[a-f0-9]{64}$/.test(refresh)) throw new AppError(401, 'Sessão expirada. Entre novamente.', 'UNAUTHENTICATED');
  const result = await transaction(async c => {
    const [candidate] = await c.execute('SELECT usuario_id FROM tabela_sessoes WHERE token_hash=?', [hash(refresh)]);
    if (!candidate[0]) throw new AppError(401, 'Sessão expirada. Entre novamente.', 'UNAUTHENTICATED');
    // Usa a mesma ordem de locks de logout/troca de senha: usuário, depois sessão.
    const row = await loadUser(c, 'u.id=?', [candidate[0].usuario_id]);
    const [sessions] = await c.execute('SELECT * FROM tabela_sessoes WHERE token_hash=? FOR UPDATE', [hash(refresh)]);
    const session = sessions[0];
    if (!session || new Date(`${session.expira_em.replace(' ', 'T')}Z`).getTime() <= Date.now()) throw new AppError(401, 'Sessão expirada. Entre novamente.', 'UNAUTHENTICATED');
    available(row);
    await c.execute('DELETE FROM tabela_sessoes WHERE token_hash=?', [hash(refresh)]);
    return issue(c, row, res);
  });
  ok(res, result);
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const refresh = cookie(req);
  let userId;
  if (refresh) userId = (await query('SELECT usuario_id FROM tabela_sessoes WHERE token_hash=?', [hash(refresh)]))[0]?.usuario_id;
  if (!userId && req.headers.authorization) {
    try { userId = jwt.verify(req.headers.authorization.replace(/^Bearer\s+/i, ''), env.jwtSecret).id; } catch { /* Ainda limpa o cookie de uma sessão vencida. */ }
  }
  if (userId) await transaction(async c => {
    await c.execute('UPDATE tabela_usuarios SET sessao_versao=sessao_versao+1 WHERE id=?', [userId]);
    await c.execute('DELETE FROM tabela_sessoes WHERE usuario_id=?', [userId]);
  });
  res.clearCookie(cookieName, cookieOptions).status(204).end();
}));

export default router;
