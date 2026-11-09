import { Router } from 'express';
import { query, transaction } from '../../config/database.js';
import { requireAuth, requirePermission, requireOrderManager } from '../../middlewares/auth.js';
import { AppError, asyncHandler, ok, created } from '../../shared/http.js';
import { id, list, text, invalid, today } from '../../shared/validation.js';
import { electricianScope, teamOptions } from '../../shared/scope.js';
import { order, event } from '../ordens-servico/ordens.service.js';

const router = Router();
router.use(requireAuth, requirePermission('checklist'));
const type = value => { if (!['inicio', 'fim'].includes(value)) throw invalid('Tipo de checklist inválido.'); return value; };

router.get('/pendencias/opcoes', requireOrderManager, asyncHandler(async (req, res) => ok(res, await teamOptions(req.user))));
router.get('/pendencias', requireOrderManager, asyncHandler(async (req, res) => {
  const scope = electricianScope(req.user, 'os.eletricista_os'), clauses = ['s.bloqueado=1', scope.sql], params = [...scope.params];
  if (req.query.tipo) { clauses.push('s.tipo=?'); params.push(type(req.query.tipo)); }
  const electricId = req.query.eletricistaId ?? req.query.eletricista;
  if (electricId) { clauses.push('os.eletricista_os=?'); params.push(id(electricId)); }
  const sorts = { data_desc: 's.data_bloqueio DESC', data_asc: 's.data_bloqueio ASC', os_asc: 'os.id ASC', os_desc: 'os.id DESC', eletricista_asc: 'e.nome ASC', eletricista_desc: 'e.nome DESC' };
  const sort = sorts[req.query.ordenar ?? 'data_desc'];
  if (!sort) throw invalid('Ordenação inválida.');
  ok(res, await query(`SELECT s.*,os.status status_os,e.nome nome_eletricista FROM tabela_os_checklist_status s
    JOIN tabela_ordens_servico os ON os.id=s.id_os JOIN tabela_eletricistas e ON e.id=os.eletricista_os
    WHERE ${clauses.join(' AND ')} ORDER BY ${sort},s.id DESC`, params));
}));

router.get('/pendencias/:idOs/:tipo/relatorio', requireOrderManager, asyncHandler(async (req, res) => {
  const os = await order(req.user, req.params.idOs), checklistType = type(req.params.tipo);
  const [respostas, pendencia] = await Promise.all([
    query(`SELECT r.*,p.texto_pergunta FROM tabela_os_checklist_respostas r
      JOIN tabela_checklist_perguntas p ON p.id=r.id_pergunta JOIN tabela_checklist c ON c.id=p.id_checklist
      WHERE r.id_os=? AND c.tipo=? ORDER BY r.id`, [os.id, checklistType]),
    query('SELECT * FROM tabela_os_checklist_status WHERE id_os=? AND tipo=?', [os.id, checklistType]),
  ]);
  ok(res, { ordem: os, respostas, pendencia: pendencia[0] ?? null, tipo: checklistType });
}));

router.post('/pendencias/:idOs/:tipo/resolucao', requireOrderManager, asyncHandler(async (req, res) => {
  const checklistType = type(req.params.tipo), action = req.body.acao;
  if (!['autorizar', 'negar'].includes(action)) throw invalid('Decisão inválida.');
  const observation = text(req.body.observacao, 'Motivo da decisão', 4000);
  await transaction(async c => {
    const os = await order(req.user, req.params.idOs, c);
    const [rows] = await c.execute('SELECT * FROM tabela_os_checklist_status WHERE id_os=? AND tipo=? AND bloqueado=1 FOR UPDATE', [os.id, checklistType]);
    if (os.status !== 'bloqueada' || !rows[0]) throw new AppError(409, 'A pendência não está disponível para decisão.', 'INVALID_STATE');
    const allowed = action === 'autorizar';
    await c.execute('UPDATE tabela_os_checklist_status SET bloqueado=?,decisao=?,observacao=?,id_usuario=?,data_finalizacao=NOW() WHERE id=?', [allowed ? 0 : 1, action, observation, req.user.id, rows[0].id]);
    if (allowed) {
      const [remaining] = await c.execute('SELECT id FROM tabela_os_checklist_status WHERE id_os=? AND bloqueado=1', [os.id]);
      if (!remaining.length) {
        const nextStatus = rows[0].origem === 'manual' ? rows[0].status_anterior : checklistType === 'fim' ? 'fechada' : 'aberta';
        if (!['solicitada', 'aberta', 'fechada'].includes(nextStatus)) throw new AppError(409, 'O estado anterior do bloqueio precisa ser revisado.', 'INVALID_STATE');
        await c.execute('UPDATE tabela_ordens_servico SET status=?,data_fechamento=? WHERE id=?', [nextStatus, nextStatus === 'fechada' ? today() : null, os.id]);
      }
    }
    await event(c, os.id, req.user.id, `${action}_${checklistType}`, observation);
  });
  ok(res, { mensagem: action === 'autorizar' ? 'Pendência autorizada.' : 'Decisão registrada. A OS permanece bloqueada.' });
}));

