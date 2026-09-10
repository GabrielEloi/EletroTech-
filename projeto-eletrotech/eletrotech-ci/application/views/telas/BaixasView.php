<?php

/** @var array  $produtos */
/** @var array  $filtros */
/** @var bool   $consultou */
/** @var array  $movimentacoes */
/** @var array  $totais */
/** @var int    $total_rows */
/** @var int    $offset */
/** @var int    $por_pagina */
/** @var string $paginacao */

$totalEntrada = $totais['total_entrada'];
$totalSaida   = $totais['total_saida'];
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Baixas / Movimentações - EletroTech</title>
    <style>
        body {
            background-color: #3c3b3b;
            color: white;
            padding-bottom: 60px;
        }

        nav.navbar.navbar-custom {
            background-color: #282828;
            padding-top: 15px;
            padding-bottom: 15px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

        nav.navbar.navbar-custom .navbar-brand img {
            max-height: 80px;
            width: auto;
            object-fit: contain;
        }

        nav.navbar.navbar-custom ul.navbar-nav .nav-link {
            color: #ffffff;
            font-weight: 500;
            font-size: 16px;
            padding: 8px 16px;
            transition: all 0.3s ease;
        }

        nav.navbar.navbar-custom ul.navbar-nav .nav-link:hover,
        nav.navbar.navbar-custom ul.navbar-nav .nav-link.active {
            color: #282828;
            background-color: #FBD814;
            border-radius: 6px;
        }

        nav.navbar.navbar-custom .navbar-toggler {
            border-color: #FBD814;
            padding: 8px;
        }

        nav.navbar.navbar-custom .navbar-toggler-icon {
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3e%3cpath stroke='%23FBD814' stroke-width='2.5' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
        }

        .page-header {
            margin-top: 2.5rem;
            margin-bottom: 1.5rem;
            border-left: 5px solid #FBD814;
            padding-left: 15px;
        }

        .page-header h1 {
            font-weight: 700;
            font-size: 26px;
            margin: 0;
        }

        .page-header p {
            color: #a0a0a0;
            margin: 5px 0 0 0;
            font-size: 15px;
        }

        .filtro-card {
            background-color: #282828;
            border: 1px solid rgba(251, 216, 20, 0.3);
            border-radius: 12px;
            padding: 20px 25px;
            margin-bottom: 25px;
        }

        .filtro-card label {
            color: #ccc;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .filtro-card .form-select,
        .filtro-card .form-control {
            background-color: #1f1f1f;
            border: 1px solid #555;
            color: white;
        }

        .filtro-card .form-select:focus,
        .filtro-card .form-control:focus {
            border-color: #FBD814;
            box-shadow: none;
            background-color: #1f1f1f;
            color: white;
        }

        .btn-consultar {
            background-color: #ebca1e;
            color: #282828;
            border: none;
            border-radius: 30px;
            padding: 10px 28px;
            font-weight: bold;
            text-transform: uppercase;
            transition: 0.3s;
        }

        .btn-consultar:hover {
            background-color: #ffffff;
        }

        .resumo {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .resumo .box {
            flex: 1;
            min-width: 200px;
            background-color: #1f1f1f;
            border-radius: 10px;
            padding: 15px 20px;
            border-bottom: 3px solid #FBD814;
        }

        .resumo .box .rotulo {
            font-size: 12px;
            text-transform: uppercase;
            color: #a0a0a0;
            letter-spacing: 1px;
        }

        .resumo .box .valor {
            font-size: 22px;
            font-weight: 700;
        }

        table.table.custom-table,
        table.table.custom-table th,
        table.table.custom-table td {
            border-color: #FBD814;
            vertical-align: middle;
        }

        table.table.custom-table thead th {
            color: #FBD814;
            font-size: 1rem;
        }

        table.table.custom-table td.empty-state {
            text-align: center;
            color: #a0a0a0;
            padding: 2rem;
            font-style: italic;
        }

        .badge-entrada {
            background-color: rgba(25, 135, 84, 0.2);
            color: #4ade80;
            border: 1px solid #198754;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-saida {
            background-color: rgba(220, 53, 69, 0.2);
            color: #f87171;
            border: 1px solid #dc3545;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .hint {
            text-align: center;
            color: #a0a0a0;
            font-style: italic;
            padding: 3rem 1rem;
        }

        .btn-detalhes {
            color: #FBD814;
            font-size: 18px;
            text-decoration: none;
            transition: 0.2s;
            margin-left: 10px;
        }

        .btn-detalhes:hover {
            color: #ffffff;
        }

        .link-documento {
            color: #FBD814;
            text-decoration: none;
            border-bottom: 1px dotted #FBD814;
        }

        .link-documento:hover {
            color: #ffffff;
            border-bottom-color: #ffffff;
        }
    </style>
</head>

<body>
    <?php $this->load->view('components/Navbar', array('ativo' => 'baixas')); ?>

    <div class="container">
        <div class="page-header">
            <h1>Movimentações</h1>
            <p>Consulta de entradas e saídas de produtos. Selecione os filtros e clique em Consultar.</p>
        </div>

        <form action="<?= site_url('baixas') ?>" method="GET" class="filtro-card">
            <input type="hidden" name="consultar" value="1">
            <div class="row g-3 align-items-end">
                <div class="col-md-3">
                    <label for="tipo">Tipo de baixa</label>
                    <select name="tipo" id="tipo" class="form-select">
                        <option value="" <?= $filtros['tipo'] === '' ? 'selected' : '' ?>>Todas</option>
                        <option value="entrada" <?= $filtros['tipo'] === 'entrada' ? 'selected' : '' ?>>Entrada</option>
                        <option value="saida" <?= $filtros['tipo'] === 'saida' ? 'selected' : '' ?>>Saída</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label for="id_produto">Produto</label>
                    <select name="id_produto" id="id_produto" class="form-select">
                        <option value="">Todos</option>
                        <?php foreach ($produtos as $p): ?>
                            <option value="<?= $p['id'] ?>" <?= (string) $filtros['id_produto'] === (string) $p['id'] ? 'selected' : '' ?>>
                                <?= htmlspecialchars($p['nome_produto']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-md-2">
                    <label for="data_inicio">De</label>
                    <input type="date" name="data_inicio" id="data_inicio" class="form-control" value="<?= htmlspecialchars($filtros['data_inicio']) ?>">
                </div>
                <div class="col-md-2">
                    <label for="data_fim">Até</label>
                    <input type="date" name="data_fim" id="data_fim" class="form-control" value="<?= htmlspecialchars($filtros['data_fim']) ?>">
                </div>
                <div class="col-md-2 d-grid">
                    <button type="submit" class="btn-consultar"><i class="fa-solid fa-magnifying-glass"></i> Consultar</button>
                </div>
            </div>
        </form>

        <?php if ($consultou): ?>
            <div class="resumo">
                <div class="box">
                    <div class="rotulo">Total de Entradas</div>
                    <div class="valor" style="color:#4ade80;">R$ <?= number_format($totalEntrada, 2, ',', '.') ?></div>
                </div>
                <div class="box">
                    <div class="rotulo">Total de Saídas</div>
                    <div class="valor" style="color:#f87171;">R$ <?= number_format($totalSaida, 2, ',', '.') ?></div>
                </div>
                <div class="box">
                    <div class="rotulo">Registros</div>
                    <div class="valor"><?= $total_rows ?></div>
                </div>
            </div>

            <form action="<?= site_url('baixas/relatorio_misto') ?>" method="POST" class="mb-3">
                <div class="d-flex justify-content-end mb-3">
                    <button type="submit" id="btn-relatorio-misto" class="btn-consultar" style="display:none;">
                        <i class="fa-solid fa-file-lines"></i> Criar relatório misto
                    </button>
                </div>

                <table class="table table-dark table-hover table-bordered custom-table text-center">
                    <thead>
                        <tr>
                            <th>Ações</th>
                            <th>Data</th>
                            <th>Produto</th>
                            <th>Tipo</th>
                            <th>Qtd</th>
                            <th>Valor Unit.</th>
                            <th>Valor Total</th>
                            <th>Origem</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (!empty($movimentacoes)): ?>
                            <?php foreach ($movimentacoes as $m): ?>
                                <tr>
                                    <td>
                                        <input type="checkbox" name="ids[]" value="<?= (int) $m['id'] ?>" class="form-check-input" style="accent-color:#FBD814;">

                                        <a href="<?= site_url('baixas/detalhes/' . $m['id']) ?>" class="btn-detalhes" title="Ver relatório detalhado">
                                            <i class="fa-solid fa-file-lines"></i>
                                        </a>
                                    </td>
                                    <td><?= date('d/m/Y', strtotime($m['data_mov'])) ?></td>
                                    <td><?= htmlspecialchars($m['nome_produto']) ?></td>
                                    <td>
                                        <?php if ($m['tipo'] === 'entrada'): ?>
                                            <span class="badge-entrada"><i class="fa-solid fa-arrow-down"></i> Entrada</span>
                                        <?php else: ?>
                                            <span class="badge-saida"><i class="fa-solid fa-arrow-up"></i> Saída</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?= (int) $m['quantidade'] ?></td>
                                    <td>R$ <?= number_format($m['valor_unitario'], 2, ',', '.') ?></td>
                                    <td>R$ <?= number_format($m['valor_total'], 2, ',', '.') ?></td>
                                    <td>
                                        <?php if (!empty($m['id_baixa']) && $this->session->userdata('is_admin')): ?>
                                            <a href="<?= site_url('lancamentos/relatorio/' . $m['id_baixa']) ?>" class="link-documento">
                                                <?= htmlspecialchars($m['origem']) ?>
                                            </a>
                                        <?php else: ?>
                                            <?= htmlspecialchars($m['origem']) ?>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="8" class="empty-state">Nenhuma movimentação encontrada para os filtros selecionados.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </form>

            <?php $this->load->view('components/Pagination'); ?>
        <?php else: ?>
            <div class="hint">
                <i class="fa-solid fa-filter fa-2x" style="color:#FBD814; margin-bottom:15px;"></i>
                <p>Escolha os filtros acima e clique em <strong>Consultar</strong> para ver as movimentações.</p>
            </div>
        <?php endif; ?>
    </div>
    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const btnRelatorio = document.getElementById('btn-relatorio-misto');
            const checkboxes = document.querySelectorAll('input[name="ids[]"]');

            const atualizarBotao = function () {
                const algumSelecionado = Array.from(checkboxes).some(function (checkbox) {
                    return checkbox.checked;
                });

                btnRelatorio.style.display = algumSelecionado ? 'inline-flex' : 'none';
            };

            checkboxes.forEach(function (checkbox) {
                checkbox.addEventListener('change', atualizarBotao);
            });

            atualizarBotao();
        });
    </script>
</body>

</html>