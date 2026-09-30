import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.get('/health', (_req,res)=>res.json({ status:'ok' }));
app.use(routes);
app.use((_req,_res,next)=>next(Object.assign(new Error('Rota não encontrada.'),{status:404,code:'NOT_FOUND'})));
app.use((error,_req,res,_next)=>{ const status=error.status||error.statusCode||500; if(status>=500) console.error(error); res.status(status).json({ error:{ code:error.code||'INTERNAL_ERROR', message:error.message||'Erro interno do servidor.', details:error.details } }); });
export default app;
