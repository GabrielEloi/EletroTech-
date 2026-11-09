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
app.use((error,_req,res,_next)=>{
  let status=error.status||error.statusCode||500, code=error.code||'INTERNAL_ERROR', message=error.message;
  if (error.code==='ER_DUP_ENTRY') { status=409; code='CONFLICT'; message='Já existe um cadastro com estes dados.'; }
  if (error.code==='ER_ROW_IS_REFERENCED_2') { status=409; code='RECORD_IN_USE'; message='Este registro possui histórico e não pode ser excluído. Remova seus acessos para desativá-lo.'; }
  if (error.code==='LIMIT_FILE_SIZE') { status=413; message='A foto deve ter até 8 MB.'; }
  if (error.name==='MulterError' && status===500) { status=422; message='Anexo inválido. Envie uma foto por operação.'; }
  if (error.code==='ER_LOCK_DEADLOCK' || error.code==='ER_LOCK_WAIT_TIMEOUT') { status=409; code='CONCURRENT_UPDATE'; message='O registro foi alterado por outra operação. Atualize a tela e tente novamente.'; }
  if(status>=500) { console.error(error); message='Não foi possível concluir a operação. Verifique a configuração do servidor.'; code='INTERNAL_ERROR'; }
  res.status(status).json({ error:{ code, message:message||'Erro interno do servidor.', details:error.details } });
});
export default app;
