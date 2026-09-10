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

        .summary-box {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid #FBD814;
            padding: 18px;
            border-radius: 12px;
            flex: 1;
            min-width: 240px;
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
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='%23FBD814' stroke-width='2.5' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
        }

        .page-title {
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.75rem;
        }

        .page-title h1 {
            color: #FBD814;
            font-size: 1.75rem;
            font-weight: bold;
            margin: 0;
        }

        .page-title span {
            color: #cccccc;
            font-size: 0.95rem;
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
            animation: fadeIn 0.5s ease-out;
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

        .eletrotech-form {
            display: flex;
            flex-direction: column;
        }

        .eletrotech-form label {
            color: #ccc;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .eletrotech-form label.required::after {
            content: ' *';
            color: #FBD814;
        }

        .eletrotech-form input,
        .eletrotech-form select,
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
        }

        .eletrotech-form textarea {
            min-height: 100px;
            resize: vertical;
        }

        .eletrotech-form input:focus,
        .eletrotech-form select:focus,
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
            margin-top: 10px;
        }

        .eletrotech-form .btn-submit:hover {
            background-color: #ffffff;
        }

        .question-row {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .question-row textarea {
            flex: 1;
        }

        .subQuestion {
            font-size: 12px;
            color: #f7f7f7;
        }

        .remove-pergunta {
            background: none;
            border: none;
            color: #dc3545;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            margin-top: 4px;
        }

        .remove-pergunta:hover {
            color: #ff8181;
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
    </style>
</head>

<body>
    <?php $this->load->view('components/Navbar', ['ativo' => 'checklist']); ?>

    <div class="container mt-3">
        <?php if ($this->session->flashdata('erro')): ?>
            <div class="alert alert-danger text-center"><?= $this->session->flashdata('erro') ?></div>
        <?php endif; ?>
        <?php if ($this->session->flashdata('sucesso')): ?>
            <div class="alert alert-success text-center"><?= $this->session->flashdata('sucesso') ?></div>
        <?php endif; ?>

        <div class="d-flex flex-wrap gap-3 mb-4">
            <div class="summary-box">
                <strong>Checklist Início Selecionado</strong>
                <p class="mb-0"><?= !empty($selectedInicio) ? htmlspecialchars($selectedInicio['titulo']) : 'Nenhum checklist de início selecionado' ?></p>
                <small class="subQuestion"><?= !empty($selectedInicio) ? count($selectedInicio['perguntas']) . ' pergunta(s)' : '' ?></small>
            </div>
            <div class="summary-box">
                <strong>Checklist Fim Selecionado</strong>
                <p class="mb-0"><?= !empty($selectedFim) ? htmlspecialchars($selectedFim['titulo']) : 'Nenhum checklist de fim selecionado' ?></p>
                <small class="subQuestion"><?= !empty($selectedFim) ? count($selectedFim['perguntas']) . ' pergunta(s)' : '' ?></small>
            </div>
        </div>

        <div id="acoes_id">
            <button type="button" data-bs-toggle="modal" data-bs-target="#modalNovoChecklist">
                <i class="fa-solid fa-plus"></i> Novo Checklist
            </button>
        </div>

        <div class="container mt-2">
            <form method="GET" action="<?= site_url('checklist') ?>" class="filtro-container">
                <div style="flex-grow:1; min-width:220px;">
                    <label for="filtro_titulo" style="font-size: 12px; color: #FBD814; font-weight: bold;">Buscar por título:</label>
                    <input type="text" name="titulo" id="filtro_titulo" class="w-100"
                        placeholder="Digite o título do checklist"
                        value="<?= isset($filterTitulo) ? htmlspecialchars($filterTitulo) : '' ?>">
                </div>
                <div style="flex-grow:1; min-width:180px;">
                    <label for="filtro_tipo" style="font-size: 12px; color: #FBD814; font-weight: bold;">Filtrar por tipo:</label>
                    <select name="tipo" id="filtro_tipo" class="w-100">
                        <option value="" <?= empty($filterTipo) ? 'selected' : '' ?>>Todos</option>
                        <option value="inicio" <?= (isset($filterTipo) && $filterTipo === 'inicio') ? 'selected' : '' ?>>Início</option>
                        <option value="fim" <?= (isset($filterTipo) && $filterTipo === 'fim') ? 'selected' : '' ?>>Fim</option>
                    </select>
                </div>
                <div>
                    <button type="submit" class="btn btn-outline-warning" style="padding: 8px 15px;"><i class="fa-solid fa-search"></i> Buscar</button>
                    <a href="<?= site_url('checklist') ?>" class="btn btn-outline-secondary" style="padding: 8px 15px;" title="Limpar Filtros"><i class="fa-solid fa-times"></i></a>
                </div>
            </form>

            <div class="table-responsive">
                <table class="table table-dark table-hover table-bordered custom-table text-center">
                    <thead>
                        <tr>
                            <th scope="col" style="width: 8%;">Ações</th>
                            <th scope="col" style="width: 5%;">ID</th>
                            <th scope="col">Título</th>
                            <th scope="col" style="width: 12%;">Tipo</th>
                            <th scope="col" style="width: 12%;">Perguntas</th>
                            <th scope="col" style="width: 18%;">Padrão</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (!empty($checklists)): ?>
                            <?php foreach ($checklists as $checklist): ?>
                                <tr>
                                    <td>
                                        <button type="button" class="btn btn-sm btn-outline-info" onclick="fetchPerguntas(<?= $checklist['id'] ?>)">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="if(confirm('Tem certeza que deseja excluir este checklist?')) { window.location.href='<?= site_url('checklist/excluir/' . $checklist['id']) ?>'; }">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                    <td><?= $checklist['id'] ?></td>
                                    <td><?= htmlspecialchars($checklist['titulo']) ?></td>
                                    <td><?= htmlspecialchars(ucfirst($checklist['tipo'] ?? '')) ?></td>
                                    <td><?= intval($checklist['total_perguntas']) ?></td>
                                    <td>
                                        <?php if ($checklist['selecionado']): ?>
                                            <span class="badge bg-success">Selecionado</span>
                                        <?php else: ?>
                                            <?= form_open('checklist/selecionar', ['style' => 'display:inline-block;margin:0;']) ?>
                                            <input type="hidden" name="id_checklist" value="<?= $checklist['id'] ?>">
                                            <input type="hidden" name="tipo" value="<?= $checklist['tipo'] ?>">
                                            <button type="submit" class="btn btn-sm btn-outline-warning">Definir padrão</button>
                                            <?= form_close() ?>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="6" class="table-empty">Nenhum checklist encontrado para os filtros selecionados.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>

                <?php $this->load->view('components/Pagination'); ?>
            </div>
        </div>

        <div class="modal fade" id="modalNovoChecklist" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content eletrotech-modal">
                    <div class="modal-header">
                        <h5 class="modal-title">Cadastrar Checklist</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <p class="mb-3" style="color:#FBD814; font-size:12px; font-weight:bold;">* campos obrigatórios</p>
                        <?= form_open('checklist/cadastrar', ['class' => 'eletrotech-form']) ?>

                        <label for="titulo_checklist" class="required">Título do checklist</label>
                        <input type="text" name="titulo" id="titulo_checklist" placeholder="Ex: Checklist de abertura de OS" required>

                        <label for="tipo_checklist" class="required">Tipo do Checklist</label>
                        <select name="tipo" id="tipo_checklist" required>
                            <option value="" disabled selected hidden>Selecione o tipo</option>
                            <option value="inicio">Início</option>
                            <option value="fim">Fim</option>
                        </select>

                        <div id="perguntas_container">
                            <div class="question-row">
                                <div style="flex:1">
                                    <textarea name="pergunta[]" placeholder="Digite a primeira pergunta" required></textarea>
                                </div>
                                <div style="width:160px; margin-left:10px">
                                    <label style="display:block; font-size:11px; margin-bottom:6px;">Tipo</label>
                                    <select name="tipo_resposta[]" onchange="onTipoChange(this)">
                                        <option value="text">Text</option>
                                        <option value="radio">Radio (Sim/Não)</option>
                                    </select>
                                </div>
                                <div style="width:180px; margin-left:10px">
                                    <label style="display:block; font-size:11px; margin-bottom:6px;">Bloqueia se (opcional)</label>
                                    <input type="text" name="bloqueia_abertura[]" placeholder="Vazio = nunca bloqueia" />
                                </div>
                                <button type="button" class="remove-pergunta" onclick="removerPergunta(this)" title="Remover pergunta">&times;</button>
                            </div>
                        </div>

                        <button type="button" class="btn btn-sm btn-outline-light mb-3" onclick="adicionarPergunta()">
                            <i class="fa-solid fa-plus"></i> Adicionar pergunta
                        </button>

                        <button type="submit" class="btn-submit">Salvar Checklist</button>

                        <?= form_close() ?>
                    </div>
                </div>
            </div>
        </div>
        <?php $this->load->view('components/Chatbot'); ?>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
        <div class="modal fade" id="modalPerguntas" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content eletrotech-modal">
                    <div class="modal-header">
                        <h5 class="modal-title">Perguntas do Checklist</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4" id="modalPerguntasBody">
                        <p class="text-center">Carregando...</p>
                    </div>
                </div>
            </div>
        </div>
        <script>
            function adicionarPergunta() {
                const container = document.getElementById('perguntas_container');
                const linha = document.createElement('div');
                linha.className = 'question-row';
                linha.innerHTML = `
                <div style="flex:1">
                    <textarea name="pergunta[]" placeholder="Digite a pergunta" required></textarea>
                </div>
                <div style="width:160px; margin-left:10px">
                    <label style="display:block; font-size:11px; margin-bottom:6px;">Tipo</label>
                    <select name="tipo_resposta[]" onchange="onTipoChange(this)">
                        <option value="text">Text</option>
                        <option value="radio">Radio (Sim/Não)</option>
                    </select>
                </div>
                <div style="width:180px; margin-left:10px">
                    <label style="display:block; font-size:11px; margin-bottom:6px;">Bloqueia se (opcional)</label>
                    <input type="text" name="bloqueia_abertura[]" placeholder="Vazio = nunca bloqueia" />
                </div>
                <button type="button" class="remove-pergunta" onclick="removerPergunta(this)" title="Remover pergunta">&times;</button>
            `;
                container.appendChild(linha);
            }

            function onTipoChange(selectEl) {
                const tipo = selectEl.value;
                const row = selectEl.closest('.question-row');
                const bloqueioInput = row.querySelector('input[name="bloqueia_abertura[]"]');
                if (!bloqueioInput) return;
                if (tipo === 'radio') {
                    bloqueioInput.placeholder = 'sim ou nao (vazio = nunca bloqueia)';
                } else {
                    bloqueioInput.placeholder = 'Resposta que bloqueia (vazio = nunca bloqueia)';
                }
            }

            function removerPergunta(button) {
                const container = document.getElementById('perguntas_container');
                if (container.querySelectorAll('.question-row').length > 1) {
                    button.closest('.question-row').remove();
                }
            }

            function fetchPerguntas(id) {
                const container = document.getElementById('modalPerguntasBody');
                container.innerHTML = '<p class="text-center">Carregando...</p>';
                fetch('<?= site_url('checklist/perguntas') ?>/' + id)
                    .then(response => response.text())
                    .then(html => {
                        container.innerHTML = html;
                        const modalEl = document.getElementById('modalPerguntas');
                        const modal = new bootstrap.Modal(modalEl);
                        modal.show();
                    })
                    .catch(() => {
                        container.innerHTML = '<p class="text-center text-danger">Erro ao carregar perguntas.</p>';
                    });
            }
        </script>
</body>

</html>