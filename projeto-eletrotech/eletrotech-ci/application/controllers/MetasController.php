<?php
defined('BASEPATH') or exit('No direct script access allowed');

class MetasController extends Auth_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->exigirPermissao('metas');
        $this->load->model('MetasModel');
    }

    public function index()
    {
        $filtroEletricista = $this->input->get('filtro_eletricista', TRUE);
        $filtroMes = $this->input->get('filtro_mes', TRUE);

        $data['titulo']  = 'Metas - EletroTech';

        $total = $this->MetasModel->contar($filtroEletricista, $filtroMes);
        $data  = array_merge($data, $this->paginar($total, site_url('metas')));

        $data['metas'] = $this->MetasModel->get_all($filtroEletricista, $filtroMes, $data['por_pagina'], $data['offset']);
        $data['eletricistasAtivos'] = $this->MetasModel->get_eletricistas_ativos();
        $data['filtroEletricista'] = $filtroEletricista ?? '';
        $data['filtroMes'] = $filtroMes ?? '';

        $this->load->view('telas/MetasView', $data);
    }

    public function cadastrar()
    {
        $this->form_validation->set_rules('eletricista_meta', 'Eletricista', 'required|numeric');
        $this->form_validation->set_rules('mes_meta', 'Mês de Referência', 'required');
        $this->form_validation->set_rules('vlr_meta', 'Valor da Meta', 'required');

        if ($this->form_validation->run() === FALSE) {
            $this->session->set_flashdata('erro', validation_errors());
            redirect('metas');
            return;
        }

        $data = [
            'eletricista_meta' => $this->input->post('eletricista_meta', TRUE),
            'mes_meta' => $this->input->post('mes_meta', TRUE),
            'vlr_meta' => $this->input->post('vlr_meta', TRUE),
        ];

        if ($this->MetasModel->insert($data)) {
            $this->session->set_flashdata('sucesso', 'Meta cadastrada com sucesso!');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao cadastrar meta.');
        }

        redirect('metas');
    }

    public function editar()
    {
        $id = $this->input->post('id', TRUE);

        $this->form_validation->set_rules('id', 'ID', 'required|numeric');
        $this->form_validation->set_rules('vlr_meta', 'Valor da Meta', 'required|decimal');

        if ($this->form_validation->run() === FALSE) {
            $this->session->set_flashdata('erro', validation_errors());
            redirect('metas');
            return;
        }

        $data = [
            'vlr_meta' => $this->input->post('vlr_meta', TRUE),
        ];

        if ($this->MetasModel->update($id, $data)) {
            $this->session->set_flashdata('sucesso', 'Meta atualizada com sucesso!');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao atualizar meta.');
        }

        redirect('metas');
    }

    public function excluir($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            show_404();
            return;
        }

        if ($this->MetasModel->delete($id)) {
            $this->session->set_flashdata('sucesso', 'Meta excluída com sucesso.');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao excluir meta.');
        }

        redirect('metas');
    }
}
