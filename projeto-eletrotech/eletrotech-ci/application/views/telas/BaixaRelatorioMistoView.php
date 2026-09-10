<?php

/** @var array $movimentacoes */
/** @var int $total_registros */
/** @var float $total_entrada */
/** @var float $total_saida */
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Relatório Misto - EletroTech</title>
    <style>
        body {
            background-color: #3c3b3b;
            color: white;
            padding-bottom: 80px;
        }

        .folha {
            background-color: #282828;
            border-radius: 12px;
            padding: 30px 35px;
            margin: 2rem auto;
        }

        .titulo-relatorio {
            text-align: center;
            font-weight: 700;
            font-size: 22px;
            letter-spacing: 0.5px;
            margin-bottom: 25px;
            padding-bottom: 12px;
            border-bottom: 2px solid #FBD814;
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
            font-size: 20px;
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
            font-size: 0.95rem;
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
            margin-top: 25px;
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
                size: A4 landscape;
                margin: 12mm;
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

            table.table.custom-table tr {
                page-break-inside: avoid;
            }

            table.table.custom-table thead {
                display: table-header-group;
            }
        }
    </style>
</head>

<body>

    <div class="container">
        <div class="folha">
            <div class="titulo-relatorio">RELATÓRIO MISTO DE MOVIMENTAÇÕES</div>

            <div class="resumo">
                <div class="box">
                    <div class="rotulo">Registros</div>
                    <div class="valor"><?= (int) $total_registros ?></div>
                </div>
                <div class="box">
                    <div class="rotulo">Total de Entradas</div>
                    <div class="valor" style="color:#4ade80;">R$ <?= number_format($total_entrada, 2, ',', '.') ?></div>
                </div>
                <div class="box">
                    <div class="rotulo">Total de Saídas</div>
                    <div class="valor" style="color:#f87171;">R$ <?= number_format($total_saida, 2, ',', '.') ?></div>
                </div>
            </div>

            <table class="table table-dark table-bordered custom-table text-center">
                <thead>
                    <tr>
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
                    <?php foreach ($movimentacoes as $m): ?>
                        <tr>
                            <td><?= date('d/m/Y', strtotime($m['data_mov'])) ?></td>
                            <td><?= htmlspecialchars($m['nome_produto']) ?></td>
                            <td>
                                <?php if ($m['tipo'] === 'entrada'): ?>
                                    <span class="badge-entrada"> Entrada</span>
                                <?php else: ?>
                                    <span class="badge-saida"></i> Saída</span>
                                <?php endif; ?>
                            </td>
                            <td><?= (int) $m['quantidade'] ?></td>
                            <td>R$ <?= number_format($m['valor_unitario'], 2, ',', '.') ?></td>
                            <td>R$ <?= number_format($m['valor_total'], 2, ',', '.') ?></td>
                            <td><?= htmlspecialchars($m['origem']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>

            <div class="acoes">
                <button type="button" class="btn-imprimir" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> Imprimir
                </button>
                <a href="<?= site_url('baixas') ?>" class="btn-voltar">
                    <i class="fa-solid fa-arrow-left"></i> Voltar
                </a>
            </div>
        </div>
    </div>

    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>