import { Router } from 'express';
import { requireAuth, requirePermission, requireOrderManager } from '../../middlewares/auth.js';
import { asyncHandler, ok, created } from '../../shared/http.js';
import { teamOptions } from '../../shared/scope.js';
import { listGoals, createGoal, updateGoal, deleteGoal } from './metas.service.js';

const router = Router();
router.use(requireAuth, requirePermission('metas'));
router.get('/opcoes', requireOrderManager, asyncHandler(async (req, res) => ok(res, await teamOptions(req.user))));
router.get('/', asyncHandler(async (req, res) => ok(res, await listGoals(req.user, req.query))));
router.post('/', requireOrderManager, asyncHandler(async (req, res) => created(res, { id: await createGoal(req.user, req.body), mensagem: 'Meta cadastrada.' })));
router.put('/:id', requireOrderManager, asyncHandler(async (req, res) => {
  await updateGoal(req.user, req.params.id, req.body);
  ok(res, { mensagem: 'Meta atualizada.' });
}));
router.delete('/:id', requireOrderManager, asyncHandler(async (req, res) => {
  await deleteGoal(req.user, req.params.id);
  res.status(204).end();
}));
export default router;
