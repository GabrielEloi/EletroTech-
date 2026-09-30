import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../shared/http.js';

export function requireAuth(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new AppError(401, 'Token de acesso não informado.', 'UNAUTHENTICATED'));
  try { req.user = jwt.verify(token, env.jwtSecret); next(); }
  catch { next(new AppError(401, 'Token de acesso inválido ou expirado.', 'UNAUTHENTICATED')); }
}
export const requireAdmin = (req, _res, next) => req.user?.isAdmin ? next() : next(new AppError(403, 'Acesso restrito a administradores.', 'FORBIDDEN'));
export const requirePermission = (permission) => (req, _res, next) => req.user?.isAdmin || req.user?.permissoes?.includes(permission) ? next() : next(new AppError(403, 'Você não possui esta permissão.', 'FORBIDDEN'));
