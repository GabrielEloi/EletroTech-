<?php
defined('BASEPATH') or exit('No direct script access allowed');

class LancamentosController extends Auth_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->exigirAdmin();
        $this->load->model('BaixasModel');
        $this->load->model('EletricistasModel');
    }

    public function index()
    {
        $data = array(
            'titulo'   => 'Baixas de Estoque - EletroTech',
            'produtos' => $this->BaixasModel->produtos_para_lancamento(),
            'eletricistas' => $this->EletricistasModel->listar_para_vinculo(),
            'aba'      => $this->session->flashdata('aba') ?: 'entrada',
            'valores'  => $this->session->flashdata('valores') ?: array(),
        );

        $data['abas'] = array();

        foreach (array('entrada', 'saida') as $tipo) {
            $rascunho = $this->BaixasModel->rascunho_aberto($this->session->userdata('user_id'), $tipo);

            $data['abas'][$tipo] = array(
                'rascunho' => $rascunho,
                'itens'    => empty($rascunho) ? array() : $this->BaixasModel->itens_da_baixa($rascunho['id']),
            );
        }

        $this->load->view('telas/LancamentosView', $data);
    }

    public function abrir()
    {
        $tipo = $this->input->post('tipo', TRUE);

        if (!in_array($tipo, array('entrada', 'saida'), true)) {
            show_404();
            return;
        }

        $this->form_validation->set_rules('data_baixa', 'Data da baixa', 'required');
        $this->form_validation->set_rules('id_eletricista', 'Solicitante', 'required|integer|greater_than[0]');
        $this->form_validation->set_rules('observacao', 'Observação', 'max_length[500]');

        if ($this->form_validation->run() === FALSE) {
            $this->voltarComErro($tipo, validation_errors());
            return;
        }

        $dataBaixa = $this->input->post('data_baixa', TRUE);

        if (!$this->dataEhValida($dataBaixa)) {
            $this->voltarComErro($tipo, 'Informe uma data de baixa válida e que não seja futura.');
            return;
        }


        $eletricista = $this->EletricistasModel->get_by_id($this->input->post('id_eletricista', TRUE));

        if (empty($eletricista) || !empty($eletricista['data_demissao'])) {
            $this->voltarComErro($tipo, 'Selecione um eletricista ativo como solicitante.');
            return;
        }


        if ($this->BaixasModel->rascunho_aberto($this->session->userdata('user_id'), $tipo)) {
            $this->voltarComErro($tipo, 'Você já tem uma baixa em aberto desse tipo. Finalize ou cancele antes de abrir outra.');
            return;
        }

        $idBaixa = $this->BaixasModel->abrir_baixa(array(
            'tipo'           => $tipo,
            'data_baixa'     => $dataBaixa,
            'id_eletricista' => $eletricista['id'],
            'observacao'     => $this->input->post('observacao', TRUE),
            'id_usuario'     => $this->session->userdata('user_id'),
        ));

        if ($idBaixa === false) {
            $this->voltarComErro($tipo, 'Erro ao abrir a baixa. Tente novamente.');
            return;
        }

        $this->session->set_flashdata('sucesso', sprintf(
            'Baixa #%s aberta. Inclua os materiais e clique em Finalizar.',
            str_pad($idBaixa, 5, '0', STR_PAD_LEFT)
        ));
        $this->session->set_flashdata('aba', $tipo);

        redirect('lancamentos');
    }

    public function incluir_item()
    {
        $baixa = $this->rascunhoDoUsuario($this->input->post('id_baixa', TRUE));

        if (empty($baixa)) {
            show_404();
            return;
        }

        $this->form_validation->set_rules('id_produto', 'Produto', 'required|integer|greater_than[0]');
        $this->form_validation->set_rules('quantidade', 'Quantidade', 'required|integer|greater_than[0]');
        $this->form_validation->set_rules('valor_unitario', 'Valor unitário', 'required|numeric|greater_than_equal_to[0]');

        if ($this->form_validation->run() === FALSE) {
            $this->voltarComErro($baixa['tipo'], validation_errors());
            return;
        }

        $produto = $this->BaixasModel->produto_por_id($this->input->post('id_produto', TRUE));

        if (empty($produto)) {
            $this->voltarComErro($baixa['tipo'], 'Produto não encontrado.');
            return;
        }

        $quantidade = (int) $this->input->post('quantidade', TRUE);

        $incluiu = $this->BaixasModel->incluir_item($baixa['id'], array(
            'id_produto'     => $produto['id'],
            'quantidade'     => $quantidade,
            'valor_unitario' => $this->input->post('valor_unitario', TRUE),
        ));

        if (!$incluiu) {
            $this->voltarComErro($baixa['tipo'], 'Erro ao incluir o material.');
            return;
        }

        $this->session->set_flashdata('sucesso', sprintf(
            '%d un. de %s incluídas na baixa.',
            $quantidade,
            $produto['nome_produto']
        ));
        $this->session->set_flashdata('aba', $baixa['tipo']);

        redirect('lancamentos');
    }

    public function remover_item()
    {
        $baixa = $this->rascunhoDoUsuario($this->input->post('id_baixa', TRUE));

        if (empty($baixa)) {
            show_404();
            return;
        }

        $removeu = $this->BaixasModel->remover_item($baixa['id'], $this->input->post('id_item', TRUE));

        $this->session->set_flashdata($removeu ? 'sucesso' : 'erro', $removeu
            ? 'Material retirado da baixa.'
            : 'Não foi possível retirar esse material.');
        $this->session->set_flashdata('aba', $baixa['tipo']);

        redirect('lancamentos');
    }

    public function finalizar()
    {
        $baixa = $this->rascunhoDoUsuario($this->input->post('id_baixa', TRUE));

        if (empty($baixa)) {
            show_404();
            return;
        }

        $retorno = $this->BaixasModel->finalizar_baixa($baixa['id'], $this->session->userdata('user_id'));

        if ($retorno['resultado'] === BaixasModel::RESULTADO_SEM_ITENS) {
            $this->voltarComErro($baixa['tipo'], 'Inclua pelo menos um material antes de finalizar a baixa.');
            return;
        }

        if ($retorno['resultado'] === BaixasModel::RESULTADO_SEM_SALDO) {
            $this->voltarComErro($baixa['tipo'], sprintf(
                'Estoque insuficiente de %s. Nenhum material foi baixado — ajuste a quantidade e finalize de novo.',
                $retorno['produto']
            ));
            return;
        }

        if ($retorno['resultado'] !== BaixasModel::RESULTADO_OK) {
            $this->voltarComErro($baixa['tipo'], 'Erro ao finalizar a baixa. Tente novamente.');
            return;
        }

        redirect('lancamentos/relatorio/' . $baixa['id']);
    }

    public function cancelar()
    {
        $baixa = $this->rascunhoDoUsuario($this->input->post('id_baixa', TRUE));

        if (empty($baixa)) {
            show_404();
            return;
        }

        $cancelou = $this->BaixasModel->cancelar_baixa($baixa['id']);

        $this->session->set_flashdata($cancelou ? 'sucesso' : 'erro', $cancelou
            ? 'Baixa cancelada. O estoque não foi alterado.'
            : 'Não foi possível cancelar a baixa.');
        $this->session->set_flashdata('aba', $baixa['tipo']);

        redirect('lancamentos');
    }

    public function relatorio($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            show_404();
            return;
        }

        $baixa = $this->BaixasModel->baixa_por_id($id);

        if (empty($baixa) || $baixa['status'] !== 'finalizada') {
            show_404();
            return;
        }

        $this->load->view('telas/LancamentoRelatorioView', array(
            'titulo'        => 'Relatório da Baixa - EletroTech',
            'baixa'         => $baixa,
            'movimentacoes' => $this->BaixasModel->movimentacoes_da_baixa($baixa['id']),
        ));
    }


    private function rascunhoDoUsuario($idBaixa)
    {
        if (empty($idBaixa) || !is_numeric($idBaixa)) {
            return null;
        }

        $baixa = $this->BaixasModel->baixa_por_id($idBaixa);

        if (empty($baixa) || $baixa['status'] !== 'rascunho') {
            return null;
        }

        if ((int) $baixa['id_usuario'] !== (int) $this->session->userdata('user_id')) {
            return null;
        }

        return $baixa;
    }

    private function voltarComErro($tipo, $mensagem)
    {
        $this->session->set_flashdata('erro', $mensagem);
        $this->session->set_flashdata('aba', $tipo);
        $this->session->set_flashdata('valores', $this->input->post(NULL, TRUE));

        redirect('lancamentos');
    }

    private function dataEhValida($data)
    {
        $partes = explode('-', (string) $data);

        if (count($partes) !== 3 || !checkdate((int) $partes[1], (int) $partes[2], (int) $partes[0])) {
            return false;
        }

        return $data <= date('Y-m-d');
    }
}
