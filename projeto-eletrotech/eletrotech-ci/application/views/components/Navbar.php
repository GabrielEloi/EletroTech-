<?php

/** @var string $ativo */

$ehAdmin    = (bool) $this->session->userdata('is_admin');
$permissoes = (array) $this->session->userdata('permissoes');

$pode = function ($chave) use ($ehAdmin, $permissoes) {
    return $ehAdmin || in_array($chave, $permissoes, true);
};
?>
<nav class="navbar navbar-expand-lg navbar-custom">
    <div class="container-fluid px-4">
        <a class="navbar-brand d-flex align-items-center" href="<?= site_url('home') ?>">
            <img src="<?= base_url('assets/logo-eletrotech.png') ?>" alt="Logo Eletrotech">
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
            aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
                <?php if ($pode('menu')): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $ativo === 'menu' ? 'active' : '' ?>" href="<?= site_url('menu') ?>">Dashboard</a>
                    </li>
                <?php endif; ?>
                <?php if ($ehAdmin): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $ativo === 'usuarios' ? 'active' : '' ?>" href="<?= site_url('usuarios') ?>">Usuários</a>
                    </li>
                <?php endif; ?>
                <?php if ($pode('eletricistas')): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $ativo === 'eletricistas' ? 'active' : '' ?>" href="<?= site_url('eletricistas') ?>">Eletricistas</a>
                    </li>
                <?php endif; ?>
                <?php if ($pode('produtos')): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $ativo === 'produtos' ? 'active' : '' ?>" href="<?= site_url('produtos') ?>">Produtos</a>
                    </li>
                <?php endif; ?>
                <?php if ($pode('metas')): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $ativo === 'metas' ? 'active' : '' ?>" href="<?= site_url('metas') ?>">Metas</a>
                    </li>
                <?php endif; ?>
                <?php if ($pode('ordemServico')): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $ativo === 'ordemServico' ? 'active' : '' ?>" href="<?= site_url('ordemServico') ?>">Ordens de Serviço</a>
                    </li>
                <?php endif; ?>

                <?php if ($pode('checklist')): ?>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle <?= in_array($ativo, ['checklist', 'consultachecklist'], true) ? 'active' : '' ?>"
                        href="#" id="checklistDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Checklist
                        </a>
                        <!-- Adicionada a classe dropdown-checklist aqui -->
                        <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="checklistDropdown">
                            <li>
                                <a class="dropdown-item <?= $ativo === 'checklist' ? 'active' : '' ?>" href="<?= site_url('checklist') ?>">
                                    Seleção Checklist
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item <?= $ativo === 'consultachecklist' ? 'active' : '' ?>" href="<?= site_url('consultachecklist') ?>">
                                    Consulta Checklist
                                </a>
                            </li>
                        </ul>
                    </li>
                <?php endif; ?>

                <?php if ($pode('baixas')): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $ativo === 'baixas' ? 'active' : '' ?>" href="<?= site_url('baixas') ?>">Movimentação</a>
                    </li>
                <?php endif; ?>
                <?php if ($ehAdmin): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $ativo === 'lancamentos' ? 'active' : '' ?>" href="<?= site_url('lancamentos') ?>">Baixas</a>
                    </li>
                <?php endif; ?>

                <li class="nav-item ms-3">
                    <a class="nav-link text-danger fw-bold" style="background-color: transparent;" href="<?= site_url('auth/sair') ?>">Sair</a>
                </li>
            </ul>
        </div>
    </div>
</nav>