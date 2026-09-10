<?php

/** @var array  $produtos */
/** @var array  $eletricistas */
/** @var array  $abas */
/** @var string $aba */
/** @var array  $valores */

$valor = function ($campo, $tipoDoCampo, $padrao = '') use ($valores, $aba) {
    // Só a aba que foi submetida volta preenchida.
    if ($tipoDoCampo !== $aba || !isset($valores[$campo])) {
        return $padrao;
    }

    return htmlspecialchars($valores[$campo]);
};

$hoje = date('Y-m-d');

$config = array(
    'entrada' => array(
        'rotulo'     => 'Entrada',
        'icone'      => 'fa-arrow-down',
        'classeBtn'  => 'btn-entrada',
        'sugestoes'  => array('Compra / Nota Fiscal', 'Reposição de estoque', 'Devolução de OS', 'Ajuste de inventário'),
        'colunaQtd'  => 'Quantidade a entrar',
        'ajudaSaldo' => 'Estoque atual',
    ),
    'saida' => array(
        'rotulo'     => 'Saída',
        'icone'      => 'fa-arrow-up',
        'classeBtn'  => 'btn-saida',
        'sugestoes'  => array('Perda / Avaria', 'Uso interno', 'Ajuste de inventário', 'Devolução ao fornecedor'),
        'colunaQtd'  => 'Quantidade a baixar',
        'ajudaSaldo' => 'Disponível para baixa',
    ),
);
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Baixas de Estoque - EletroTech</title>
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
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
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

        .alert {
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
        }

        .card-lancamento {
            background-color: #282828;
            border: 1px solid rgba(251, 216, 20, 0.3);
            border-radius: 12px;
            padding: 25px 30px 30px 30px;
            max-width: 900px;
            margin: 0 auto;
        }

        .nav-tabs {
            border-bottom: 1px solid #555;
            margin-bottom: 25px;
        }

        .nav-tabs .nav-link {
            color: #a0a0a0;
            font-weight: 600;
            border: none;
            border-bottom: 3px solid transparent;
            padding: 10px 22px;
        }

        .nav-tabs .nav-link:hover {
            color: #ffffff;
            border-color: transparent;
        }

        .nav-tabs .nav-link.active {
            color: #FBD814;
            background-color: transparent;
            border-bottom-color: #FBD814;
        }

        label.rotulo {
            color: #ccc;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .form-select,
        .form-control {
            background-color: #1f1f1f;
            border: 1px solid #555;
            color: white;
        }

        .form-select:focus,
        .form-control:focus {
            border-color: #FBD814;
            box-shadow: none;
            background-color: #1f1f1f;
            color: white;
        }

        .form-control::placeholder {
            color: #777;
        }

        .ajuda {
            color: #a0a0a0;
            font-size: 12px;
            margin-top: 5px;
            display: block;
        }

        .saldo-atual {
            color: #FBD814;
            font-weight: 600;
        }

        .saldo-alerta {
            color: #f87171;
            font-weight: 600;
        }

        .doc-cabecalho {
            background-color: #1f1f1f;
            border-left: 4px solid #FBD814;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 25px;
        }

        .doc-cabecalho .titulo {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            flex-wrap: wrap;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .doc-cabecalho .grade {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px 30px;
            font-size: 14px;
        }

        .doc-cabecalho .rotulo-campo {
            color: #a0a0a0;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            display: block;
        }

        .badge-rascunho {
            background-color: rgba(251, 216, 20, 0.15);
            color: #FBD814;
            border: 1px solid #FBD814;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .secao-itens {
            color: #FBD814;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 30px 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #555;
        }

        table.tabela-itens {
            width: 100%;
            font-size: 14px;
            margin-bottom: 0;
        }

        table.tabela-itens th {
            color: #a0a0a0;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 600;
            padding: 8px 10px;
            border-bottom: 1px solid #555;
        }

        table.tabela-itens td {
            padding: 10px;
            border-bottom: 1px solid #3f3f3f;
            vertical-align: middle;
        }

        table.tabela-itens tfoot td {
            border-bottom: none;
            border-top: 2px solid #555;
            font-weight: 700;
            padding-top: 12px;
        }

        .sem-itens {
            text-align: center;
            color: #a0a0a0;
            font-style: italic;
            padding: 2rem 1rem;
        }

        .btn-remover {
            background: none;
            border: none;
            color: #f87171;
            font-size: 15px;
            padding: 2px 6px;
            transition: 0.2s;
        }

        .btn-remover:hover {
            color: #ffffff;
        }

        .btn-lancar {
            border: none;
            border-radius: 30px;
            padding: 10px 30px;
            font-weight: bold;
            text-transform: uppercase;
            transition: 0.3s;
        }

        .btn-entrada {
            background-color: #198754;
            color: #ffffff;
        }

        .btn-entrada:hover {
            background-color: #1aa463;
            color: #ffffff;
        }

        .btn-saida {
            background-color: #dc3545;
            color: #ffffff;
        }

        .btn-saida:hover {
            background-color: #e4505f;
            color: #ffffff;
        }

        .btn-incluir {
            background-color: #ebca1e;
            color: #282828;
            border: none;
            border-radius: 30px;
            padding: 9px 22px;
            font-weight: bold;
            text-transform: uppercase;
            transition: 0.3s;
            width: 100%;
        }

        .btn-incluir:hover {
            background-color: #ffffff;
        }

        .btn-cancelar-baixa {
            background-color: #555;
            color: #ffffff;
            border: none;
            border-radius: 30px;
            padding: 10px 26px;
            font-weight: bold;
            text-transform: uppercase;
            transition: 0.3s;
        }

        .btn-cancelar-baixa:hover {
            background-color: #777;
            color: #ffffff;
        }

        .acoes-form {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 12px;
            margin-top: 25px;
        }

        .acoes-form .aviso {
            margin-right: auto;
            color: #a0a0a0;
            font-size: 13px;
            font-style: italic;
        }
    </style>
</head>

<body>
    <?php $this->load->view('components/Navbar', array('ativo' => 'lancamentos')); ?>

    <div class="container">
        <div class="page-header">
            <h1>Baixas de Estoque</h1>
            <p>Abra a baixa, inclua os materiais e finalize. O estoque só é movimentado no fechamento.</p>
        </div>

        <?php if ($this->session->flashdata('erro')): ?>
            <div class="alert alert-danger"><?= $this->session->flashdata('erro') ?></div>
        <?php endif; ?>
        <?php if ($this->session->flashdata('sucesso')): ?>
            <div class="alert alert-success"><?= $this->session->flashdata('sucesso') ?></div>
        <?php endif; ?>

        <div class="card-lancamento">
            <ul class="nav nav-tabs" role="tablist">
                <?php foreach ($config as $tipo => $cfg): ?>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link <?= $aba === $tipo ? 'active' : '' ?>" data-bs-toggle="tab"
                            data-bs-target="#aba-<?= $tipo ?>" type="button" role="tab">
                            <i class="fa-solid <?= $cfg['icone'] ?>"></i> <?= $cfg['rotulo'] ?>
                            <?php if (!empty($abas[$tipo]['rascunho'])): ?>
                                <span class="badge-rascunho ms-1">rascunho</span>
                            <?php endif; ?>
                        </button>
                    </li>
                <?php endforeach; ?>
            </ul>

            <div class="tab-content">
                <?php foreach ($config as $tipo => $cfg): ?>
                    <?php
                    $rascunho = $abas[$tipo]['rascunho'];
                    $itens    = $abas[$tipo]['itens'];
                    $total    = array_sum(array_column($itens, 'valor_total'));
                    ?>
                    <div class="tab-pane fade <?= $aba === $tipo ? 'show active' : '' ?>" id="aba-<?= $tipo ?>" role="tabpanel">

                        <?php if (empty($rascunho)): ?>
                            <?= form_open('lancamentos/abrir') ?>
                            <input type="hidden" name="tipo" value="<?= $tipo ?>">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label class="rotulo" for="<?= $tipo ?>_data_baixa">Data da baixa</label>
                                    <input type="date" name="data_baixa" id="<?= $tipo ?>_data_baixa" class="form-control"
                                        max="<?= $hoje ?>" value="<?= $valor('data_baixa', $tipo, $hoje) ?>" required>
                                </div>
                                <div class="col-md-8">
                                    <label class="rotulo" for="<?= $tipo ?>_id_eletricista">Solicitante</label>
                                    <select name="id_eletricista" id="<?= $tipo ?>_id_eletricista" class="form-select" required>
                                        <option value="">Selecione o eletricista</option>
                                        <?php foreach ($eletricistas as $e): ?>
                                            <option value="<?= (int) $e['id'] ?>"
                                                <?= $valor('id_eletricista', $tipo) === (string) $e['id'] ? 'selected' : '' ?>>
                                                <?= htmlspecialchars($e['nome']) ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                    <?php if (empty($eletricistas)): ?>
                                        <span class="ajuda saldo-alerta">Nenhum eletricista ativo cadastrado.</span>
                                    <?php endif; ?>
                                </div>
                                <div class="col-12">
                                    <label class="rotulo" for="<?= $tipo ?>_observacao">Observação</label>
                                    <input type="text" name="observacao" id="<?= $tipo ?>_observacao" class="form-control"
                                        list="sugestoes-<?= $tipo ?>" maxlength="500"
                                        placeholder="Motivo ou informação adicional"
                                        value="<?= $valor('observacao', $tipo) ?>">
                                    <datalist id="sugestoes-<?= $tipo ?>">
                                        <?php foreach ($cfg['sugestoes'] as $sugestao): ?>
                                            <option value="<?= htmlspecialchars($sugestao) ?>"></option>
                                        <?php endforeach; ?>
                                    </datalist>
                                </div>
                            </div>

                            <div class="acoes-form">
                                <button type="submit" class="btn-lancar <?= $cfg['classeBtn'] ?>">
                                    <i class="fa-solid <?= $cfg['icone'] ?>"></i> Abrir baixa de <?= mb_strtolower($cfg['rotulo']) ?>
                                </button>
                            </div>
                            <?= form_close() ?>

                        <?php else: ?>
                            <div class="doc-cabecalho">
                                <div class="titulo">
                                    <span>
                                        <i class="fa-solid <?= $cfg['icone'] ?>"></i>
                                        Baixa de <?= mb_strtolower($cfg['rotulo']) ?> #<?= str_pad($rascunho['id'], 5, '0', STR_PAD_LEFT) ?>
                                    </span>
                                    <span class="badge-rascunho">rascunho</span>
                                </div>
                                <div class="grade">
                                    <div>
                                        <span class="rotulo-campo">Data</span>
                                        <?= date('d/m/Y', strtotime($rascunho['data_baixa'])) ?>
                                    </div>
                                    <div>
                                        <span class="rotulo-campo">Solicitante</span>
                                        <?= htmlspecialchars($rascunho['nome_eletricista']) ?>
                                    </div>
                                    <div>
                                        <span class="rotulo-campo">Observação</span>
                                        <?= $rascunho['observacao'] !== '' && $rascunho['observacao'] !== null
                                            ? htmlspecialchars($rascunho['observacao'])
                                            : '-' ?>
                                    </div>
                                </div>
                            </div>

                            <?= form_open('lancamentos/incluir_item') ?>
                            <input type="hidden" name="id_baixa" value="<?= (int) $rascunho['id'] ?>">
                            <div class="row g-3 align-items-end">
                                <div class="col-md-5">
                                    <label class="rotulo" for="<?= $tipo ?>_id_produto">Material</label>
                                    <select name="id_produto" id="<?= $tipo ?>_id_produto" class="form-select js-produto"
                                        data-alvo-preco="<?= $tipo ?>_valor_unitario" data-alvo-saldo="<?= $tipo ?>_saldo"
                                        <?= $tipo === 'saida' ? 'data-limite="' . $tipo . '_quantidade" data-aviso="' . $tipo . '_aviso"' : '' ?>
                                        required>
                                        <option value="">Selecione o material</option>
                                        <?php foreach ($produtos as $p): ?>
                                            <option value="<?= (int) $p['id'] ?>"
                                                data-preco="<?= number_format($p['vlr_unitario'], 2, '.', '') ?>"
                                                data-saldo="<?= (int) $p['qtd_estoque'] ?>">
                                                <?= htmlspecialchars($p['nome_produto']) ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                    <span class="ajuda"><?= $cfg['ajudaSaldo'] ?>: <span id="<?= $tipo ?>_saldo" class="saldo-atual">-</span></span>
                                </div>
                                <div class="col-md-3">
                                    <label class="rotulo" for="<?= $tipo ?>_quantidade"><?= $cfg['colunaQtd'] ?></label>
                                    <input type="number" name="quantidade" id="<?= $tipo ?>_quantidade" class="form-control"
                                        min="1" step="1" required>
                                    <?php if ($tipo === 'saida'): ?>
                                        <span class="ajuda" id="<?= $tipo ?>_aviso"></span>
                                    <?php endif; ?>
                                </div>
                                <div class="col-md-2">
                                    <label class="rotulo" for="<?= $tipo ?>_valor_unitario">Valor un. (R$)</label>
                                    <input type="number" name="valor_unitario" id="<?= $tipo ?>_valor_unitario" class="form-control"
                                        min="0" step="0.01" required>
                                </div>
                                <div class="col-md-2">
                                    <button type="submit" class="btn-incluir">
                                        <i class="fa-solid fa-plus"></i> Incluir
                                    </button>
                                </div>
                            </div>
                            <?= form_close() ?>

                            <div class="secao-itens">Materiais da baixa</div>

                            <?php if (empty($itens)): ?>
                                <p class="sem-itens">Nenhum material incluído ainda. A baixa fica salva em rascunho até você finalizar.</p>
                            <?php else: ?>
                                <table class="tabela-itens">
                                    <thead>
                                        <tr>
                                            <th>Material</th>
                                            <th class="text-center">Qtd</th>
                                            <th class="text-end">Valor un.</th>
                                            <th class="text-end">Subtotal</th>
                                            <th class="text-center">&nbsp;</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($itens as $item): ?>
                                            <tr>
                                                <td><?= htmlspecialchars($item['nome_produto']) ?></td>
                                                <td class="text-center"><?= (int) $item['quantidade'] ?></td>
                                                <td class="text-end">R$ <?= number_format($item['valor_unitario'], 2, ',', '.') ?></td>
                                                <td class="text-end">R$ <?= number_format($item['valor_total'], 2, ',', '.') ?></td>
                                                <td class="text-center">
                                                    <?= form_open('lancamentos/remover_item', array('style' => 'display:inline;margin:0;')) ?>
                                                    <input type="hidden" name="id_baixa" value="<?= (int) $rascunho['id'] ?>">
                                                    <input type="hidden" name="id_item" value="<?= (int) $item['id'] ?>">
                                                    <button type="submit" class="btn-remover" title="Retirar da baixa">
                                                        <i class="fa-solid fa-xmark"></i>
                                                    </button>
                                                    <?= form_close() ?>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="3" class="text-end">Total da baixa</td>
                                            <td class="text-end">R$ <?= number_format($total, 2, ',', '.') ?></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            <?php endif; ?>

                            <div class="acoes-form">
                                <span class="aviso">O estoque só será alterado quando você finalizar.</span>

                                <?= form_open('lancamentos/cancelar', array('style' => 'display:inline;margin:0;')) ?>
                                <input type="hidden" name="id_baixa" value="<?= (int) $rascunho['id'] ?>">
                                <button type="submit" class="btn-cancelar-baixa"
                                    onclick="return confirm('Cancelar esta baixa? Os materiais incluídos serão descartados.');">
                                    <i class="fa-solid fa-xmark"></i> Cancelar
                                </button>
                                <?= form_close() ?>

                                <?= form_open('lancamentos/finalizar', array('style' => 'display:inline;margin:0;')) ?>
                                <input type="hidden" name="id_baixa" value="<?= (int) $rascunho['id'] ?>">
                                <button type="submit" class="btn-lancar <?= $cfg['classeBtn'] ?>" <?= empty($itens) ? 'disabled' : '' ?>>
                                    <i class="fa-solid fa-check"></i> Finalizar
                                </button>
                                <?= form_close() ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const selects = document.querySelectorAll('.js-produto');

            const dadosSelecionados = function (select) {
                const opcao = select.options[select.selectedIndex];

                if (!opcao || opcao.value === '') {
                    return null;
                }

                return {
                    preco: opcao.dataset.preco,
                    saldo: parseInt(opcao.dataset.saldo, 10)
                };
            };

            // Só conveniência: quem decide o saldo é o UPDATE do model.
            const conferirSaldo = function (select) {
                if (!select.dataset.limite) {
                    return;
                }

                const campoQtd = document.getElementById(select.dataset.limite);
                const aviso = document.getElementById(select.dataset.aviso);

                if (!campoQtd || !aviso) {
                    return;
                }

                const dados = dadosSelecionados(select);
                const excedeu = dados !== null && parseInt(campoQtd.value, 10) > dados.saldo;

                aviso.textContent = excedeu ? 'Maior que o estoque disponível.' : '';
                aviso.className = excedeu ? 'ajuda saldo-alerta' : 'ajuda';
            };

            selects.forEach(function (select) {
                const campoPreco = document.getElementById(select.dataset.alvoPreco);
                const campoSaldo = document.getElementById(select.dataset.alvoSaldo);
                const campoQtd = select.dataset.limite ? document.getElementById(select.dataset.limite) : null;

                select.addEventListener('change', function () {
                    const dados = dadosSelecionados(select);

                    campoSaldo.textContent = dados === null ? '-' : dados.saldo + ' un.';

                    if (dados !== null) {
                        campoPreco.value = dados.preco;
                    }

                    conferirSaldo(select);
                });

                if (campoQtd) {
                    campoQtd.addEventListener('input', function () {
                        conferirSaldo(select);
                    });
                }
            });
        });
    </script>
</body>

</html>
