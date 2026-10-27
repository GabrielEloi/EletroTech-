import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/database.js';
import { AppError } from '../shared/http.js';
import { normalizedUser, canManageOrders } from '../shared/access.js';

export async function requireAuth(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new AppError(401, 'Token de acesso não informado.', 'UNAUTHENTICATED'));
  let claims;
  try { claims = jwt.verify(token, env.jwtSecret); }
  catch { return next(new AppError(401, 'Token de acesso inválido ou expirado.', 'UNAUTHENTICATED')); }
  try {
    // Recarrega vínculo e permissões: tokens antigos não preservam acessos removidos.
    const rows = await query(`SELECT u.id,u.usuario,u.is_admin,u.eletricista_id,e.nome eletricista_nome,e.data_demissao,
      COALESCE(JSON_ARRAYAGG(up.permissao), JSON_ARRAY()) permissoesJson
      FROM tabela_usuarios u LEFT JOIN tabela_eletricistas e ON e.id=u.eletricista_id
      LEFT JOIN tabela_usuario_permissao up ON up.usuario_id=u.id WHERE u.id=? GROUP BY u.id`, [claims.id]);
    const row = rows[0];
    if (!row) return next(new AppError(401, 'Usuário não encontrado.', 'UNAUTHENTICATED'));
    if (row.eletricista_id && (row.data_demissao || !row.eletricista_nome)) return next(new AppError(403, 'Acesso desativado. Fale com o administrador.', 'INACTIVE_USER'));
    req.user = normalizedUser(row);
    next();
  } catch (error) { next(error); }
}
export const requireAdmin = (req, _res, next) => req.user?.isAdmin ? next() : next(new AppError(403, 'Acesso restrito a administradores.', 'FORBIDDEN'));
export const requireOrderManager = (req, _res, next) => canManageOrders(req.user) ? next() : next(new AppError(403, 'Apenas administradores e supervisores podem solicitar OS.', 'FORBIDDEN'));
export const requirePermission = (permission) => (req, _res, next) => req.user?.isAdmin || req.user?.permissoes?.includes(permission) ? next() : next(new AppError(403, 'Você não possui esta permissão.', 'FORBIDDEN'));
// Metas são definidas pela gestão; o eletricista apenas acompanha as que recebeu.
export const requireManagement = (req, _res, next) => req.user?.eletricistaId ? next(new AppError(403, 'Ação não permitida ao perfil de eletricista.', 'FORBIDDEN')) : next();
