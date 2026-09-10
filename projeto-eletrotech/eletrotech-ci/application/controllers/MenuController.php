<?php
defined('BASEPATH') or exit('No direct script access allowed');

class MenuController extends Auth_Controller
{
    public function __construct()
    {
        parent::__construct();

        if (!$this->ehAdmin && !$this->eletricistaId) {
            $this->exigirPermissao('menu');
        }
    }

    public function index()
    {
        $this->load->model('DashboardModel', 'dashboard');

        $mesFiltro = $this->input->get('mes', TRUE);
        $filtrarPorEletricista = (!$this->ehAdmin && $this->eletricistaId) ? (int) $this->eletricistaId : null;

        $dados = array(
            'totais'             => $this->dashboard->contarTotais($filtrarPorEletricista),
            'usuario'            => $this->session->userdata('nome_exibicao') ?: $this->session->userdata('usuario'),
            'mesFiltro'          => $mesFiltro ?? '',
            'graficoEletricista' => $this->dashboard->getOsPorEletricista($filtrarPorEletricista),
            'graficoMes'         => $this->dashboard->getOsPorMes($mesFiltro, $filtrarPorEletricista),
            'graficoStatus'      => $this->dashboard->getOsPorStatus($filtrarPorEletricista),
            'graficoMovimentacao' => $this->dashboard->getMovimentacaoPorMes($filtrarPorEletricista),
        );

        if (!$this->ehAdmin && $this->eletricistaId) {
            $dados['eletricistaDashboard'] = array(
                'totalOs' => (int) ($dados['totais']['os'] ?? 0),
                'produtosUtilizados' => $this->dashboard->contarProdutosUtilizados($filtrarPorEletricista),
                'metaAtual' => $this->dashboard->getMetaAtual($filtrarPorEletricista),
            );

            $this->load->view('telas/DashboardEletricista', $dados);
            return;
        }

        $this->load->view('telas/MenuView', $dados);
    }

}
