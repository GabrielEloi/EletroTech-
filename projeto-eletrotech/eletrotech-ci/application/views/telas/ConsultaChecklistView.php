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

        .page-title {
            margin-top: 2.5rem;
            margin-bottom: 1rem;
        }

        .page-title h1 {
            color: #FBD814;
            font-size: 1.75rem;
            font-weight: bold;
            margin: 0;
        }

        .filtro-container {
            background-color: #282828;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #FBD814;
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            align-items: flex-end;
        }

        .filtro-container select {
            background-color: #3c3b3b;
            color: white;
            border: 1px solid #777;
            border-radius: 5px;
            padding: 8px;
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

        .table-empty {
            text-align: center;
            color: #a0a0a0;
            padding: 2rem;
            font-style: italic;
        }

        .alert-success,
        .alert-danger {
            background-color: transparent !important;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            font-weight: 500;
        }

        .alert-success {
            color: #198754 !important;
            border: 1px solid #198754 !important;
        }

        .alert-danger {
            color: #dc3545 !important;
            border: 1px solid #dc3545 !important;
        }

        .modal-content.eletrotech-modal {
            background-color: #282828;
            color: white;
            border: 1px solid #FBD814;
            border-radius: 12px;
        }

        .modal-content.eletrotech-modal .modal-header {
            border-bottom: 1px solid rgba(251, 216, 20, 0.3);
        }

        .modal-content.eletrotech-modal .modal-title {
            color: #FBD814;
            font-weight: bold;
        }

        .eletrotech-form label {
            color: #ccc;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .eletrotech-form textarea {
            border: none;
            border-bottom: 1px solid #777;
            background: transparent;
            color: white;
            padding: 10px 0;
            width: 100%;
            outline: none;
            margin-bottom: 18px;
            font-size: 14px;
            min-height: 100px;
            resize: vertical;
        }

        .eletrotech-form textarea:focus {
            border-bottom: 2px solid #FBD814;
        }

        .eletrotech-form .btn-submit {
            background-color: #ebca1e;
            color: #282828;
            border: none;
            border-radius: 30px;
            padding: 12px 20px;
            font-weight: bold;
            text-transform: uppercase;
            transition: 0.3s;
        }

        .eletrotech-form .btn-submit:hover {
            background-color: #ffffff;
        }
    </style>
</head>

<body>
    <?php $this->load->view('components/Navbar', ['ativo' => 'consultachecklist']); ?>

    <div class="container mt-3">
        <?php if ($this->session->flashdata('erro')): ?>
            <div class="alert alert-danger text-center"><?= $this->session->flashdata('erro') ?></div>
        <?php endif; ?>
        <?php if ($this->session->flashdata('sucesso')): ?>
            <div class="alert alert-success text-center"><?= $this->session->flashdata('sucesso') ?></div>
        <?php endif; ?>

        <div class="page-title">
            <h1><i class="fa-solid fa-clipboard-check"></i> Consulta Checklist</h1>
        </div>

        <form method="GET" action="<?= site_url('consultachecklist') ?>" class="filtro-container">
            <div>
                <label for="filtro_tipo" style="font-size:12px;color:#FBD814;font-weight:bold;">Filtrar por tipo:</label>
                <select name="tipo" id="filtro_tipo">
                    <option value="" <?= empty($filtroTipo) ? 'selected' : '' ?>>Todos</option>
                    <option value="inicio" <?= $filtroTipo === 'inicio' ? 'selected' : '' ?>>Início</option>
                    <option value="fim" <?= $filtroTipo === 'fim' ? 'selected' : '' ?>>Fim</option>
                </select>
            </div>

            <div>
                <label for="filtro_eletricista" style="font-size:12px;color:#FBD814;font-weight:bold;">Filtrar por eletricista:</label>
                <select name="eletricista" id="filtro_eletricista">
                    <option value="" <?= empty($filtroEletricista) ? 'selected' : '' ?>>Todos</option>
                    <?php if (!empty($eletricistas)): ?>
                        <?php foreach ($eletricistas as $e): ?>
                            <option value="<?= $e['id'] ?>" <?= (string)($filtroEletricista ?? '') === (string)$e['id'] ? 'selected' : '' ?>>
                                <?= htmlspecialchars($e['nome']) ?>
                            </option>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </select>
            </div>

            <div>
                <label for="ordenar" style="font-size:12px;color:#FBD814;font-weight:bold;">Ordenar por:</label>
                <select name="ordenar" id="ordenar">
                    <option value="data_desc" <?= ($ordenar ?? 'data_desc') === 'data_desc' ? 'selected' : '' ?>>Bloqueio (mais recente)</option>
                    <option value="data_asc" <?= ($ordenar ?? '') === 'data_asc' ? 'selected' : '' ?>>Bloqueio (mais antigo)</option>
                    <option value="os_asc" <?= ($ordenar ?? '') === 'os_asc' ? 'selected' : '' ?>>OS (crescente)</option>
                    <option value="os_desc" <?= ($ordenar ?? '') === 'os_desc' ? 'selected' : '' ?>>OS (decrescente)</option>
                    <option value="eletricista_asc" <?= ($ordenar ?? '') === 'eletricista_asc' ? 'selected' : '' ?>>Eletricista (A-Z)</option>
                    <option value="eletricista_desc" <?= ($ordenar ?? '') === 'eletricista_desc' ? 'selected' : '' ?>>Eletricista (Z-A)</option>
                </select>
            </div>

            <div>
                <button type="submit" class="btn btn-outline-warning"><i class="fa-solid fa-search"></i> Buscar</button>
                <a href="<?= site_url('consultachecklist') ?>" class="btn btn-outline-secondary" title="Limpar Filtros"><i class="fa-solid fa-times"></i></a>
            </div>
        </form>

        <div class="table-responsive">
            <table class="table table-dark table-hover table-bordered custom-table text-center">
                <thead>
                    <tr>
                        <th style="width: 15%;">Ações</th>
                        <th>OS</th>
                        <th>Eletricista</th>
                        <th>Tipo</th>
                        <th>Status da OS</th>
                        <th>Bloqueado em</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($checklists)): ?>
                        <?php foreach ($checklists as $c): ?>
                            <tr>
                                <td>
                                    <a href="<?= site_url('consultachecklist/relatorio/' . $c['id_os'] . '/' . $c['tipo']) ?>" target="_blank" class="btn btn-sm btn-outline-info" title="Gerar relatório">
                                        <i class="fa-solid fa-file-lines"></i>
                                    </a>
                                    <button type="button" class="btn btn-sm btn-outline-warning"
                                        onclick="abrirModalFinalizar(<?= $c['id_os'] ?>, '<?= $c['tipo'] ?>')"> Decidir
                                    </button>
                                </td>
                                <td>#<?= str_pad($c['id_os'], 5, '0', STR_PAD_LEFT) ?></td>
                                <td><?= htmlspecialchars($c['nome_eletricista'] ?? '-') ?></td>
                                <td><?= ucfirst($c['tipo']) ?></td>
                                <td><span class="badge bg-danger">Bloqueado (<?= htmlspecialchars($c['status_os']) ?>)</span></td>
                                <td><?= $c['data_bloqueio'] ? date('d/m/Y H:i', strtotime($c['data_bloqueio'])) : '-' ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="6" class="table-empty">Nenhum checklist bloqueado no momento.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <?php $this->load->view('components/Pagination'); ?>
    </div>

    <div class="modal fade" id="modalFinalizar" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Finalizar Checklist</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <?= form_open('consultachecklist/finalizar', ['class' => 'eletrotech-form']) ?>
                    <input type="hidden" name="id_os" id="finalizar_id_os">
                    <input type="hidden" name="tipo" id="finalizar_tipo">
                    <label class="required">Observação</label>
                    <textarea name="observacao" placeholder="Descreva o motivo da decisão..." required></textarea>
                    <div class="d-flex gap-2 mt-2">
                        <button type="submit" name="acao" value="autorizar" class="btn-submit flex-fill">Autorizar</button>
                        <button type="submit" name="acao" value="negar" class="btn-submit flex-fill" style="background-color:#dc3545;color:#fff;">Negar</button>
                    </div>
                    <?= form_close() ?>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function abrirModalFinalizar(idOs, tipo) {
            document.getElementById('finalizar_id_os').value = idOs;
            document.getElementById('finalizar_tipo').value = tipo;
            new bootstrap.Modal(document.getElementById('modalFinalizar')).show();
        }
    </script>
    <?php $this->load->view('components/Chatbot'); ?>
</body>

</html>