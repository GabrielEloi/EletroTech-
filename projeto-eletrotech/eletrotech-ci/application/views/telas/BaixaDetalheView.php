<?php

/** @var array $movimentacao */
/** @var array $materiais */
/** @var array $respostas */

$m = $movimentacao;
$ehEntrada = $m['tipo'] === 'entrada';
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Detalhes da Baixa - EletroTech</title>
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

        .sem-os {
            text-align: center;
            color: #a0a0a0;
            font-style: italic;
            padding: 1.5rem;
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
    <?php $this->load->view('components/Navbar', array('ativo' => 'baixas')); ?>

    <div class="container">
        <div class="folha">
            <div class="cabecalho-empresa">
                <img src="<?= base_url('assets/logo-eletrotech.png') ?>" alt="Logo EletroTech">
                <div class="dados">
                    <strong>EletroTech - Serviços Elétricos</strong><br>
                    Relatório de Movimentação de Estoque
                </div>
            </div>

            <div class="titulo-relatorio">
                DADOS DA BAIXA - (#<?= str_pad($m['id'], 5, '0', STR_PAD_LEFT) ?>)
            </div>

            <div class="campos">
                <div class="campo">
                    <span class="rotulo">Data da Movimentação:</span>
                    <span class="dado"><?= date('d/m/Y', strtotime($m['data_mov'])) ?></span>
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
                    <span class="rotulo">Produto:</span>
                    <span class="dado"><?= htmlspecialchars($m['nome_produto']) ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Quantidade:</span>
                    <span class="dado"><?= (int) $m['quantidade'] ?> un.</span>
                </div>
                <div class="campo">
                    <span class="rotulo">Valor Unitário (na época):</span>
                    <span class="dado">R$ <?= number_format($m['valor_unitario'], 2, ',', '.') ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Valor Total:</span>
                    <span class="dado">R$ <?= number_format($m['valor_total'], 2, ',', '.') ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Origem:</span>
                    <span class="dado"><?= htmlspecialchars($m['origem']) ?></span>
                </div>
                <div class="campo">
                    <span class="rotulo">Estoque atual do produto:</span>
                    <span class="dado"><?= (int) $m['qtd_estoque'] ?> un.</span>
                </div>
                <?php if (!empty($m['nome_usuario'])): ?>
                    <div class="campo">
                        <span class="rotulo">Lançado por:</span>
                        <span class="dado"><?= htmlspecialchars($m['nome_usuario']) ?></span>
                    </div>
                <?php endif; ?>
                <?php if (!empty($m['id_baixa'])): ?>
                    <div class="campo">
                        <span class="rotulo">Documento de origem:</span>
                        <span class="dado">
                            <a href="<?= site_url('lancamentos/relatorio/' . $m['id_baixa']) ?>" style="color:#FBD814;">
                                Baixa #<?= str_pad($m['id_baixa'], 5, '0', STR_PAD_LEFT) ?>
                            </a>
                        </span>
                    </div>
                <?php endif; ?>
            </div>

            <?php if (!empty($m['id_os'])): ?>
                <div class="secao">Ordem de Serviço de Origem</div>

                <div class="campos">
                    <div class="campo">
                        <span class="rotulo">Nº da OS:</span>
                        <span class="dado">#<?= str_pad($m['id_os'], 5, '0', STR_PAD_LEFT) ?></span>
                    </div>
                    <div class="campo">
                        <span class="rotulo">Eletricista:</span>
                        <span class="dado"><?= htmlspecialchars($m['nome_eletricista']) ?></span>
                    </div>
                    <div class="campo">
                        <span class="rotulo">Data de Abertura:</span>
                        <span class="dado"><?= date('d/m/Y', strtotime($m['data_os'])) ?></span>
                    </div>
                    <div class="campo">
                        <span class="rotulo">Situação:</span>
                        <span class="dado"><?= ucfirst(htmlspecialchars($m['status'])) ?></span>
                    </div>
                    <div class="campo">
                        <span class="rotulo">Data de Fechamento:</span>
                        <span class="dado">
                            <?= !empty($m['data_fechamento']) ? date('d/m/Y', strtotime($m['data_fechamento'])) : '-' ?>
                        </span>
                    </div>
                </div>

                <div class="secao">Materiais Utilizados na OS</div>

                <?php if (!empty($materiais)): ?>
                    <table class="table table-dark table-bordered custom-table text-center">
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
                                    <td><?= (int) $item['qtd_utilizada'] ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p class="sem-os">Nenhum material registrado para esta OS.</p>
                <?php endif; ?>

                <div class="secao">Checklist da OS</div>

                <?php if (!empty($respostas)): ?>
                    <table class="table table-dark table-bordered custom-table">
                        <thead>
                            <tr>
                                <th>Pergunta</th>
                                <th class="text-center">Resposta</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($respostas as $item): ?>
                                <tr>
                                    <td><?= htmlspecialchars($item['texto_pergunta']) ?></td>
                                    <td class="text-center">
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
                    <p class="sem-os">Nenhuma resposta de checklist registrada para esta OS.</p>
                <?php endif; ?>
            <?php else: ?>
                <p class="sem-os">Esta movimentação não veio de uma ordem de serviço.</p>
            <?php endif; ?>

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