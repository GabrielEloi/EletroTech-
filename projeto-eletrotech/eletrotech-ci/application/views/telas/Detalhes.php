<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<div class="text-center mb-4" style="padding-bottom: 14px; border-bottom: 1px solid rgba(251, 216, 20, 0.3);">
    <div style="color: #a0a0a0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Eletricista responsável
    </div>
    <div style="font-size: 18px; font-weight: 600;">
        <?= htmlspecialchars($ordem['nome_eletricista'] ?? '—') ?>
    </div>
    <div class="mt-2">
        <?php $status = $ordem['status'] ?? ''; ?>
        <?php if ($status === 'solicitada'): ?>
            <span class="badge bg-warning text-dark">Solicitada</span>
        <?php elseif ($status === 'aberta'): ?>
            <span class="badge bg-success">Aberta</span>
        <?php else: ?>
            <span class="badge bg-secondary">Fechada</span>
        <?php endif; ?>
    </div>
</div>

<?php if (($ordem['status'] ?? '') === 'solicitada'): ?>
    <p class="text-center" style="color:#a0a0a0;">
        Esta OS ainda não foi aberta. Os materiais e o checklist de início são
        registrados pelo eletricista no momento da abertura.
    </p>
<?php elseif (!empty($materiais)): ?>
    <h5 class="text-center mb-3">Materiais Utilizados</h5>
    <table class="table table-dark table-sm table-bordered text-center mb-4">
        <thead>
            <tr>
                <th>Material</th>
                <th>Qtd. Utilizada</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($materiais as $item): ?>
                <tr>
                    <td><?= htmlspecialchars($item['nome_produto']) ?></td>
                    <td><?= $item['qtd_utilizada'] ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
<?php else: ?>
    <p class="text-center">Nenhum material registrado para esta OS.</p>
<?php endif; ?>

<?php if (!empty($respostas)): ?>
    <h5 class="text-center mb-3">Checklist e Respostas</h5>
    <table class="table table-dark table-sm table-bordered text-center">
        <thead>
            <tr>
                <th>Pergunta</th>
                <th>Resposta</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($respostas as $item): ?>
                <tr>
                    <td><?= htmlspecialchars($item['texto_pergunta']) ?></td>
                    <td>
                        <?= htmlspecialchars(ucfirst($item['resposta'])) ?>
                        <?php if (!empty($item['motivo_nao'])): ?>
                            <div class="text-start mt-2"><strong>Motivo:</strong> <?= htmlspecialchars($item['motivo_nao']) ?></div>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
<?php else: ?>
    <p class="text-center">Nenhuma resposta de checklist registrada para esta OS.</p>
<?php endif; ?>

<hr style="border-color: rgba(251, 216, 20, 0.3); margin: 20px 0;">
<h5 class="text-center mb-3"><i class="fa-solid fa-comments"></i> Comentários</h5>

<form id="formComentario" class="mb-4" enctype="multipart/form-data">
    <input type="hidden" name="id_os" value="<?= (int) $idOs ?>">
    <textarea name="comentario" class="form-control mb-2" rows="2" placeholder="Escreva um comentário..."
        style="background:transparent;color:#fff;border:1px solid #777;"></textarea>

    <div class="d-flex flex-wrap gap-2 align-items-center">
        <label class="btn btn-sm btn-outline-warning mb-0" style="border-radius:20px;font-weight:bold;">
            <i class="fa-solid fa-camera"></i> Tirar / Anexar Foto
            <input type="file" name="foto" accept="image/*" capture="environment" class="d-none" id="inputFotoComentario">
        </label>
        <button type="submit" class="btn btn-sm btn-outline-success mb-0" style="border-radius:20px;font-weight:bold;">
            <i class="fa-solid fa-paper-plane"></i> Enviar
        </button>
        <span id="nomeFotoComentario" style="font-size:12px;color:#FBD814;"></span>
    </div>
    <div id="previewFotoComentario" class="mt-2"></div>
    <div id="erroComentario" class="text-danger mt-2" style="font-size:13px;"></div>
</form>

<?php if (!empty($comentarios)): ?>
    <div id="lista-comentarios">
        <?php foreach ($comentarios as $c): ?>
            <div class="mb-3 p-2" style="border:1px solid rgba(251,216,20,0.3);border-radius:8px;background:#333;">
                <?php if (!empty($c['comentario'])): ?>
                    <div style="white-space:pre-wrap;"><?= htmlspecialchars($c['comentario']) ?></div>
                <?php endif; ?>
                <?php if (!empty($c['foto'])): ?>
                    <?php
                    // A listagem usa a miniatura (_thumb) quando ela existe; o link sempre
                    // aponta para a imagem original em tamanho real.
                    $thumb = preg_replace('/(\.[^.]+)$/', '_thumb$1', $c['foto']);
                    $imgListagem = is_file(FCPATH . 'assets/uploads/os/' . $thumb) ? $thumb : $c['foto'];
                    ?>
                    <a href="<?= base_url('assets/uploads/os/' . rawurlencode($c['foto'])) ?>" target="_blank" rel="noopener">
                        <img src="<?= base_url('assets/uploads/os/' . rawurlencode($imgListagem)) ?>" alt="Foto do comentário"
                            style="max-width:100%;max-height:200px;border-radius:6px;margin-top:6px;">
                    </a>
                <?php endif; ?>
                <div class="mt-1" style="font-size:11px;color:#e0e0e0;">
                    <i class="fa-regular fa-clock" style="color:#FBD814;"></i> <?= date('d/m/Y H:i', strtotime($c['data_comentario'])) ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
<?php else: ?>
    <p id="lista-comentarios" class="text-center" style="color:#a0a0a0;">Nenhum comentário registrado para esta OS.</p>
<?php endif; ?>