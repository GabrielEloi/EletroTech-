<?php
defined('BASEPATH') or exit('No direct script access allowed');

class ChecklistController extends Auth_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->exigirPermissao('checklist');
        $this->load->model('ChecklistModel');
    }

    public function index()
    {
        $data['titulo'] = 'Checklist - EletroTech';
        $all = $this->ChecklistModel->get_all();
        $tipo = $this->input->get('tipo', TRUE);
        $titulo = $this->input->get('titulo', TRUE);


        $filtered = $all;
        if (!empty($titulo)) {
            $filtered = array_values(array_filter($filtered, function ($c) use ($titulo) {
                return isset($c['titulo']) && stripos($c['titulo'], $titulo) !== false;
            }));
        }

        if (!empty($tipo) && in_array($tipo, ['inicio', 'fim'])) {
            $filtered = array_values(array_filter($filtered, function ($c) use ($tipo) {
                return isset($c['tipo']) && $c['tipo'] === $tipo;
            }));
        }

        $total = count($filtered);
        $data  = array_merge($data, $this->paginar($total, site_url('checklist')));

        $data['checklists'] = array_slice($filtered, $data['offset'], $data['por_pagina']);
        $data['filterTipo'] = $tipo ?? '';
        $data['filterTitulo'] = $titulo ?? '';
        $data['selectedInicio'] = $this->ChecklistModel->get_selected_by_type('inicio');
        $data['selectedFim'] = $this->ChecklistModel->get_selected_by_type('fim');

        $this->load->view('telas/ChecklistView', $data);
    }

    public function cadastrar()
    {
        $this->form_validation->set_rules('titulo', 'Título', 'required|min_length[3]');
        $this->form_validation->set_rules('tipo', 'Tipo', 'required|in_list[inicio,fim]');

        $perguntas = $this->input->post('pergunta', TRUE) ?: [];
        $tipos = $this->input->post('tipo_resposta', TRUE) ?: [];
        $bloqueios = $this->input->post('bloqueia_abertura', TRUE) ?: [];

        $perguntasValidas = [];
        foreach ($perguntas as $i => $texto) {
            $texto = trim((string) $texto);
            if ($texto === '') continue;
            $tipoResp = isset($tipos[$i]) && in_array($tipos[$i], ['radio', 'text']) ? $tipos[$i] : 'text';
            $bloq = isset($bloqueios[$i]) ? trim((string) $bloqueios[$i]) : null;
            $perguntasValidas[] = [
                'texto' => $texto,
                'tipo_resposta' => $tipoResp,
                'bloqueia_abertura' => $bloq,
            ];
        }

        if ($this->form_validation->run() === FALSE || empty($perguntasValidas)) {
            $this->session->set_flashdata('erro', 'Preencha o título e pelo menos uma pergunta válida.');
            redirect('checklist');
            return;
        }

        $data = [
            'titulo' => $this->input->post('titulo', TRUE),
            'tipo' => $this->input->post('tipo', TRUE),
            'selecionado' => 0,
        ];

        $idChecklist = $this->ChecklistModel->insert_checklist($data, $perguntasValidas);

        if ($idChecklist) {
            $selected = $this->ChecklistModel->get_selected_by_type($data['tipo']);
            if (empty($selected)) {
                $this->ChecklistModel->select_default($idChecklist, $data['tipo']);
            }
            $this->session->set_flashdata('sucesso', 'Checklist cadastrado com sucesso!');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao cadastrar checklist.');
        }

        redirect('checklist');
    }

    public function selecionar()
    {
        $idChecklist = $this->input->post('id_checklist', TRUE);
        $tipo = $this->input->post('tipo', TRUE);

        if (empty($idChecklist) || !is_numeric($idChecklist) || !in_array($tipo, ['inicio', 'fim'])) {
            $this->session->set_flashdata('erro', 'Checklist inválido.');
            redirect('checklist');
            return;
        }

        if ($this->ChecklistModel->select_default((int) $idChecklist, $tipo)) {
            $this->session->set_flashdata('sucesso', 'Checklist padrão selecionado com sucesso.');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao definir checklist como padrão.');
        }

        redirect('checklist');
    }

    public function perguntas($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            echo '<p class="text-center text-danger">Checklist inválido.</p>';
            return;
        }

        $perguntas = $this->ChecklistModel->get_perguntas((int) $id);

        if (empty($perguntas)) {
            echo '<p class="text-center">Nenhuma pergunta cadastrada para este checklist.</p>';
            return;
        }

        $this->load->view('telas/ChecklistPerguntas', ['perguntas' => $perguntas]);
    }

    public function excluir($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            $this->session->set_flashdata('erro', 'Checklist inválido.');
            redirect('checklist');
            return;
        }

        if ($this->ChecklistModel->delete_checklist((int) $id)) {
            $this->session->set_flashdata('sucesso', 'Checklist excluído com sucesso.');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao excluir checklist. Verifique se ele não está selecionado como padrão ou se possui perguntas associadas.');
        }

        redirect('checklist');
    }
}
