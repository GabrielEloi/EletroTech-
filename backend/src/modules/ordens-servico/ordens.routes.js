import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { query } from '../../config/database.js';
import { requireAuth, requirePermission, requireOrderManager } from '../../middlewares/auth.js';
import { asyncHandler, ok, created, AppError } from '../../shared/http.js';
import { id, invalid } from '../../shared/validation.js';
import * as service from './ordens.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 30 } }).single('foto');
const uploadDir = resolve(process.env.OS_UPLOAD_DIR || fileURLToPath(new URL('../../../storage/uploads/os/', import.meta.url)));
router.use(requireAuth, requirePermission('ordemServico'));

function imageType(file) {
  const b = file.buffer;
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ['image/png', '.png'];
  if (b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255) return ['image/jpeg', '.jpg'];
  if (b.length >= 6 && ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString())) return ['image/gif', '.gif'];
  if (b.length >= 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return ['image/webp', '.webp'];
  throw invalid('Anexe uma imagem JPG, PNG, GIF ou WebP válida de até 8 MB.');
}

async function withPhoto(req, work) {
  let path;
  let savePhoto;
  if (req.file) {
    const [contentType, extension] = imageType(req.file);
    if (req.file.mimetype !== contentType) throw invalid('O conteúdo da foto não corresponde ao formato informado.');
    const name = `${randomUUID()}${extension}`;
    savePhoto = async (connection, osId, stage) => {
      await mkdir(uploadDir, { recursive: true });
      path = join(uploadDir, name);
      await writeFile(path, req.file.buffer, { flag: 'wx' });
      await connection.execute('INSERT INTO tabela_os_fotos (id_os,id_usuario,etapa,arquivo,content_type) VALUES (?,?,?,?,?)', [osId, req.user.id, stage, name, contentType]);
    };
  }
  try { return await work(savePhoto); }
  catch (error) { if (path) await unlink(path).catch(() => {}); throw error; }
}

router.get('/', asyncHandler(async (req, res) => ok(res, await service.listOrders(req.user, req))));
router.get('/opcoes', asyncHandler(async (req, res) => {
  const data = await service.listOrders(req.user, { query: { pageSize: 1 } });
  ok(res, { eletricistas: data.eletricistasAtivos, produtos: data.produtosDisponiveis, checklists: [data.checklistInicio, data.checklistFim].filter(Boolean), podeSolicitar: data.podeSolicitar });
}));
router.post('/', requireOrderManager, asyncHandler(async (req, res) => created(res, { id: await service.requestOrder(req.user, req.body), mensagem: 'Ordem de serviço solicitada.' })));
router.get('/:id', asyncHandler(async (req, res) => ok(res, await service.details(req.user, req.params.id))));
router.put('/:id', requireOrderManager, asyncHandler(async (req, res) => {
  await service.updateOrder(req.user, req.params.id, req.body);
  ok(res, { mensagem: 'Ordem de serviço atualizada.' });
}));
router.post('/:id/abertura', upload, asyncHandler(async (req, res) => ok(res, await withPhoto(req, photo => service.openOrder(req.user, req.params.id, req.body, photo)))));
router.post('/:id/fechamento', upload, asyncHandler(async (req, res) => ok(res, await withPhoto(req, photo => service.closeOrder(req.user, req.params.id, req.body, photo)))));
router.post('/:id/bloqueio', requireOrderManager, asyncHandler(async (req, res) => {
  await service.blockOrder(req.user, req.params.id, req.body);
  ok(res, { mensagem: 'OS bloqueada. Consulte a pendência para registrar a decisão.' });
}));
router.post('/:id/comentarios', upload, asyncHandler(async (req, res) => created(res, { id: await withPhoto(req, photo => service.commentOrder(req.user, req.params.id, req.body, photo)), mensagem: 'Comentário registrado.' })));
router.get('/:id/fotos/:fotoId', asyncHandler(async (req, res) => {
  await service.order(req.user, req.params.id);
  const [photo] = await query('SELECT arquivo,content_type FROM tabela_os_fotos WHERE id=? AND id_os=?', [id(req.params.fotoId), id(req.params.id)]);
  if (!photo || !/^[a-f0-9-]+\.(png|jpg|gif|webp)$/.test(photo.arquivo)) throw new AppError(404, 'Foto não encontrada.', 'NOT_FOUND');
  let content;
  try { content = await readFile(join(uploadDir, photo.arquivo)); } catch (error) {
    if (error.code === 'ENOENT') throw new AppError(404, 'Arquivo da foto não encontrado.', 'NOT_FOUND');
    throw error;
  }
  res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }).type(photo.content_type).send(content);
}));
export default router;
