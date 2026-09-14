<?php /** @var string $usuario */ ?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Início - EletroTech</title>
    <style>
        body {
            background-color: #3c3b3b;
            color: white;
            font-family: 'DM Sans', sans-serif;
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

        .home-hero {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            min-height: calc(100vh - 110px);
            padding: 20px;
        }

        .home-hero img {
            max-width: 340px;
            width: 60%;
            margin-bottom: 25px;
            filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.45));
        }

        .home-hero h1 {
            font-weight: 700;
            font-size: 30px;
            margin: 0;
        }

        .home-hero p {
            color: #a0a0a0;
            font-size: 17px;
            margin-top: 10px;
        }

        .home-hero .btn-dashboard {
            margin-top: 30px;
            background-color: #FBD814;
            color: #282828;
            border: none;
            border-radius: 30px;
            padding: 12px 30px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: 0.3s;
        }

        .home-hero .btn-dashboard:hover {
            background-color: #ffffff;
        }
    </style>
</head>

<body>
    <?php $this->load->view('components/Navbar', array('ativo' => 'home')); ?>

    <div class="home-hero">
        <img src="<?= base_url('assets/logo-eletrotech.png') ?>" alt="Logo EletroTech">
        <h1>Bem-vindo, <?= htmlspecialchars($usuario ?? 'Usuário') ?>!</h1>
        <p>Sistema de gestão da EletroTech Soluções Elétricas.</p>
        <a href="<?= site_url($destino ?? 'menu') ?>">
            <button class="btn-dashboard">
                <i class="fa-solid fa-gauge-high"></i> Acessar <?= htmlspecialchars($rotuloDestino ?? 'Dashboard') ?>
            </button>
        </a>
    </div>

    <?php $this->load->view('components/Chatbot'); ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
