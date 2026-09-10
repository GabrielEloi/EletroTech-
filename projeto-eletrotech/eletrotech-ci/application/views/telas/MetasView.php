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

        .filtro-container {
            background-color: #282828;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #FBD814;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            align-items: flex-end;
        }

        .filtro-container select,
        .filtro-container input {
            background-color: #3c3b3b;
            color: white;
            border: 1px solid #777;
            border-radius: 5px;
            padding: 8px;
        }

        .filtro-container select:focus,
        .filtro-container input:focus {
            border-color: #FBD814;
            outline: none;
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

        form.eletrotech-form input,
        form.eletrotech-form select {
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

        form.eletrotech-form input:focus,
        form.eletrotech-form select:focus {
            border-bottom: 2px solid #FBD814;
        }

        form.eletrotech-form input:disabled {
            border-bottom: 1px solid #555;
            color: #777;
            cursor: not-allowed;
        }

        form.eletrotech-form option {
            background-color: #282828;
            color: white;
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
    <?php $this->load->view('components/Navbar', array('ativo' => 'metas')); ?>


    <div class="container mt-3">
        <?php if ($this->session->flashdata('erro')): ?>
            <div class="alert alert-danger text-center"><?= $this->session->flashdata('erro') ?></div>
        <?php endif; ?>
        <?php if ($this->session->flashdata('sucesso')): ?>
            <div class="alert alert-success text-center"><?= $this->session->flashdata('sucesso') ?></div>
        <?php endif; ?>
    </div>

    <div id="acoes_id">
        <button data-bs-toggle="modal" data-bs-target="#modalNovaMeta">
            <i class="fa-solid fa-plus"></i> Nova Meta
        </button>
    </div>

    <div class="container mt-2">
        <form method="GET" action="<?= site_url('metas') ?>" class="filtro-container">
            <div style="flex-grow: 1;">
                <label for="filtro_eletricista" style="font-size: 12px; color: #FBD814; font-weight: bold;">Filtrar Eletricista:</label>
                <select name="filtro_eletricista" id="filtro_eletricista" class="w-100">
                    <option value="">Todos os Eletricistas</option>
                    <?php foreach ($eletricistasAtivos as $ativo): ?>
                        <option value="<?= $ativo['id'] ?>" <?= $filtroEletricista == $ativo['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($ativo['nome']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label for="filtro_mes" style="font-size: 12px; color: #FBD814; font-weight: bold;">Mês de Referência:</label>
                <input type="month" name="filtro_mes" id="filtro_mes" value="<?= htmlspecialchars($filtroMes) ?>">
            </div>
            <div>
                <button type="submit" class="btn btn-outline-warning" style="padding: 8px 15px;"><i class="fa-solid fa-search"></i> Buscar</button>
                <a href="<?= site_url('metas') ?>" class="btn btn-outline-secondary" style="padding: 8px 15px;" title="Limpar Filtros"><i class="fa-solid fa-times"></i></a>
            </div>
        </form>

        <table class="table table-dark table-hover table-bordered custom-table text-center">
            <thead>
                <tr>
                    <th scope="col" style="width: 15%;">Ações</th>
                    <th scope="col" style="width: 40%;">Eletricista</th>
                    <th scope="col" style="width: 20%;">Mês de Referência</th>
                    <th scope="col" style="width: 15%;">Valor da Meta</th>
                    <th scope="col" style="width: 10%;">ID</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($metas)): ?>
                    <?php foreach ($metas as $meta): ?>
                        <tr>
                            <td>
                                <button type="button" class="btn btn-sm btn-outline-warning"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalEditarMeta"
                                    data-id="<?= $meta['id'] ?>"
                                    data-nome_eletricista="<?= htmlspecialchars($meta['nome_eletricista']) ?>"
                                    data-mes="<?= $meta['mes_meta'] ?>"
                                    data-valor="<?= $meta['vlr_meta'] ?>"
                                    onclick="preencherModalEditarMeta(this)">
                                    <i class="fa-solid fa-pen"></i>
                                </button>

                                <a href="<?= site_url('metas/excluir/' . $meta['id']) ?>"
                                    class="btn btn-sm btn-outline-danger" onclick="return confirm('Excluir esta meta?');">
                                    <i class="fa-solid fa-trash"></i>
                                </a>
                            </td>
                            <td><?= htmlspecialchars($meta['nome_eletricista']) ?></td>
                            <td><?= htmlspecialchars($meta['mes_meta'] ?? '-') ?></td>
                            <td>R$ <?= number_format($meta['vlr_meta'], 2, ',', '.') ?></td>

                            <td><?= $meta['id'] ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="5" class="empty-state">Nenhuma meta encontrada para os filtros selecionados.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
        <?php $this->load->view('components/Pagination'); ?>
    </div>

    <div class="modal fade" id="modalNovaMeta" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Criar Nova Meta</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="mb-3" style="color:#FBD814; font-size:12px; font-weight:bold;">* campos obrigatórios</p>
                    <?= form_open('metas/cadastrar', ['class' => 'eletrotech-form']) ?>

                    <label for="eletricista" class="required">Eletricista Responsável</label>
                    <select name="eletricista_meta" id="eletricista" required>
                        <option value="" disabled selected hidden>Selecione um eletricista ativo...</option>
                        <?php foreach ($eletricistasAtivos as $ativo): ?>
                            <option value="<?= $ativo['id'] ?>"><?= htmlspecialchars($ativo['nome']) ?></option>
                        <?php endforeach; ?>
                    </select>

                    <label for="mes_meta" class="required">Mês de Referência</label>
                    <input type="month" name="mes_meta" id="mes_meta" required />

                    <label for="vlr_meta" class="required">Valor da Meta (R$)</label>
                    <input type="number" step="0.01" name="vlr_meta" id="vlr_meta" placeholder="Ex: 5000.00" required />

                    <button type="submit" class="btn-submit mt-3">Salvar Meta</button>

                    <?= form_close() ?>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalEditarMeta" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Editar Valor da Meta</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="mb-3" style="color:#FBD814; font-size:12px; font-weight:bold;">* campos obrigatórios</p>
                    <?= form_open('metas/editar', ['class' => 'eletrotech-form']) ?>

                    <input type="hidden" name="id" id="edit_meta_id">

                    <label for="edit_eletricista">Eletricista (Imutável)</label>
                    <input type="text" id="edit_eletricista" disabled title="Não é possível alterar o eletricista após a criação">

                    <label for="edit_mes_meta">Mês de Referência (Imutável)</label>
                    <input type="month" id="edit_mes_meta" disabled title="Não é possível alterar o mês após a criação">

                    <label for="edit_vlr_meta">Novo Valor da Meta (R$)</label>
                    <input type="number" step="0.01" name="vlr_meta" id="edit_vlr_meta" required>

                    <button type="submit" class="btn-submit mt-4">Gravar Novo Valor</button>

                    <?= form_close() ?>
                </div>
            </div>
        </div>
    </div>

    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        const preencherModalEditarMeta = (botao) => {
            const id = botao.getAttribute('data-id');
            const nomeEletricista = botao.getAttribute('data-nome_eletricista');
            const mes = botao.getAttribute('data-mes');
            const valor = botao.getAttribute('data-valor');

            document.getElementById('edit_meta_id').value = id;
            document.getElementById('edit_eletricista').value = nomeEletricista;
            document.getElementById('edit_mes_meta').value = mes;
            document.getElementById('edit_vlr_meta').value = valor;
        };
    </script>

</body>

</html>