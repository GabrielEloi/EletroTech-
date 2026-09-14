<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title><?= $titulo ?></title>
    <style>
        body {
            background-color: #3c3b3b;
            color: white;
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

        #acoes_id {
            background-color: #3c3b3b;
            margin-top: 3rem;
            margin-bottom: 2rem;
            gap: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        #acoes_id>button,
        #acoes_id a button {
            background-color: #ebca1e;
            color: #282828;
            border-radius: 30px;
            padding: 10px 20px;
            border: none;
            font-weight: bold;
            transition: 0.3s;
        }

        #acoes_id>button:hover,
        #acoes_id a button:hover {
            background-color: #ffffff;
            color: #282828;
        }

        table.table.custom-table,
        table.table.custom-table th,
        table.table.custom-table td {
            border-color: #FBD814;
            vertical-align: middle;
        }

        table.table.custom-table thead th {
            color: #FBD814;
            font-size: 1.1rem;
        }

        table.table.custom-table td.empty-state {
            text-align: center;
            color: #a0a0a0;
            padding: 2rem;
            font-style: italic;
        }

        .modal-content.eletrotech-modal {
            background-color: #282828;
            color: white;
            border: 1px solid #FBD814;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .modal-content.eletrotech-modal .modal-header {
            border-bottom: 1px solid rgba(251, 216, 20, 0.3);
        }

        .modal-content.eletrotech-modal .modal-title {
            color: #FBD814;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 1.1rem;
        }

        .btn-close-white {
            filter: invert(1) grayscale(100%) brightness(200%);
        }

        form.eletrotech-form {
            display: flex;
            flex-direction: column;
        }

        form.eletrotech-form label {
            color: #ccc;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        form.eletrotech-form label.required::after {
            content: ' *';
            color: #FBD814;
        }

        form.eletrotech-form input {
            border: none;
            border-bottom: 1px solid #777;
            background: transparent;
            color: white;
            padding: 8px 0;
            width: 100%;
            outline: none;
            margin-bottom: 20px;
            font-size: 14px;
            transition: border-bottom 0.3s;
        }

        form.eletrotech-form input:focus {
            border-bottom: 2px solid #FBD814;
        }

        form.eletrotech-form .btn-submit {
            background-color: #ebca1e;
            color: #282828;
            border: none;
            border-radius: 30px;
            padding: 12px 20px;
            font-weight: bold;
            text-transform: uppercase;
            transition: 0.3s;
            margin-top: 10px;
        }

        form.eletrotech-form .btn-submit:hover {
            background-color: #ffffff;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .alert-success {
            background-color: transparent !important;
            color: #198754 !important;
            border: 1px solid #198754 !important;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            animation: fadeIn 0.5s ease-out;
            font-weight: 500;
        }

        .alert-danger {
            background-color: transparent !important;
            color: #dc3545 !important;
            border: 1px solid #dc3545 !important;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            animation: fadeIn 0.5s ease-out;
            font-weight: 500;
        }
    </style>
</head>

