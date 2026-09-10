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
            padding-bottom: 50px;
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

        #filtro-status-os .btn-filtro-os {
            background-color: transparent;
            color: #ffffff;
            border: 1px solid #FBD814;
            border-radius: 30px;
            padding: 8px 18px;
            font-weight: bold;
            font-size: 14px;
            transition: 0.3s;
        }

        #filtro-status-os .btn-filtro-os:hover {
            background-color: rgba(251, 216, 20, 0.15);
        }

        #filtro-status-os .btn-filtro-os.active {
            background-color: #ebca1e;
            color: #282828;
        }

        tr.linha-oculta-filtro {
            display: none !important;
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

        form.eletrotech-form label.required::after {
            content: ' *';
            color: #FBD814;
        }

        form.eletrotech-form label {
            color: #ccc;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
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

        .linha-produto {
            display: flex;
            gap: 10px;
            align-items: flex-end;
            margin-bottom: 10px;
        }

        .linha-produto select {
            flex-grow: 1;
            margin-bottom: 0;
        }

        .linha-produto input {
            width: 100px;
            margin-bottom: 0;
        }

        .btn-remover-linha {
            color: #dc3545;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            margin-bottom: 5px;
            transition: 0.2s;
        }

        .btn-remover-linha:hover {
            color: #ff4c5d;
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
    <?php $this->load->view('components/Navbar', array('ativo' => 'ordemServico')); ?>


    <div class="container mt-3">
        <?php if ($this->session->flashdata('erro')): ?>
            <div class="alert alert-danger text-center"><?= $this->session->flashdata('erro') ?></div>
        <?php endif; ?>
        <?php if ($this->session->flashdata('sucesso')): ?>
            <div class="alert alert-success text-center"><?= $this->session->flashdata('sucesso') ?></div>
        <?php endif; ?>
    </div>

    <?php if (!empty($podeSolicitar)): ?>
        <div id="acoes_id">
            <button data-bs-toggle="modal" data-bs-target="#modalNovaOS">
                <i class="fa-solid fa-plus"></i> Solicitar Nova OS
            </button>
        </div>
    <?php endif; ?>

    <div class="container mt-2">
        <div id="filtro-status-os" class="mb-3 d-flex justify-content-center gap-2" style="gap:10px;">
            <button type="button" class="btn-filtro-os active" data-filtro="todas">
                <i class="fa-solid fa-list"></i> Todas
            </button>
            <button type="button" class="btn-filtro-os" data-filtro="solicitada">
                 Solicitadas
            </button>
            <button type="button" class="btn-filtro-os" data-filtro="aberta">
                 Abertas
            </button>
            <button type="button" class="btn-filtro-os" data-filtro="bloqueada">
                 Bloqueadas
            </button>
            <button type="button" class="btn-filtro-os" data-filtro="fechada">
                Fechadas
            </button>
        </div>

        <table class="table table-dark table-hover table-bordered custom-table text-center">
            <thead>
                <tr>
                    <th scope="col" style="width: 16%;">Ações</th>
                    <th scope="col" style="width: 28%;">Eletricista Responsável</th>
                    <th scope="col" style="width: 15%;">Data da Operação</th>
                    <th scope="col" style="width: 15%;">Data de Fechamento</th>
                    <th scope="col" style="width: 12%;">Status</th>
                    <th scope="col" style="width: 14%;">ID OS</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($ordensServico)): ?>
                    <?php foreach ($ordensServico as $os): ?>
                        <tr data-status="<?= $os['status'] ?>">
                            <td>
                                <button class="btn btn-sm btn-outline-info mb-1" title="Ver Detalhes"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalDetalhesOS"
                                    onclick="carregarDetalhesOS(<?= $os['id'] ?>)">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                                <?php if ($os['status'] === 'solicitada'): ?>
                                    <button class="btn btn-sm btn-outline-warning" type="button" onclick="abrirModalAbertura(<?= $os['id'] ?>)">
                                        <i class="fa-solid fa-lock-open"></i> Abrir OS
                                    </button>
                                <?php elseif ($os['status'] === 'bloqueada'): ?>
                                    <button class="btn btn-sm btn-outline-danger" type="button" disabled>
                                        <i class="fa-solid fa-ban"></i> Bloqueada
                                    </button>
                                <?php elseif ($os['status'] === 'aberta'): ?>
                                    <button class="btn btn-sm btn-outline-success" type="button" onclick="abrirModalFechamento(<?= $os['id'] ?>)">
                                        <i class="fa-solid fa-check"></i> Fechar OS
                                    </button>
                                <?php else: ?>
                                    <button class="btn btn-sm btn-outline-secondary" type="button" disabled>
                                        <i class="fa-solid fa-lock"></i> Fechada
                                    </button>
                                <?php endif; ?>
                            </td>
                            <td><?= htmlspecialchars($os['nome_eletricista']) ?></td>
                            <td><?= !empty($os['data_os']) ? date('d/m/Y', strtotime($os['data_os'])) : '-' ?></td>
                            <td><?= !empty($os['data_fechamento']) ? date('d/m/Y', strtotime($os['data_fechamento'])) : '-' ?></td>
                            <td>
                                <?php if ($os['status'] === 'solicitada'): ?>
                                    <span class="badge bg-warning text-dark">Solicitada</span>
                                <?php elseif ($os['status'] === 'bloqueada'): ?>
                                    <span class="badge bg-danger">Bloqueada</span>
                                <?php elseif ($os['status'] === 'aberta'): ?>
                                    <span class="badge bg-success">Aberta</span>
                                <?php else: ?>
                                    <span class="badge bg-secondary">Fechada</span>
                                <?php endif; ?>
                            </td>
                            <td>#<?= str_pad($os['id'], 5, "0", STR_PAD_LEFT) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="6" class="empty-state">Nenhuma Ordem de Serviço registrada no momento.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>

        <?php $this->load->view('components/Pagination'); ?>
    </div>

    <?php if (!empty($podeSolicitar)): ?>
        <div class="modal fade" id="modalNovaOS" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content eletrotech-modal">
                    <div class="modal-header">
                        <h5 class="modal-title">Solicitar Ordem de Serviço</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <p class="mb-3" style="color:#FBD814; font-size:12px; font-weight:bold;">* campos obrigatórios</p>
                        <?= form_open('ordemServico/solicitar', ['class' => 'eletrotech-form', 'id' => 'formSolicitarOS']) ?>

                        <div class="row">
                            <div class="col-md-6">
                                <label for="eletricista_os" class="required">Eletricista Responsável</label>
                                <select name="eletricista_os" id="eletricista_os" required>
                                    <option value="" disabled selected hidden>Selecione (Apenas Ativos)</option>
                                    <?php foreach ($eletricistasAtivos as $eletricista): ?>
                                        <option value="<?= $eletricista['id'] ?>"><?= htmlspecialchars($eletricista['nome']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="data_os">Data da Operação</label>
                                <input type="date" name="data_os" id="data_os" max="<?= date('Y-m-d') ?>">
                                <small class="form-text text-muted">Opcional: deixe em branco se a OS ainda não tiver data de início.</small>
                            </div>
                        </div>

                        <div class="alert alert-warning mt-3 mb-0" style="font-size:13px;">
                            <i class="fa-solid fa-circle-info"></i> A OS nasce como <strong>Solicitada</strong>.
                            Os materiais e o checklist de início são informados pelo eletricista na abertura —
                            é nesse momento que o estoque é baixado.
                        </div>

                        <button type="submit" class="btn-submit">Solicitar OS</button>

                        <?= form_close() ?>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <div class="modal fade" id="modalAbrirOS" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Abrir Ordem de Serviço</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="mb-3" style="color:#FBD814; font-size:12px; font-weight:bold;">* campos obrigatórios</p>
                    <?= form_open('ordemServico/abrir', ['class' => 'eletrotech-form', 'id' => 'formAbrirOS', 'enctype' => 'multipart/form-data']) ?>
                    <input type="hidden" name="id_os" id="id_os_abertura" value="">

                    <h6 style="color: #FBD814; text-transform: uppercase; font-size: 14px; font-weight: bold; margin-bottom: 15px;">Materiais Utilizados na Operação</h6>

                    <div id="lista-materiais">
                        <div class="linha-produto">
                            <div>
                                <label>Produto</label>
                                <select name="id_produto[]" required>
                                    <option value="" disabled selected hidden>Selecione o material...</option>
                                    <?php if (!empty($produtosDisponiveis)): ?>
                                        <?php foreach ($produtosDisponiveis as $prod): ?>
                                            <option value="<?= $prod['id'] ?>" data-estoque="<?= $prod['qtd_estoque'] ?>"><?= htmlspecialchars($prod['nome_produto']) ?> (Estoque: <?= $prod['qtd_estoque'] ?>)</option>
                                        <?php endforeach; ?>
                                    <?php else: ?>
                                        <option value="" disabled>Nenhum material com estoque disponível</option>
                                    <?php endif; ?>
                                </select>
                            </div>
                            <div>
                                <label>Quantidade</label>
                                <input type="number" name="qtd_utilizada[]" min="1" placeholder="Ex: 5" required>
                            </div>
                        </div>
                    </div>

                    <button type="button" class="btn btn-sm btn-outline-warning mt-2 mb-3" onclick="adicionarMaterial()" style="border-radius: 20px; font-weight: bold;">
                        <i class="fa-solid fa-plus"></i> Adicionar Mais um Produto
                    </button>

                    <?php if (!empty($checklistInicio['perguntas'])): ?>
                        <div class="mt-4">
                            <h6 style="color: #FBD814; text-transform: uppercase; font-size: 14px; font-weight: bold; margin-bottom: 12px;">Checklist de Início</h6>
                            <?php foreach ($checklistInicio['perguntas'] as $pergunta): ?>
                                <label><?= htmlspecialchars($pergunta['texto_pergunta']) ?></label>
                                <?php if (($pergunta['tipo_resposta'] ?? '') === 'text'): ?>
                                    <input type="text" name="checklist_resposta[<?= $pergunta['id'] ?>]" placeholder="Digite a resposta" required>
                                <?php else: ?>
                                    <select name="checklist_resposta[<?= $pergunta['id'] ?>]" required>
                                        <option value="" disabled selected hidden>Selecione sim ou não</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                <?php endif; ?>
                            <?php endforeach; ?>
                            <input type="hidden" name="checklist_inicio_id" value="<?= $checklistInicio['id'] ?>">
                        </div>
                    <?php else: ?>
                        <div class="alert alert-warning text-center">Nenhum checklist de início selecionado. Acesse Checklist e escolha um checklist de início padrão para abrir uma OS.</div>
                    <?php endif; ?>

                    <div class="foto-os-campo mt-4">
                        <label>Foto da Abertura (opcional)</label>
                        <div>
                            <button type="button" class="btn btn-sm btn-outline-warning" style="border-radius:20px;font-weight:bold;"
                                onclick="this.parentElement.querySelector('.js-foto-input').click()">
                                <i class="fa-solid fa-camera"></i> Tirar / Anexar Foto
                            </button>
                            <span class="js-foto-nome" style="font-size:12px;color:#FBD814;margin-left:8px;"></span>
                            <input type="file" name="foto_abertura" accept="image/*" capture="environment" class="d-none js-foto-input">
                        </div>
                        <div class="js-foto-preview mt-2"></div>
                    </div>

                    <button type="submit" class="btn-submit" <?= empty($checklistInicio['perguntas']) ? 'disabled' : '' ?>>Abrir OS e Baixar Estoque</button>

                    <?= form_close() ?>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalDetalhesOS" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Materiais Utilizados</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <div id="conteudo-detalhes">
                        <p class="text-center">Carregando...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalFecharOS" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Checklist de Fechamento</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="mb-3" style="color:#FBD814; font-size:12px; font-weight:bold;">* campos obrigatórios</p>
                    <?= form_open('ordemServico/fechar', ['class' => 'eletrotech-form', 'id' => 'formFecharOS', 'enctype' => 'multipart/form-data']) ?>
                    <input type="hidden" name="id_os" id="id_os_fechamento" value="">

                    <?php if (!empty($checklistFim['perguntas'])): ?>
                        <p class="mb-3">Responda o checklist de fim para encerrar a OS.</p>
                        <?php foreach ($checklistFim['perguntas'] as $pergunta): ?>
                            <label><?= htmlspecialchars($pergunta['texto_pergunta']) ?></label>
                            <?php if (($pergunta['tipo_resposta'] ?? '') === 'text'): ?>
                                <input type="text" name="checklist_resposta[<?= $pergunta['id'] ?>]" placeholder="Digite a resposta" required>
                            <?php else: ?>
                                <select name="checklist_resposta[<?= $pergunta['id'] ?>]" required class="select-checklist-fim" data-pergunta="<?= $pergunta['id'] ?>" data-bloqueio="<?= htmlspecialchars($pergunta['bloqueia_normalizado'] ?? '') ?>">
                                    <option value="" disabled selected hidden>Selecione sim ou não</option>
                                    <option value="sim">Sim</option>
                                    <option value="nao">Não</option>
                                </select>
                                <?php if (!empty($pergunta['bloqueia_normalizado'])): ?>
                                    <div class="aviso-bloqueio" data-pergunta="<?= $pergunta['id'] ?>" style="display:none; color:#ff6b6b; font-size:12px; margin-top:6px;">
                                        <i class="fa-solid fa-triangle-exclamation"></i> Esta resposta impede o fechamento da OS.
                                    </div>
                                <?php endif; ?>
                            <?php endif; ?>
                        <?php endforeach; ?>

                        <div class="foto-os-campo mt-4">
                            <label>Foto do Fechamento (opcional)</label>
                            <div>
                                <button type="button" class="btn btn-sm btn-outline-warning" style="border-radius:20px;font-weight:bold;"
                                    onclick="this.parentElement.querySelector('.js-foto-input').click()">
                                    <i class="fa-solid fa-camera"></i> Tirar / Anexar Foto
                                </button>
                                <span class="js-foto-nome" style="font-size:12px;color:#FBD814;margin-left:8px;"></span>
                                <input type="file" name="foto_fechamento" accept="image/*" capture="environment" class="d-none js-foto-input">
                            </div>
                            <div class="js-foto-preview mt-2"></div>
                        </div>

                        <button type="submit" class="btn-submit">Fechar OS</button>
                    <?php else: ?>
                        <div class="alert alert-warning text-center">Nenhum checklist de fim selecionado. Defina um checklist de fim na tela de Checklist antes de fechar ordens.</div>
                        <button type="button" class="btn-submit" disabled>Fechar OS</button>
                    <?php endif; ?>
                    <?= form_close() ?>
                </div>
            </div>
        </div>
    </div>

    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const opcoesHtml = <?= json_encode(
                                !empty($produtosDisponiveis)
                                    ? implode('', array_map(function ($prod) {
                                        return '<option value="' . $prod['id'] . '" data-estoque="' . $prod['qtd_estoque'] . '">' . htmlspecialchars($prod['nome_produto'], ENT_QUOTES, 'UTF-8') . ' (Estoque: ' . $prod['qtd_estoque'] . ')</option>';
                                    }, $produtosDisponiveis))
                                    : '<option value="" disabled>Nenhum material com estoque disponível</option>'
                            ) ?>;

        function adicionarMaterial() {
            const container = document.getElementById('lista-materiais');
            const novaLinha = document.createElement('div');
            novaLinha.className = 'linha-produto';

            novaLinha.innerHTML = `
                <div>
                    <select name="id_produto[]" required>
                        <option value="" disabled selected hidden>Selecione o material...</option>
                        ${opcoesHtml}
                    </select>
                </div>
                <div>
                    <input type="number" name="qtd_utilizada[]" min="1" placeholder="Ex: 5" required>
                </div>
                <button type="button" class="btn-remover-linha" onclick="removerMaterial(this)" title="Remover Material">
                    <i class="fa-solid fa-circle-xmark"></i>
                </button>
            `;

            container.appendChild(novaLinha);
        }

        function removerMaterial(botao) {
            botao.parentElement.remove();
        }

        function carregarDetalhesOS(idOs) {
            const container = document.getElementById('conteudo-detalhes');
            container.innerHTML = '<p class="text-center">Carregando...</p>';

            fetch('<?= site_url('ordemServico/detalhes') ?>/' + idOs)
                .then(response => response.text())
                .then(html => {
                    container.innerHTML = html;
                });
        }

        function getEstoqueDisponivel(selectEl) {
            const opt = selectEl.options[selectEl.selectedIndex];
            return opt ? parseInt(opt.getAttribute('data-estoque') || '0', 10) : 0;
        }

        function validarLinha(linha) {
            const select = linha.querySelector('select[name="id_produto[]"]');
            const input = linha.querySelector('input[name="qtd_utilizada[]"]');
            if (!select || !input) return true;

            const estoque = getEstoqueDisponivel(select);
            input.max = estoque > 0 ? estoque : '';

            const valor = parseInt(input.value, 10);

            if (select.value && valor > estoque) {
                input.setCustomValidity(`Quantidade maior que o estoque disponível (${estoque}).`);
            } else {
                input.setCustomValidity('');
            }
            input.reportValidity();

            return !(select.value && valor > estoque);
        }

        function validarDuplicatas() {
            const selects = document.querySelectorAll('select[name="id_produto[]"]');
            const valores = {};
            let valido = true;

            selects.forEach(function(select) {
                const valor = select.value;
                if (!valor) {
                    select.setCustomValidity('');
                    return;
                }

                if (valores[valor]) {
                    select.setCustomValidity('Este produto já foi adicionado. Escolha outro item.');
                    valido = false;
                } else {
                    select.setCustomValidity('');
                    valores[valor] = true;
                }
                select.reportValidity();
            });

            return valido;
        }

        document.getElementById('lista-materiais').addEventListener('input', function(e) {
            if (e.target.matches('input[name="qtd_utilizada[]"]')) {
                validarLinha(e.target.closest('.linha-produto'));
            }
        });

        document.getElementById('lista-materiais').addEventListener('change', function(e) {
            if (e.target.matches('select[name="id_produto[]"]')) {
                validarLinha(e.target.closest('.linha-produto'));
                validarDuplicatas();
            }
        });

        document.getElementById('formAbrirOS').addEventListener('submit', function(e) {
            const linhas = document.querySelectorAll('#lista-materiais .linha-produto');
            let valido = validarDuplicatas();
            linhas.forEach(function(linha) {
                if (!validarLinha(linha)) valido = false;
            });
            if (!valido) {
                e.preventDefault();
            }
        });

        document.addEventListener('submit', function(event) {
            if (event.target.id !== 'formComentario') {
                return;
            }
            event.preventDefault();

            const form = event.target;
            const idOs = form.querySelector('input[name="id_os"]').value;
            const erroBox = document.getElementById('erroComentario');
            const btn = form.querySelector('button[type="submit"]');
            erroBox.textContent = '';
            btn.disabled = true;

            fetch('<?= site_url('ordemServico/adicionarComentario') ?>', {
                    method: 'POST',
                    body: new FormData(form)
                })
                .then(function(response) {
                    return response.json().then(function(dados) {
                        return {
                            ok: response.ok,
                            dados: dados
                        };
                    });
                })
                .then(function(res) {
                    if (res.ok && res.dados.sucesso) {
                        carregarDetalhesOS(idOs);
                    } else {
                        erroBox.textContent = res.dados.mensagem || 'Erro ao enviar comentário.';
                        btn.disabled = false;
                    }
                })
                .catch(function() {
                    erroBox.textContent = 'Erro de conexão ao enviar comentário.';
                    btn.disabled = false;
                });
        });

        function abrirModalAbertura(idOs) {
            document.getElementById('id_os_abertura').value = idOs;
            new bootstrap.Modal(document.getElementById('modalAbrirOS')).show();
        }

        function abrirModalFechamento(idOs) {
            const inputId = document.getElementById('id_os_fechamento');
            inputId.value = idOs;
            const modalElement = document.getElementById('modalFecharOS');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }

        function preverFoto(input, nomeSpan, previewDiv) {
            const arquivo = input.files && input.files[0];
            if (nomeSpan) nomeSpan.textContent = arquivo ? arquivo.name : '';
            if (previewDiv) {
                previewDiv.innerHTML = '';
                if (arquivo) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(arquivo);
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '200px';
                    img.style.borderRadius = '6px';
                    previewDiv.appendChild(img);
                }
            }
        }

        document.addEventListener('change', function(event) {
            if (event.target.classList && event.target.classList.contains('js-foto-input')) {
                const campo = event.target.closest('.foto-os-campo');
                if (campo) {
                    preverFoto(event.target, campo.querySelector('.js-foto-nome'), campo.querySelector('.js-foto-preview'));
                }
                return;
            }
            if (event.target.id === 'inputFotoComentario') {
                preverFoto(event.target, document.getElementById('nomeFotoComentario'), document.getElementById('previewFotoComentario'));
                return;
            }
            if (!event.target.matches('.select-checklist-fim')) {
                return;
            }
            const select = event.target;
            const perguntaId = select.dataset.pergunta;
            const bloqueio = select.dataset.bloqueio || '';
            const aviso = document.querySelector('.aviso-bloqueio[data-pergunta="' + perguntaId + '"]');
            if (!aviso) {
                return;
            }
            // Avisa na hora que a resposta configurada como bloqueio barra o fechamento,
            // em vez de deixar o eletricista descobrir só depois de enviar o formulário.
            aviso.style.display = (bloqueio !== '' && select.value === bloqueio) ? 'block' : 'none';
        });

        document.querySelectorAll('#filtro-status-os .btn-filtro-os').forEach(function(botao) {
            botao.addEventListener('click', function() {
                const filtro = botao.dataset.filtro;

                document.querySelectorAll('#filtro-status-os .btn-filtro-os').forEach(function(b) {
                    b.classList.remove('active');
                });
                botao.classList.add('active');

                const linhas = document.querySelectorAll('table.custom-table tbody tr[data-status]');

                if (linhas.length === 0) {
                    return;
                }

                let algumaVisivel = false;

                linhas.forEach(function(linha) {
                    const mostrar = filtro === 'todas' || linha.dataset.status === filtro;
                    linha.classList.toggle('linha-oculta-filtro', !mostrar);
                    if (mostrar) algumaVisivel = true;
                });

                let vazio = document.getElementById('linha-vazia-filtro');
                if (!algumaVisivel) {
                    if (!vazio) {
                        const tbody = document.querySelector('table.custom-table tbody');
                        vazio = document.createElement('tr');
                        vazio.id = 'linha-vazia-filtro';
                        vazio.innerHTML = '<td colspan="6" class="empty-state">Nenhuma Ordem de Serviço encontrada para este filtro.</td>';
                        tbody.appendChild(vazio);
                    }
                    vazio.style.display = '';
                } else if (vazio) {
                    vazio.style.display = 'none';
                }
            });
        });
    </script>

</body>

</html>