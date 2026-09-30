import { Router } from 'express';
import apiRoutes from '../modules/api.routes.js';
import { asyncHandler } from '../shared/http.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
router.use('/api/v1', apiRoutes);

// Compatibilidade transitória para o front-end já entregue. As rotas novas são a fonte de verdade.
const legacy = Router();
legacy.use('/legacy', apiRoutes);
legacy.post('/auth/entrar', (req,res,next)=>{req.url='/legacy/auth/login';apiRoutes(req,res,next);});
legacy.get('/auth/sair', (_req,res)=>res.json({mensagem:'Logout realizado.'}));
legacy.get('/home', requireAuth, (req,res)=>res.json(req.user));
const map = [
  ['get','/usuarios','/legacy/usuarios'],['post','/usuarios/criar','/legacy/usuarios'],['get','/eletricistas','/legacy/eletricistas'],['get','/produtos','/legacy/produtos'],['get','/metas','/legacy/metas'],['get','/checklist','/legacy/checklists'],['get','/ordemServico','/legacy/ordens-servico'],['get','/lancamentos','/legacy/lancamentos'],['get','/menu','/legacy/dashboard'],['get','/baixas','/legacy/movimentacoes']
];
for (const [method, oldPath, newPath] of map) legacy[method](oldPath,(req,res,next)=>{req.url=newPath+(req.originalUrl.includes('?')?req.originalUrl.slice(req.originalUrl.indexOf('?')):'');apiRoutes(req,res,next);});
export default router;
