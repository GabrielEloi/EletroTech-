<?php
defined('BASEPATH') or exit('No direct script access allowed');

class ProdutosController extends Auth_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->exigirPermissao('produtos');
        $this->load->model('ProdutosModel');
    }

    public function index()
    {
        $data['titulo'] = 'Produtos - EletroTech';

        $total = $this->ProdutosModel->contar();
        $data  = array_merge($data, $this->paginar($total, site_url('produtos')));

        $data['produtos'] = $this->ProdutosModel->get_all($data['por_pagina'], $data['offset']);

        $this->load->view('telas/ProdutosView', $data);
    }

    public function cadastrar()
    {
        $this->form_validation->set_rules('nome_produto', 'Nome do Produto', 'required|min_length[3]');
        $this->form_validation->set_rules('vlr_unitario', 'Preço Unitário', 'required');
        $this->form_validation->set_rules('qtd_estoque', 'Quantidade em Estoque', 'required|integer|greater_than_equal_to[0]');

        if ($this->form_validation->run() === FALSE) {
            $this->session->set_flashdata('erro', validation_errors());
            redirect('produtos');
            return;
        }

        $data = [
            'nome_produto'  => $this->input->post('nome_produto', TRUE),
            'vlr_unitario'  => $this->input->post('vlr_unitario', TRUE),
            'qtd_estoque'   => $this->input->post('qtd_estoque', TRUE),
        ];

        if ($this->ProdutosModel->insert($data)) {
            $this->session->set_flashdata('sucesso', 'Produto cadastrado com sucesso!');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao cadastrar produto.');
        }

        redirect('produtos');
    }

    public function editar()
    {
        $id = $this->input->post('id', TRUE);

        $this->form_validation->set_rules('id', 'ID', 'required|numeric');
        $this->form_validation->set_rules('nome_produto', 'Nome do Produto', 'required|min_length[3]');
        $this->form_validation->set_rules('vlr_unitario', 'Valor Unitário', 'required');

        if ($this->form_validation->run() === FALSE) {
            $this->session->set_flashdata('erro', validation_errors());
            redirect('produtos');
            return;
        }

        $data = [
            'nome_produto' => $this->input->post('nome_produto', TRUE),
            'vlr_unitario' => $this->input->post('vlr_unitario', TRUE),
        ];

        if ($this->ProdutosModel->update($id, $data)) {
            $this->session->set_flashdata('sucesso', 'Produto atualizado com sucesso!');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao atualizar produto.');
        }

        redirect('produtos');
    }

    public function ZerarEstoque($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            show_404();
            return;
        }

        if ($this->ProdutosModel->ZerarEstoque($id)) {
            $this->session->set_flashdata('sucesso', 'Estoque do produto zerado com sucesso.');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao zerar estoque do produto.');
        }

        redirect('produtos');
    }

    public function aumentarQtdEstoque($id = null)
    {
        if (empty($id) || !is_numeric($id)) {
            $id = $this->input->post('id', TRUE);
        }

        if (empty($id) || !is_numeric($id)) {
            show_404();
            return;
        }

        $this->form_validation->set_rules('qtd_estoque', 'Quantidade em Estoque', 'required|integer|greater_than[0]');

        if ($this->form_validation->run() === FALSE) {
            $this->session->set_flashdata('erro', validation_errors());
            redirect('produtos');
            return;
        }

        $produto = $this->ProdutosModel->get_by_id($id);
        if (!$produto) {
            show_404();
            return;
        }

        $quantidade = $this->input->post('qtd_estoque', TRUE);
        if ($this->ProdutosModel->aumentarQtdEstoque($id, $quantidade)) {
            $this->session->set_flashdata('sucesso', 'Quantidade em estoque atualizada com sucesso!');
        } else {
            $this->session->set_flashdata('erro', 'Erro ao atualizar quantidade em estoque.');
        }

        redirect('produtos');
    }
}