<body>
    <?php $this->load->view('components/Navbar', array('ativo' => 'produtos')); ?>


    <div class="container mt-3">
        <?php if ($this->session->flashdata('erro')): ?>
            <div class="alert alert-danger text-center"><?= $this->session->flashdata('erro') ?></div>
        <?php endif; ?>
        <?php if ($this->session->flashdata('sucesso')): ?>
            <div class="alert alert-success text-center"><?= $this->session->flashdata('sucesso') ?></div>
        <?php endif; ?>
    </div>

    <div id="acoes_id">
        <button type="button" data-bs-toggle="modal" data-bs-target="#modalNovoProduto">
            <i class="fa-solid fa-plus"></i> Novo Produto
        </button>
    </div>

    <div class="container mt-2">
        <table class="table table-dark table-hover table-bordered custom-table text-center">
            <thead>
                <tr>
                    <th scope="col" style="width: 15%;">Ações</th>
                    <th scope="col" style="width: 45%;">Nome do Produto</th>
                    <th scope="col" style="width: 20%;">Valor Unitário</th>
                    <th scope="col" style="width: 10%;">Qtd. Estoque</th>
                    <th scope="col" style="width: 10%;">ID</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($produtos)): ?>
                    <?php foreach ($produtos as $produto): ?>
                        <tr>
                            <td>
                                <button type="button" class="btn btn-sm btn-outline-warning"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalEditarProduto"
                                    data-id="<?= $produto['id'] ?>"
                                    data-nome="<?= htmlspecialchars($produto['nome_produto']) ?>"
                                    data-valor="<?= $produto['vlr_unitario'] ?>"
                                    onclick="preencherModalEditarProduto(this)">
                                    <i class="fa-solid fa-pen"></i>
                                </button>

                                <a href="<?= site_url('produtos/ZerarEstoque/' . $produto['id']) ?>"
                                    class="btn btn-sm btn-outline-danger" onclick="return confirm('Zerar estoque?');">
                                    <i class="fa-solid fa-trash"></i>
                                </a>

                                <button type="button" class="btn btn-sm btn-outline-success"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalAumentarEstoque"
                                    data-id="<?= $produto['id'] ?>"
                                    data-nome="<?= htmlspecialchars($produto['nome_produto']) ?>"
                                    onclick="preencherModalAumentarEstoque(this)">
                                    <i class="fa-solid fa-plus"></i>
                                </button>

                            </td>
                            <td><?= htmlspecialchars($produto['nome_produto']) ?></td>
                            <td>R$ <?= number_format($produto['vlr_unitario'], 2, ',', '.') ?></td>
                            <td><?= $produto['qtd_estoque'] ?></td>
                            <td><?= $produto['id'] ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="5" class="empty-state">Nenhum produto cadastrado no momento.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>

        <?php $this->load->view('components/Pagination'); ?>
    </div>

    <div class="modal fade" id="modalNovoProduto" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Cadastrar Novo Produto</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="mb-3" style="color:#FBD814; font-size:12px; font-weight:bold;">* campos obrigatórios</p>
                    <?= form_open('produtos/cadastrar', ['class' => 'eletrotech-form']) ?>
                    <label for="nome_material" class="required">Nome / Descrição do Material</label>
                    <input type="text" name="nome_produto" id="nome_material" placeholder="Ex: Cabo PP 2,5mm²" required />

                    <label for="preco_unitario" class="required">Preço Unitário (R$)</label>
                    <input type="text" name="vlr_unitario" id="preco_unitario" placeholder="Ex: 8.90" required />

                    <label for="quantidade_inicial" class="required">Quantidade em Estoque</label>
                    <input type="number" name="qtd_estoque" id="quantidade_inicial" min="0" placeholder="Ex: 100" required />

                    <button type="submit" class="btn-submit mt-3">Salvar Produto</button>
                    <?= form_close() ?>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalEditarProduto" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Editar Produto</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="mb-3" style="color:#FBD814; font-size:12px; font-weight:bold;">* campos obrigatórios</p>
                    <?= form_open('produtos/editar', ['class' => 'eletrotech-form']) ?>

                    <input type="hidden" name="id" id="edit_produto_id">

                    <label for="edit_nome_produto">Nome do Produto</label>
                    <input type="text" name="nome_produto" id="edit_nome_produto" required>

                    <label for="edit_vlr_unitario">Valor Unitário (R$)</label>
                    <input type="number" step="0.01" name="vlr_unitario" id="edit_vlr_unitario" required>

                    <button type="submit" class="btn-submit mt-4">Gravar Alterações</button>
                    <?= form_close() ?>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalAumentarEstoque" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Aumentar Estoque</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <?= form_open('produtos/aumentarQtdEstoque/', ['class' => 'eletrotech-form', 'id' => 'formAumentarEstoque']) ?>

                    <input type="hidden" name="id" id="aumentar_estoque_produto_id">

                    <label>Produto</label>
                    <p id="aumentar_estoque_produto_nome" style="margin-bottom: 20px; font-weight: 700;"></p>

                    <label for="qtd_estoque">Quantidade a adicionar</label>
                    <input type="number" name="qtd_estoque" id="qtd_estoque" min="1" placeholder="Ex: 10" required>

                    <button type="submit" class="btn-submit mt-3">Atualizar Estoque</button>
                    <?= form_close() ?>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        const preencherModalEditarProduto = (botao) => {
            const id = botao.getAttribute('data-id');
            const nome = botao.getAttribute('data-nome');
            const valor = botao.getAttribute('data-valor');

            document.getElementById('edit_produto_id').value = id;
            document.getElementById('edit_nome_produto').value = nome;
            document.getElementById('edit_vlr_unitario').value = valor;
        };

        const preencherModalAumentarEstoque = (botao) => {
            const id = botao.getAttribute('data-id');
            const nome = botao.getAttribute('data-nome');

            document.getElementById('aumentar_estoque_produto_id').value = id;
            document.getElementById('aumentar_estoque_produto_nome').textContent = nome;
        };

    </script>
    <?php $this->load->view('components/Chatbot'); ?>

</body>

</html>