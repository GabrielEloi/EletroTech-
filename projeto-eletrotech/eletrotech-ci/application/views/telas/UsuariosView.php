<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Usuários - EletroTech</title>
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

        .badge-perfil-admin {
            background-color: #FBD814;
            color: #282828;
            font-weight: bold;
        }

        .badge-perfil-padrao {
            background-color: #555;
            color: #eee;
        }

        .texto-vazio {
            color: #888;
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

        form.eletrotech-form label.campo {
            color: #ccc;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        form.eletrotech-form input[type="text"],
        form.eletrotech-form input[type="password"],
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

        form.eletrotech-form select option {
            background: #282828;
            color: white;
        }

        form.eletrotech-form input:focus,
        form.eletrotech-form select:focus {
            border-bottom: 2px solid #FBD814;
        }

        .switch-admin {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
        }

        .switch-admin input {
            width: 18px;
            height: 18px;
            accent-color: #FBD814;
        }

        .switch-admin label {
            margin: 0;
            font-size: 13px;
            color: #eee;
            text-transform: none;
            font-weight: 500;
        }

        .permissoes-bloco {
            border: 1px solid rgba(251, 216, 20, 0.25);
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 18px;
        }

        .permissoes-bloco .titulo {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #FBD814;
            margin-bottom: 10px;
        }

        .permissoes-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 14px;
        }

        .permissoes-grid .perm-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .permissoes-grid input {
            width: 16px;
            height: 16px;
            accent-color: #FBD814;
        }

        .permissoes-grid label {
            margin: 0;
            font-size: 13px;
            color: #eee;
            text-transform: none;
            font-weight: 500;
        }

        .permissoes-bloco.desativado {
            opacity: 0.45;
            pointer-events: none;
        }

        .permissoes-aviso {
            font-size: 12px;
            color: #FBD814;
            margin-bottom: 18px;
            display: none;
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
    <?php $this->load->view('components/Navbar', array('ativo' => 'usuarios')); ?>

    <div class="container mt-3">
        <?php if ($erro = $this->session->flashdata('erro')): ?>
            <div class="alert alert-danger text-center"><?= $erro ?></div>
        <?php endif; ?>
        <?php if ($sucesso = $this->session->flashdata('sucesso')): ?>
            <div class="alert alert-success text-center"><?= $sucesso ?></div>
        <?php endif; ?>
    </div>

    <div id="acoes_id">
        <button type="button" data-bs-toggle="modal" data-bs-target="#modalCriarUsuario">
            <i class="fa-solid fa-plus"></i> Novo Usuário
        </button>
    </div>

    <div class="container mt-2">
        <table class="table table-dark table-hover table-bordered custom-table text-center">
            <thead>
                <tr>
                    <th scope="col" style="width: 20%;">Ações</th>
                    <th scope="col" style="width: 45%;">Nome de Usuário</th>
                    <th scope="col" style="width: 25%;">Perfil</th>
                    <th scope="col" style="width: 10%;">ID</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($usuarios)): ?>
                    <?php foreach ($usuarios as $usuario): ?>
                        <tr>
                            <td>
                                <button type="button"
                                    class="btn btn-sm btn-outline-warning"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalEditarUsuario"
                                    data-id="<?= $usuario->id ?>"
                                    data-nome="<?= htmlspecialchars($usuario->usuario) ?>"
                                    data-is-admin="<?= (int) $usuario->is_admin ?>"
                                    data-eletricista-id="<?= $usuario->eletricista_id !== null ? (int) $usuario->eletricista_id : '' ?>"
                                    data-permissoes="<?= htmlspecialchars(implode(',', $usuario->permissoes)) ?>"
                                    onclick="preencherModalEditarUsuario(this)">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <a href="<?= site_url('usuarios/excluir/' . $usuario->id) ?>"
                                    class="btn btn-sm btn-outline-danger"
                                    onclick="return confirm('Tem certeza que deseja excluir este usuário?');">
                                    <i class="fa-solid fa-trash"></i>
                                </a>
                            </td>
                            <td>
                                <?php if (!empty($usuario->eletricista_nome)): ?>
                                    <?= htmlspecialchars($usuario->eletricista_nome) ?>
                                    <div class="texto-vazio" style="font-size: 12px;">
                                        login: <?= htmlspecialchars($usuario->usuario) ?>
                                    </div>
                                <?php else: ?>
                                    <?= htmlspecialchars($usuario->usuario) ?>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ((int) $usuario->is_admin === 1): ?>
                                    <span class="badge badge-perfil-admin">Administrador</span>
                                <?php elseif ($usuario->eletricista_id !== null): ?>
                                    <span class="badge badge-perfil-padrao">Eletricista</span>
                                <?php else: ?>
                                    <span class="badge badge-perfil-padrao">Padrão</span>
                                <?php endif; ?>
                            </td>
                            <td><?= htmlspecialchars($usuario->id) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="4" class="empty-state">Nenhum usuário cadastrado no momento.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>

        <?php $this->load->view('components/Pagination'); ?>
    </div>

    <!-- Modal: criar usuário -->
    <div class="modal fade" id="modalCriarUsuario" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Novo Usuário</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <form action="<?= site_url('usuarios/criar') ?>" method="POST" class="eletrotech-form">
                        <label class="campo" for="criar_usuario">Nome de Usuário</label>
                        <input type="text" name="usuario" id="criar_usuario" required>

                        <label class="campo" for="criar_senha">Senha (mín. 8 caracteres)</label>
                        <input type="password" name="senha" id="criar_senha" minlength="8" required>

                        <div class="permissoes-aviso" style="display:block;">
                            Contas de eletricista são criadas na tela de Eletricistas.
                        </div>

                        <div class="switch-admin">
                            <input type="checkbox" name="is_admin" id="criar_is_admin" value="1" onchange="togglePermissoes('criar')">
                            <label for="criar_is_admin">Administrador (acesso total)</label>
                        </div>

                        <div class="permissoes-aviso" id="criar_aviso">Administrador já tem acesso a tudo.</div>

                        <div class="permissoes-bloco" id="criar_permissoes_bloco">
                            <div class="titulo">Módulos liberados</div>
                            <div class="permissoes-grid">
                                <?php foreach ($permissoesDisponiveis as $chave => $rotulo): ?>
                                    <div class="perm-item">
                                        <input type="checkbox" name="permissoes[]" value="<?= $chave ?>" id="criar_perm_<?= $chave ?>">
                                        <label for="criar_perm_<?= $chave ?>"><?= htmlspecialchars($rotulo) ?></label>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>

                        <button type="submit" class="btn-submit">Criar Usuário</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: editar usuário -->
    <div class="modal fade" id="modalEditarUsuario" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content eletrotech-modal">
                <div class="modal-header">
                    <h5 class="modal-title">Editar Usuário</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <form action="<?= site_url('usuarios/editar') ?>" method="POST" class="eletrotech-form">
                        <input type="hidden" name="id" id="edit_usuario_id">

                        <label class="campo" for="edit_nome_usuario">Nome de Usuário</label>
                        <input type="text" name="usuario" id="edit_nome_usuario" required>

                        <label class="campo" for="edit_senha">Nova senha (deixe em branco para manter)</label>
                        <input type="password" name="senha" id="edit_senha" minlength="8" autocomplete="new-password">

                        <div class="permissoes-aviso" id="edit_aviso_eletricista" style="display:none;">
                            Conta de eletricista — o login é o CPF e não pode virar administrador.
                        </div>

                        <div class="switch-admin">
                            <input type="checkbox" name="is_admin" id="edit_is_admin" value="1" onchange="togglePermissoes('edit')">
                            <label for="edit_is_admin">Administrador (acesso total)</label>
                        </div>

                        <div class="permissoes-aviso" id="edit_aviso">Administrador tem acesso a tudo.</div>

                        <div class="permissoes-bloco" id="edit_permissoes_bloco">
                            <div class="titulo">Módulos liberados</div>
                            <div class="permissoes-grid">
                                <?php foreach ($permissoesDisponiveis as $chave => $rotulo): ?>
                                    <div class="perm-item">
                                        <input type="checkbox" name="permissoes[]" value="<?= $chave ?>" id="edit_perm_<?= $chave ?>">
                                        <label for="edit_perm_<?= $chave ?>"><?= htmlspecialchars($rotulo) ?></label>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>

                        <button type="submit" class="btn-submit">Gravar Alterações</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const permissoesAnteriores = {
            criar: null,
            edit: null
        };

        const checksDoBloco = (prefixo) =>
            document.querySelectorAll('#' + prefixo + '_permissoes_bloco input[type="checkbox"]');

        const togglePermissoes = (prefixo) => {
            const admin = document.getElementById(prefixo + '_is_admin').checked;
            const checks = checksDoBloco(prefixo);

            if (admin) {
                permissoesAnteriores[prefixo] = Array.from(checks)
                    .filter((cb) => cb.checked)
                    .map((cb) => cb.value);

                checks.forEach((cb) => {
                    cb.checked = true;
                });
            } else if (permissoesAnteriores[prefixo] !== null) {
                const anteriores = permissoesAnteriores[prefixo];

                if (anteriores.length > 0) {
                    checks.forEach((cb) => {
                        cb.checked = anteriores.includes(cb.value);
                    });
                }

                permissoesAnteriores[prefixo] = null;
            }

            document.getElementById(prefixo + '_permissoes_bloco').classList.toggle('desativado', admin);
            document.getElementById(prefixo + '_aviso').style.display = admin ? 'block' : 'none';
        };

        const preencherModalEditarUsuario = (botao) => {
            const id = botao.getAttribute('data-id');
            const nome = botao.getAttribute('data-nome');
            const isAdmin = botao.getAttribute('data-is-admin') === '1';
            const eletrId = botao.getAttribute('data-eletricista-id') || '';
            const permCsv = botao.getAttribute('data-permissoes') || '';
            const permitidas = permCsv ? permCsv.split(',') : [];

            const ehEletricista = eletrId !== '';

            permissoesAnteriores.edit = null;

            document.getElementById('edit_usuario_id').value = id;
            document.getElementById('edit_nome_usuario').value = nome;
            document.getElementById('edit_senha').value = '';
            document.getElementById('edit_is_admin').checked = isAdmin;

            document.getElementById('edit_is_admin').disabled = ehEletricista;
            document.getElementById('edit_nome_usuario').readOnly = ehEletricista;
            document.getElementById('edit_aviso_eletricista').style.display = ehEletricista ? 'block' : 'none';

            document
                .querySelectorAll('#edit_permissoes_bloco input[type="checkbox"]')
                .forEach((cb) => {
                    cb.checked = permitidas.includes(cb.value);
                });

            togglePermissoes('edit');
        };
    </script>
</body>

</html>