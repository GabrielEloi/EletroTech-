<?php

/** @var int $idOs */
/** @var string $tipo */
/** @var array $ordem */
/** @var array $respostas */
/** @var array $status */
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Relatório Checklist - EletroTech</title>
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

        .badge-sim {
            background-color: rgba(25, 135, 84, 0.2);
            color: #4ade80;
            border: 1px solid #198754;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-nao {
            background-color: rgba(220, 53, 69, 0.2);
            color: #f87171;
            border: 1px solid #dc3545;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-neutro {
            background-color: rgba(251, 216, 20, 0.15);
            color: #FBD814;
            border: 1px solid #FBD814;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .observacao {
            margin-top: 25px;
            background-color: #1f1f1f;
            border-radius: 10px;
            padding: 18px 22px;
            border-left: 4px solid #FBD814;
        }

        .observacao strong {
            color: #FBD814;
        }

        .observacao small {
            display: block;
            margin-top: 8px;
            color: #a0a0a0;
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
                size: A4 portrait;
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

            .observacao {
                background-color: #f7f7f7 !important;
                color: #000 !important;
                border-left-color: #999 !important;
            }

            .observacao strong {
                color: #000 !important;
            }
        }
    </style>
</head>

<body>

    <div class="container">
        <div class="folha">
            <div class="titulo-relatorio">
                RELATÓRIO DE CHECKLIST DE <?= $tipo === 'inicio' ? 'INÍCIO' : 'FIM' ?> — OS #<?= str_pad($idOs, 5, '0', STR_PAD_LEFT) ?>
            </div>

            <div class="resumo">
                <div class="box">
                    <div class="rotulo">Eletricista</div>
                    <div class="valor"><?= htmlspecialchars($ordem['nome_eletricista'] ?? '-') ?></div>
                </div>
                <div class="box">
                    <div class="rotulo">Data OS</div>
                    <div class="valor">
                        <?= !empty($ordem['data_os']) ? date('d/m/Y', strtotime($ordem['data_os'])) : '-' ?>
                    </div>
                </div>
                <div class="box">
                    <div class="rotulo">Status Atual</div>
                    <div class="valor" style="color:#FBD814;"><?= htmlspecialchars($ordem['status']) ?></div>
                </div>
            </div>

            <table class="table table-dark table-bordered custom-table text-center">
                <thead>
                    <tr>
                        <th>Pergunta</th>
                        <th>Resposta</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($respostas)): ?>
                        <?php foreach ($respostas as $r): ?>
                            <?php
                                $resposta = strtolower($r['resposta']);
                                if ($resposta === 'sim') {
                                    $badgeClass = 'badge-sim';
                                } elseif ($resposta === 'não' || $resposta === 'nao') {
                                    $badgeClass = 'badge-nao';
                                } else {
                                    $badgeClass = 'badge-neutro';
                                }
                            ?>
                            <tr>
                                <td class="text-start"><?= htmlspecialchars($r['texto_pergunta']) ?></td>
                                <td><span class="<?= $badgeClass ?>"><?= htmlspecialchars(ucfirst($r['resposta'])) ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="2">Nenhuma resposta registrada.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>

            <?php if (!empty($status['observacao'])): ?>
                <div class="observacao">
                    <strong>Observação da finalização:</strong><br>
                    <?= nl2br(htmlspecialchars($status['observacao'])) ?>
                    <small>Finalizado em: <?= date('d/m/Y H:i', strtotime($status['data_finalizacao'])) ?></small>
                </div>
            <?php elseif (!empty($status['bloqueado'])): ?>
                <div class="observacao">
                    <strong>Este checklist ainda está pendente de revisão.</strong>
                </div>
            <?php endif; ?>

            <div class="acoes">
                <button type="button" class="btn-imprimir" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> Imprimir
                </button>
                <a href="<?= site_url('consultachecklist') ?>" class="btn-voltar">
                    <i class="fa-solid fa-arrow-left"></i> Voltar
                </a>
            </div>
        </div>
    </div>

    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>