router.get('/', asyncHandler(async (req, res) => {
  const clauses = [], params = [];
  if (req.query.tipo) { clauses.push('c.tipo=?'); params.push(type(req.query.tipo)); }
  if (req.query.titulo) { clauses.push('c.titulo LIKE ?'); params.push(`%${String(req.query.titulo).slice(0, 255)}%`); }
  ok(res, await query(`SELECT c.*,(SELECT COUNT(*) FROM tabela_checklist_perguntas p WHERE p.id_checklist=c.id) qtd_perguntas
    FROM tabela_checklist c ${clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''} ORDER BY c.id DESC`, params));
}));
router.get('/selecionados', asyncHandler(async (_req, res) => ok(res, await query('SELECT * FROM tabela_checklist WHERE selecionado=1 ORDER BY tipo'))));
router.get('/:id/perguntas', asyncHandler(async (req, res) => ok(res, await query('SELECT p.*,p.texto_pergunta pergunta FROM tabela_checklist_perguntas p WHERE p.id_checklist=? ORDER BY p.ordem', [id(req.params.id)]))));
router.post('/', requireOrderManager, asyncHandler(async (req, res) => {
  const title = text(req.body.titulo, 'Título'), checklistType = type(req.body.tipo);
  const questions = list(req.body.perguntas ?? req.body.pergunta);
  const answerTypes = list(req.body.tipoResposta ?? req.body.tipo_resposta), blocks = list(req.body.bloqueiaAbertura ?? req.body.bloqueia_abertura);
  if (!questions.length || questions.length > 100) throw invalid('Informe entre 1 e 100 perguntas.');
  const checkId = await transaction(async c => {
    const [result] = await c.execute('INSERT INTO tabela_checklist (titulo,tipo,selecionado) VALUES (?,?,0)', [title, checklistType]);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q == null || !['string','object'].includes(typeof q)) throw invalid('Pergunta inválida.');
      const questionText = text(typeof q === 'object' ? q.texto : q, 'Pergunta', 4000);
      const answerType = typeof q === 'object' ? q.tipoResposta : answerTypes[i] ?? 'text';
      const block = (typeof q === 'object' ? q.bloqueiaAbertura : blocks[i]) || null;
      if (!['radio', 'text'].includes(answerType) || (block && (answerType !== 'radio' || !['sim', 'nao'].includes(block)))) throw invalid('Tipo de resposta ou condição de bloqueio inválida.');
      await c.execute('INSERT INTO tabela_checklist_perguntas (id_checklist,texto_pergunta,ordem,tipo_resposta,bloqueia_abertura) VALUES (?,?,?,?,?)', [result.insertId, questionText, i + 1, answerType, block]);
    }
    return result.insertId;
  });
  created(res, { id: checkId, mensagem: 'Checklist cadastrado.' });
}));
router.put('/selecao', requireOrderManager, asyncHandler(async (req, res) => {
  const checkId = id(req.body.checklistId ?? req.body.id_checklist), checklistType = type(req.body.tipo);
  await transaction(async c => {
    const [rows] = await c.execute('SELECT id FROM tabela_checklist WHERE tipo=? ORDER BY id FOR UPDATE', [checklistType]);
    if (!rows.some(r => Number(r.id) === checkId)) throw new AppError(404, 'Checklist não encontrado.', 'NOT_FOUND');
    const [questions] = await c.execute('SELECT id FROM tabela_checklist_perguntas WHERE id_checklist=?', [checkId]);
    if (!questions.length) throw invalid('O checklist deve conter perguntas antes de ser selecionado.');
    await c.execute('UPDATE tabela_checklist SET selecionado=0 WHERE tipo=?', [checklistType]);
    await c.execute('UPDATE tabela_checklist SET selecionado=1 WHERE id=?', [checkId]);
  });
  ok(res, { mensagem: 'Checklist selecionado.' });
}));
router.delete('/:id', requireOrderManager, asyncHandler(async (req, res) => {
  const checkId = id(req.params.id);
  await transaction(async c => {
    const [rows] = await c.execute('SELECT * FROM tabela_checklist WHERE id=? FOR UPDATE', [checkId]);
    if (!rows[0]) throw new AppError(404, 'Checklist não encontrado.', 'NOT_FOUND');
    if (rows[0].selecionado) throw new AppError(409, 'Selecione outro checklist padrão antes de excluir este modelo.', 'CHECKLIST_IN_USE');
    const [used] = await c.execute('SELECT r.id FROM tabela_os_checklist_respostas r JOIN tabela_checklist_perguntas p ON p.id=r.id_pergunta WHERE p.id_checklist=? LIMIT 1', [checkId]);
    if (used.length) throw new AppError(409, 'Checklist já utilizado em OS. O histórico deve ser preservado.', 'CHECKLIST_IN_USE');
    await c.execute('DELETE FROM tabela_checklist WHERE id=?', [checkId]);
  });
  res.status(204).end();
}));
export default router;
