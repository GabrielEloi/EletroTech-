<?php

/** @var array $totais */
/** @var string $usuario */
/** @var string $mesFiltro */
/** @var array $graficoMes */
/** @var array $eletricistaDashboard */
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Dashboard Eletricista - EletroTech</title>
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

        .dashboard-header {
            margin-top: 3rem;
            margin-bottom: 2.5rem;
            border-left: 5px solid #FBD814;
            padding-left: 15px;
        }

        .dashboard-header h1 {
            font-weight: 700;
            font-size: 28px;
            margin: 0;
        }

        .dashboard-header p {
            color: #a0a0a0;
            margin: 5px 0 0 0;
            font-size: 16px;
        }

        .dashboard-card {
            background-color: #1f1f1f;
            border-radius: 12px;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 4px solid #FBD814;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            height: 100%;
        }

        .dashboard-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
            background-color: #242424;
        }

        .dashboard-card .icon-metric {
            font-size: 40px;
            color: #FBD814;
            margin-bottom: 15px;
        }

        .dashboard-card .metric-value {
            font-size: 36px;
            font-weight: 700;
            color: white;
            line-height: 1;
            margin-bottom: 5px;
        }

        .dashboard-card .metric-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #ccc;
            font-weight: 600;
        }

        .chart-panel {
            background-color: #1f1f1f;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #FBD814;
            margin-top: 2rem;
            height: 100%;
        }

        .chart-panel h3 {
            color: #FBD814;
            font-size: 1.1rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }

        .filtro-mes {
            background-color: #282828;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #FBD814;
            margin: 1rem 0 0.5rem 0;
            display: flex;
            align-items: end;
            gap: 15px;
            flex-wrap: wrap;
        }

        .filtro-mes label {
            color: #FBD814;
            font-size: 12px;
            font-weight: bold;
        }

        .filtro-mes input,
        .filtro-mes button {
            height: 40px;
        }
    </style>
</head>

<body>
    <?php $this->load->view('components/Navbar', array('ativo' => 'menu')); ?>

    <div class="container">
        <div class="dashboard-header">
            <h1>Olá, <?= htmlspecialchars($usuario ?? 'Usuário') ?>!</h1>
            <p>Resumo das suas ordens de serviço, produtividade e metas.</p>
        </div>

        <div class="row g-4">
            <div class="col-md-6 col-lg-3">
                <div class="dashboard-card">
                    <i class="fa-solid fa-clipboard-list icon-metric"></i>
                    <div class="metric-value"><?= (int) ($eletricistaDashboard['totalOs'] ?? 0) ?></div>
                    <div class="metric-label">OSs Realizadas</div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="dashboard-card">
                    <i class="fa-solid fa-box-open icon-metric"></i>
                    <div class="metric-value"><?= (int) ($eletricistaDashboard['produtosUtilizados'] ?? 0) ?></div>
                    <div class="metric-label">Produtos Utilizados</div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="dashboard-card">
                    <i class="fa-solid fa-bullseye icon-metric"></i>
                    <div class="metric-value">R$ <?= number_format((float) ($eletricistaDashboard['metaAtual'] ?? 0), 2, ',', '.') ?></div>
                    <div class="metric-label">Meta Atual</div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="dashboard-card">
                    <i class="fa-solid fa-chart-line icon-metric"></i>
                    <div class="metric-value"><?= count($graficoMes) ?></div>
                    <div class="metric-label">Meses com OS</div>
                </div>
            </div>
        </div>

        <div class="row g-4 mt-1">
            <div class="col-12">
                <div class="chart-panel">
                    <h3>Quantidade de OSs por mês</h3>
                    <form method="GET" action="<?= site_url('menu') ?>" class="filtro-mes">
                        <div style="flex-grow:1; min-width:220px;">
                            <label for="mes">Filtrar mês:</label>
                            <input type="month" name="mes" id="mes" class="form-control" value="<?= htmlspecialchars($mesFiltro) ?>">
                        </div>
                        <div>
                            <button type="submit" class="btn btn-outline-warning">Buscar</button>
                            <a href="<?= site_url('menu') ?>" class="btn btn-outline-secondary">Limpar</a>
                        </div>
                    </form>
                    <canvas id="graficoOsMes" class="mt-3"></canvas>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
    <script>
        const osMes = <?= json_encode($graficoMes) ?>;
        const labelsMes = osMes.map(item => {
            const [ano, mes] = String(item.mes || '').split('-');
            if (!ano || !mes) return item.mes || 'Sem mês';
            return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString('pt-BR', {
                month: 'short',
                year: 'numeric'
            });
        });
        const valoresMes = osMes.map(item => Number(item.total || 0));

        new Chart(document.getElementById('graficoOsMes'), {
            type: 'bar',
            data: {
                labels: labelsMes,
                datasets: [{
                    label: 'Quantidade de OS',
                    data: valoresMes,
                    backgroundColor: '#FBD814',
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.08)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.08)'
                        }
                    }
                }
            }
        });
    </script>
    <?php $this->load->view('components/Chatbot'); ?>
</body>

</html>