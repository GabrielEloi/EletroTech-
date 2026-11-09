import { Router } from 'express';
import { query } from '../../config/database.js';
import { requireAuth, requireOrderManager } from '../../middlewares/auth.js';
import { electricianScope } from '../../shared/scope.js';
import { asyncHandler, ok } from '../../shared/http.js';

const router = Router();
router.get('/', requireAuth, requireOrderManager, asyncHandler(async (req, res) => {
  const scope = electricianScope(req.user, 'e.id');
  ok(res, await query(`SELECT e.id,e.nome,
    (SELECT COUNT(*) FROM tabela_ordens_servico os WHERE os.eletricista_os=e.id AND os.status='solicitada') solicitadas,
    (SELECT COUNT(*) FROM tabela_ordens_servico os WHERE os.eletricista_os=e.id AND os.status='aberta') abertas,
    (SELECT COUNT(*) FROM tabela_ordens_servico os WHERE os.eletricista_os=e.id AND os.status='bloqueada') bloqueadas,
    (SELECT COUNT(*) FROM tabela_ordens_servico os WHERE os.eletricista_os=e.id AND os.status='fechada') fechadas
    FROM tabela_eletricistas e WHERE e.data_demissao IS NULL AND ${scope.sql} ORDER BY e.nome`, scope.params));
}));
export default router;
