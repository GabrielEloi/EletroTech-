<?php

/** @var array $baixa */
/** @var array $movimentacoes */

$ehEntrada = $baixa['tipo'] === 'entrada';
$total     = array_sum(array_column($movimentacoes, 'valor_total'));
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Relatório da Baixa - EletroTech</title>
    <style>
        body {
            background-color: #3c3b3b;
            color: white;
            padding-bottom: 120px;
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

        .folha {
            background-color: #282828;
            border-radius: 12px;
            padding: 30px 35px;
            margin: 2.5rem auto 3rem auto;
            max-width: 900px;
        }

        .cabecalho-empresa {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #555;
            border-radius: 8px;
            padding: 12px 20px;
            margin-bottom: 30px;
        }

        .cabecalho-empresa img {
            max-height: 60px;
        }

        .cabecalho-empresa .dados {
            text-align: center;
            font-size: 14px;
            line-height: 1.5;
        }

        .titulo-relatorio {
            text-align: center;
            font-weight: 700;
            font-size: 20px;
            letter-spacing: 0.5px;
            margin-bottom: 25px;
            padding-bottom: 12px;
            border-bottom: 2px solid #FBD814;
        }

        .campos {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 40px;
        }

        .campo {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            padding: 9px 2px;
            border-bottom: 1px solid #3f3f3f;
            font-size: 15px;
        }

        .campo.largo {
            grid-column: 1 / -1;
        }

        .campo .rotulo {
            color: #a0a0a0;
            white-space: nowrap;
        }

        .campo .dado {
            font-weight: 600;
            text-align: right;
        }

        .secao {
            text-align: center;
            font-weight: 700;
            font-size: 17px;
            margin: 35px 0 18px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #555;
        }

        table.table.custom-table,
        table.table.custom-table th,
        table.table.custom-table td {
            border-color: #FBD814;
            vertical-align: middle;
        }

        table.table.custom-table thead th {
            color: #FBD814;
            font-size: 0.95rem;
        }

        table.table.custom-table tfoot td {
            font-weight: 700;
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

        .acoes {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 35px;
        }

        .acoes a,
        .acoes button {
            border: none;
            border-radius: 30px;
            padding: 10px 26px;
            font-weight: bold;
            text-transform: uppercase;
            text-decoration: none;
            transition: 0.3s;
        }

        .btn-imprimir {
            background-color: #ebca1e;
            color: #282828;
        }

        .btn-imprimir:hover {
            background-color: #ffffff;
        }

        .btn-voltar {
            background-color: #555;
            color: #ffffff;
        }

        .btn-voltar:hover {
            background-color: #777;
            color: #ffffff;
        }

        @media print {
            @page {
                size: A4 portrait;
                margin: 15mm;
            }

            nav.navbar,
            .acoes,
            #chat-widget {
                display: none !important;
            }

            body {
                background-color: #ffffff;
                color: #000000;
                padding-bottom: 0;
            }

            .folha {
                background-color: #ffffff;
                margin: 0;
                padding: 0;
                max-width: none;
            }

            .campo .rotulo {
                color: #444;
            }

            .campo,
            .cabecalho-empresa {
                border-color: #999;
            }

            table.table.custom-table,
            table.table.custom-table th,
            table.table.custom-table td {
                border-color: #999 !important;
                color: #000 !important;
                background-color: #fff !important;
            }

            table.table.custom-table thead th {
                color: #000 !important;
            }

            table.table.custom-table tr,
            .campo,
            .cabecalho-empresa {
                page-break-inside: avoid;
            }

            table.table.custom-table thead {
                display: table-header-group;
            }
        }
    </style>
</head>

<body>
    <?php $this->load->view('components/Navbar', array('ativo' => 'lancamentos')); ?>

    <div class="container">
        <div class="folha">
            <div class="cabecalho-empresa">
                <img src="<?= base_url('assets/logo-eletrotech.png') ?>" alt="Logo EletroTech">
                <div class="dados">
                    <strong>EletroTech - Serviços Elétricos</strong><br>
                    Relatório de Baixa de Estoque
                </div>
            </div>

            <div class="titulo-relatorio">
                BAIXA DE <?= $ehEntrada ? 'ENTRADA' : 'SAÍDA' ?> - (#<?= str_pad($baixa['id'], 5, '0', STR_PAD_LEFT) ?>)
            </div>

            <div class="campos">
                <div class="campo">
                    <span class="rotulo">Data da Baixa:</span>
                    <span class="dado"><?= date('d/m/Y', strtotime($baixa['data_baixa'])) ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Tipo de Movimento:</span>
                    <span class="dado">
                        <?php if ($ehEntrada): ?>
                            <span class="badge-entrada"><i class="fa-solid fa-arrow-down"></i> Entrada</span>
                        <?php else: ?>
                            <span class="badge-saida"><i class="fa-solid fa-arrow-up"></i> Saída</span>
                        <?php endif; ?>
                    </span>
                </div>
                <div class="campo">
                    <span class="rotulo">Solicitante:</span>
                    <span class="dado"><?= htmlspecialchars($baixa['nome_eletricista']) ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Situação:</span>
                    <span class="dado"><?= ucfirst(htmlspecialchars($baixa['status'])) ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Aberta em:</span>
                    <span class="dado"><?= date('d/m/Y H:i', strtotime($baixa['data_abertura'])) ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Finalizada em:</span>
                    <span class="dado">
                        <?= !empty($baixa['data_finalizacao']) ? date('d/m/Y H:i', strtotime($baixa['data_finalizacao'])) : '-' ?>
                    </span>
                </div>
                <div class="campo">
                    <span class="rotulo">Responsável:</span>
                    <span class="dado"><?= !empty($baixa['nome_usuario']) ? htmlspecialchars($baixa['nome_usuario']) : '-' ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Total de Itens:</span>
                    <span class="dado"><?= count($movimentacoes) ?></span>
                </div>
                <div class="campo largo">
                    <span class="rotulo">Observação:</span>
                    <span class="dado">
                        <?= $baixa['observacao'] !== '' && $baixa['observacao'] !== null
                            ? htmlspecialchars($baixa['observacao'])
                            : '-' ?>
                    </span>
                </div>
            </div>

            <div class="secao">Materiais Baixados</div>

            <table class="table table-dark table-bordered custom-table text-center">
                <thead>
                    <tr>
                        <th>Material</th>
                        <th>Quantidade</th>
                        <th>Valor Unitário</th>
                        <th>Valor Total</th>
                        <th>Estoque Atual</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($movimentacoes as $m): ?>
                        <tr>
                            <td><?= htmlspecialchars($m['nome_produto']) ?></td>
                            <td><?= (int) $m['quantidade'] ?></td>
                            <td>R$ <?= number_format($m['valor_unitario'], 2, ',', '.') ?></td>
                            <td>R$ <?= number_format($m['valor_total'], 2, ',', '.') ?></td>
                            <td><?= (int) $m['qtd_estoque'] ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-end">Total da baixa</td>
                        <td>R$ <?= number_format($total, 2, ',', '.') ?></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

            <div class="acoes">
                <button type="button" class="btn-imprimir" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> Imprimir
                </button>
                <a href="<?= site_url('lancamentos') ?>" class="btn-voltar">
                    <i class="fa-solid fa-plus"></i> Nova baixa
                </a>
                <a href="<?= site_url('baixas') ?>" class="btn-voltar">
                    <i class="fa-solid fa-list"></i> Movimentações
                </a>
            </div>
        </div>
    </div>

    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
