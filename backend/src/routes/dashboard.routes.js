const { Router } = require('express');
const controller = require('./dashboard.controller');
const { requireAuth } = require('../../middlewares/auth');
const { requirePermissao } = require('../../middlewares/permissoes');

const router = Router();

// Regra do PHP: se NÃO é admin e NÃO tem eletricista vinculado, exige permissão 'menu'.
function exigirMenuSeNecessario(req, res, next) {
  const { is_admin, eletricista_id } = req.user;
  if (!is_admin && !eletricista_id) return requirePermissao('menu')(req, res, next);
  next();
}

router.get('/', requireAuth, exigirMenuSeNecessario, controller.index);

module.exports = router;
