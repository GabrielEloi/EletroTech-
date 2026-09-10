<?php

/** @var array $totais */
/** @var string $usuario */
/** @var string $mesFiltro */
/** @var array $graficoEletricista */
/** @var array $graficoMes */
/** @var array $graficoStatus */
/** @var array $graficoMovimentacao */
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <title>Menu Principal - EletroTech</title>
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
            <p>Bem-vindo(a) ao painel de controle da EletroTech Soluções Elétricas.</p>
        </div>

        <div class="row g-4">
            <div class="col-md-6 col-lg-3">
                <div class="dashboard-card">
                    <i class="fa-solid fa-users icon-metric"></i>
                    <div class="metric-value"><?= $totais['eletricistas'] ?></div>
                    <div class="metric-label">Eletricistas Ativos</div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="dashboard-card">
                    <i class="fa-solid fa-box-open icon-metric"></i>
                    <div class="metric-value"><?= $totais['produtos'] ?></div>
                    <div class="metric-label">Produtos Cadastrados</div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="dashboard-card">
                    <i class="fa-solid fa-clipboard-list icon-metric"></i>
                    <div class="metric-value"><?= $totais['os'] ?></div>
                    <div class="metric-label">OS Realizadas</div>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="dashboard-card">
                    <i class="fa-solid fa-chart-line icon-metric"></i>
                    <div class="metric-value">R$ <?= number_format($totais['metas'], 2, ',', '.') ?></div>
                    <div class="metric-label">Metas Atingidas</div>
                </div>
            </div>
        </div>

        <div class="row g-4 mt-1">
            <div class="col-lg-6">
                <div class="chart-panel">
                    <h3>OS por eletricista</h3>
                    <canvas id="graficoOsEletricista"></canvas>
                </div>
            </div>

            <div class="col-lg-6">
                <div class="chart-panel">
                    <h3>Quantidade de OS por mês</h3>
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

            <div class="col-lg-6">
                <div class="chart-panel">
                    <h3>OS por status</h3>
                    <canvas id="graficoOsStatus"></canvas>
                </div>
            </div>

            <div class="col-lg-6">
                <div class="chart-panel">
                    <h3>Movimentação de estoque por mês (R$)</h3>
                    <canvas id="graficoMovimentacao"></canvas>
                </div>
            </div>
        </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="liveToast" class="toast align-items-center text-white border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body" id="toast-message"></div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
    <script>
        const osEletricista = <?= json_encode($graficoEletricista) ?>;
        const osMes = <?= json_encode($graficoMes) ?>;
        const osStatus = <?= json_encode($graficoStatus) ?>;
        const movimentacao = <?= json_encode($graficoMovimentacao) ?>;

        const labelsEletricista = osEletricista.map(item => item.eletricista || 'Sem nome');
        const valoresEletricista = osEletricista.map(item => Number(item.total || 0));

        const labelsMes = osMes.map(item => {
            const [ano, mes] = String(item.mes || '').split('-');
            if (!ano || !mes) return item.mes || 'Sem mês';
            return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString('pt-BR', {
                month: 'short',
                year: 'numeric'
            });
        });
        const valoresMes = osMes.map(item => Number(item.total || 0));

        new Chart(document.getElementById('graficoOsEletricista'), {
            type: 'bar',
            data: {
                labels: labelsEletricista,
                datasets: [{
                    label: 'Quantidade de OS',
                    data: valoresEletricista,
                    backgroundColor: ['#FBD814', '#ffcc00', '#f9d65e', '#f6d24b', '#f8a81e', '#e4b101'],
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
                    legend: { labels: { color: '#ffffff' } }
                },
                scales: {
                    x: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255,255,255,0.08)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255,255,255,0.08)' }
                    }
                }
            }
        });

        new Chart(document.getElementById('graficoOsStatus'), {
            type: 'doughnut',
            data: {
                labels: ['Solicitadas', 'Abertas', 'Fechadas'],
                datasets: [{
                    label: 'Ordens de Serviço',
                    data: [Number(osStatus.solicitada || 0), Number(osStatus.aberta || 0), Number(osStatus.fechada || 0)],
                    backgroundColor: ['#FBD814', '#f8a81e', '#4ade80'],
                    borderColor: '#282828',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        },
                        position: 'bottom'
                    }
                }
            }
        });

        const labelsMov = movimentacao.map(item => {
            const [ano, mes] = String(item.mes || '').split('-');
            if (!ano || !mes) return item.mes || 'Sem mês';
            return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString('pt-BR', {
                month: 'short',
                year: 'numeric'
            });
        });

        new Chart(document.getElementById('graficoMovimentacao'), {
            type: 'bar',
            data: {
                labels: labelsMov,
                datasets: [{
                        label: 'Entradas',
                        data: movimentacao.map(item => Number(item.entrada || 0)),
                        backgroundColor: '#4ade80'
                    },
                    {
                        label: 'Saídas',
                        data: movimentacao.map(item => Number(item.saida || 0)),
                        backgroundColor: '#f87171'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => ctx.dataset.label + ': R$ ' + Number(ctx.raw).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2
                            })
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
                            color: '#ffffff',
                            callback: valor => 'R$ ' + Number(valor).toLocaleString('pt-BR')
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.08)'
                        }
                    }
                }
            }
        });

        function showToast(mensagem, tipo) {
            const toastElement = document.getElementById('liveToast');
            const toastBody = document.getElementById('toast-message');

            toastElement.className = 'toast align-items-center text-white border-0 ' + (tipo === 'erro' ? 'bg-danger' : 'bg-success');
            toastBody.textContent = mensagem;

            const toast = new bootstrap.Toast(toastElement);
            toast.show();
        }
    </script>
    <?php if ($sucesso = $this->session->flashdata('sucesso')): ?>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                showToast("<?= $sucesso ?>", 'sucesso');
            });
        </script>
    <?php endif; ?>

    <?php if ($erro = $this->session->flashdata('erro')): ?>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                showToast("<?= $erro ?>", 'erro');
            });
        </script>
    <?php endif; ?>

    <?php $this->load->view('components/Chatbot'); ?>
</body>

</html>