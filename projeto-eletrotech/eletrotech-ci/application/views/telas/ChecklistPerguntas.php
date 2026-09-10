<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<h5 class="text-center mb-3">Perguntas do Checklist</h5>
<table class="table table-dark table-sm table-bordered text-center">
    <thead>
        <tr>
            <th>Pergunta</th>
            <th>Tipo</th>
            <th>Bloqueia se</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($perguntas as $pergunta): ?>
            <?php $bloqueio = trim((string) ($pergunta['bloqueia_abertura'] ?? '')); ?>
            <tr>
                <td><?= htmlspecialchars($pergunta['texto_pergunta']) ?></td>
                <td><?= ($pergunta['tipo_resposta'] ?? '') === 'text' ? 'Texto livre' : 'Sim/Não' ?></td>
                <td><?= $bloqueio !== '' ? htmlspecialchars($bloqueio) : '—' ?></td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
