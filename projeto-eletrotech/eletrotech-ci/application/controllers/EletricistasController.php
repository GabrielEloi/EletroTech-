<?php
defined('BASEPATH') or exit('No direct script access allowed');

class EletricistasController extends Auth_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->exigirPermissao('eletricistas');
        $this->load->model('EletricistasModel');
    }

    public function index()
    {
        $data['titulo'] = 'Eletricistas - EletroTech';

        $total = $this->EletricistasModel->contar();
        $data  = array_merge($data, $this->paginar($total, site_url('eletricistas')));

        $data['eletricistas'] = $this->EletricistasModel->get_all($data['por_pagina'], $data['offset']);

        $this->load->view('telas/EletricistasView', $data);
    }

    public function cadastrar()
    {
        $this->form_validation->set_rules('cpf', 'CPF', 'required|exact_length[11]|numeric');
        $this->form_validation->set_rules('nome', 'Nome', 'required|min_length[3]');
        $this->form_validation->set_rules('data_contratacao', 'Data de Contratação', 'required');
        $this->form_validation->set_rules('senha', 'Senha de acesso', 'required|min_length[8]');

        if ($this->form_validation->run() === FALSE) {
            $this->session->set_flashdata('erro', validation_errors());
            redirect('eletricistas');
            return;
        }

        $cpf   = $this->input->post('cpf', TRUE);
        $senha = (string) $this->input->post('senha');

        if ($this->EletricistasModel->get_by_cpf($cpf)) {
            $this->session->set_flashdata('erro', 'Já existe um eletricista cadastrado com este CPF.');
            redirect('eletricistas');
            return;
        }


        if ($this->usuarios->usuarioExiste($cpf)) {
            $this->session->set_flashdata('erro', 'Já existe um usuário do sistema usando este CPF como login.');
            redirect('eletricistas');
            return;
        }

        $data = [
            'cpf' => $cpf,
            'nome' => $this->input->post('nome', TRUE),
            'data_contratacao' => $this->input->post('data_contratacao', TRUE),
            'data_demissao' => null,
        ];

        $this->db->trans_start();

        $this->EletricistasModel->insert($data);
        $idEletricista = (int) $this->db->insert_id();

        $idUsuario = $idEletricista > 0
            ? $this->usuarios->criarUsuario($cpf, $senha, 0, $idEletricista)
            : false;

        if ($idUsuario) {
            $this->usuarios->definirPermissoes($idUsuario, permissoes_padrao_eletricista());
        }

        $this->db->trans_complete();

        if (!$idUsuario || $this->db->trans_status() === FALSE) {
            $this->session->set_flashdata('erro', 'Erro ao cadastrar eletricista.');
            redirect('eletricistas');
            return;
        }

        $this->session->set_flashdata(
            'sucesso',
            'Eletricista cadastrado! O login dele é o CPF.'
        );
        redirect('eletricistas');
    }

    public function editar()
    {
        $id        = $this->input->post('id', TRUE);
        $nome      = $this->input->post('nome', TRUE);
        $novaSenha = (string) $this->input->post('senha');

        $this->form_validation->set_rules('id', 'ID', 'required|numeric');
        $this->form_validation->set_rules('nome', 'Nome', 'required|min_length[3]');

        if ($this->form_validation->run() === FALSE) {
            $this->session->set_flashdata('erro', validation_errors());
            redirect('eletricistas');
            return;
        }

        if ($novaSenha !== '' && strlen($novaSenha) < 8) {
            $this->session->set_flashdata('erro', 'A nova senha deve ter no mínimo 8 caracteres.');
            redirect('eletricistas');
            return;
        }

        $conta = $novaSenha !== '' ? $this->usuarios->buscarPorEletricista($id) : null;

        if ($novaSenha !== '' && !$conta) {
            $this->session->set_flashdata('erro', 'Este eletricista não tem conta de acesso, então não há senha para redefinir.');
            redirect('eletricistas');
            return;
        }

        $this->db->trans_start();

        $this->EletricistasModel->update($id, ['nome' => $nome]);

        if ($conta) {
            $this->usuarios->redefinirSenha($conta->id, $novaSenha);
        }

        $this->db->trans_complete();

        if ($this->db->trans_status() === FALSE) {
            $this->session->set_flashdata('erro', 'Erro ao atualizar eletricista.');
        } elseif ($conta) {
            $this->session->set_flashdata('sucesso', 'Dados atualizados e senha de acesso redefinida!');
        } else {
            $this->session->set_flashdata('sucesso', 'Dados atualizados com sucesso!');
        }

        redirect('eletricistas');
    }

    public function demitir($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            show_404();
            return;
        }

        if ($this->EletricistasModel->demitir($id)) {
            $this->session->set_flashdata('sucesso', 'Eletricista demitido com sucesso.');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao demitir eletricista.');
        }

        redirect('eletricistas');
    }

    public function reativar($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            show_404();
            return;
        }

        if ($this->EletricistasModel->reativar($id)) {
            $this->session->set_flashdata('sucesso', 'Eletricista readmitido com sucesso.');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao readmitir eletricista.');
        }

        redirect('eletricistas');
    }

    public function historico_os($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            echo '<p class="text-center text-danger">Eletricista inválido.</p>';
            return;
        }

        $historico = $this->EletricistasModel->get_os_by_eletricista((int) $id);

        if (empty($historico)) {
            echo '<p class="text-center">Nenhuma OS registrada para este eletricista.</p>';
            return;
        }

        echo '<div class="table-responsive">';
        echo '<table class="table table-dark table-bordered custom-table text-center">';
        echo '<thead><tr><th>ID</th><th>Data da OS</th><th>Status</th><th>Data de Fechamento</th></tr></thead>';
        echo '<tbody>';

        foreach ($historico as $os) {
            $dataOs = !empty($os['data_os']) ? date('d/m/Y', strtotime($os['data_os'])) : '-';
            $dataFechamento = !empty($os['data_fechamento']) ? date('d/m/Y', strtotime($os['data_fechamento'])) : '-';
            $status = ucfirst($os['status'] ?? '');

            echo '<tr>';
            echo '<td>#' . str_pad((int) $os['id'], 5, '0', STR_PAD_LEFT) . '</td>';
            echo '<td>' . htmlspecialchars($dataOs) . '</td>';
            echo '<td>' . htmlspecialchars($status) . '</td>';
            echo '<td>' . htmlspecialchars($dataFechamento) . '</td>';
            echo '</tr>';
        }

        echo '</tbody></table></div>';
    }
}
