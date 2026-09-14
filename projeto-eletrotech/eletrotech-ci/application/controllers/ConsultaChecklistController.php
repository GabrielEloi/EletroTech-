<?php
defined('BASEPATH') or exit('No direct script access allowed');

class ConsultaChecklistController extends Auth_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->exigirPermissao('checklist'); // reaproveitando a permissão existente
        $this->load->model('ChecklistModel');
        $this->load->model('OrdemservicoModel');
    }

    public function index()
    {
        $data['titulo'] = 'Consulta Checklist - EletroTech';
        $data['filtroTipo'] = $this->input->get('tipo', TRUE) ?: '';
        $data['filtroEletricista'] = $this->input->get('eletricista', TRUE) ?: '';
        $data['ordenar'] = $this->input->get('ordenar', TRUE) ?: 'data_desc';

        $total = $this->ChecklistModel->contar_bloqueados(
            $data['filtroTipo'] ?: null,
            $data['filtroEletricista'] ?: null
        );

        $data = array_merge($data, $this->paginar($total, site_url('consultachecklist')));

        $data['checklists'] = $this->ChecklistModel->get_bloqueados(
            $data['filtroTipo'] ?: null,
            $data['filtroEletricista'] ?: null,
            $data['ordenar'],
            $data['por_pagina'],
            $data['offset']
        );

        $data['eletricistas'] = $this->ChecklistModel->listarEletricistas();

        $this->load->view('telas/ConsultaChecklistView', $data);
    }

    public function finalizar()
    {
        $idOs = (int) $this->input->post('id_os', TRUE);
        $tipo = $this->input->post('tipo', TRUE);
        $observacao = trim((string) $this->input->post('observacao', TRUE));
        $acao = $this->input->post('acao', TRUE) === 'negar' ? 'negar' : 'autorizar';

        if ($idOs <= 0 || !in_array($tipo, ['inicio', 'fim'], true)) {
            $this->session->set_flashdata('erro', 'Checklist inválido.');
            redirect('consultachecklist');
            return;
        }

        if ($observacao === '') {
            $this->session->set_flashdata('erro', 'Informe uma observação para registrar a decisão do checklist.');
            redirect('consultachecklist');
            return;
        }

        if ($this->ChecklistModel->finalizar_checklist($idOs, $tipo, $observacao, $acao)) {
            if ($acao === 'negar') {
                $this->session->set_flashdata('sucesso', 'Checklist negado. A OS #' . str_pad($idOs, 5, '0', STR_PAD_LEFT) . ' foi marcada como bloqueada.');
            } else {
                $this->session->set_flashdata('sucesso', 'Checklist autorizado. A OS #' . str_pad($idOs, 5, '0', STR_PAD_LEFT) . ' foi liberada.');
            }
        } else {
            $this->session->set_flashdata('erro', 'Não foi possível registrar esta decisão (verifique se o checklist ainda está pendente).');
        }

        redirect('consultachecklist');
    }

    public function relatorio($idOs = null, $tipo = null)
    {
        if (empty($idOs) || !is_numeric($idOs) || !in_array($tipo, ['inicio', 'fim'], true)) {
            echo '<p style="font-family:sans-serif;text-align:center;margin-top:40px;">Checklist inválido.</p>';
            return;
        }

        $ordem = $this->OrdemservicoModel->get_by_id((int) $idOs);

        if (empty($ordem)) {
            echo '<p style="font-family:sans-serif;text-align:center;margin-top:40px;">Ordem de serviço não encontrada.</p>';
            return;
        }

        $data = [
            'idOs' => (int) $idOs,
            'tipo' => $tipo,
            'ordem' => $ordem,
            'respostas' => $this->OrdemservicoModel->get_checklist_respostas_by_os_tipo((int) $idOs, $tipo),
            'status' => $this->ChecklistModel->get_status_by_os_tipo((int) $idOs, $tipo),
        ];

        $this->load->view('telas/ChecklistRelatorio', $data);
    }
}