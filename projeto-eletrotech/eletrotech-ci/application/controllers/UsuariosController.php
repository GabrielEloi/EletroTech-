<?php
defined('BASEPATH') or exit('No direct script access allowed');

class UsuariosController extends Auth_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->exigirAdmin();
    }

    public function index()
    {
        $total = $this->usuarios->contarUsuarios();
        $dados = $this->paginar($total, site_url('usuarios'));

        $usuarios = $this->usuarios->listarUsuarios($dados['por_pagina'], $dados['offset']);

        foreach ($usuarios as $usuario) {
            $usuario->permissoes = $this->usuarios->permissoesDoUsuario($usuario->id);
        }

        $dados['usuarios']              = $usuarios;
        $dados['permissoesDisponiveis'] = permissoes_disponiveis();

        $this->load->view('telas/UsuariosView', $dados);
    }

    public function criar()
    {
        if ($this->input->method() !== 'post') {
            redirect('usuarios');
        }

        $nome       = trim((string) $this->input->post('usuario'));
        $senha      = (string) $this->input->post('senha');
        $isAdmin    = $this->input->post('is_admin') ? 1 : 0;
        $permissoes = (array) $this->input->post('permissoes');

        if ($nome === '' || strlen($senha) < 8) {
            $this->session->set_flashdata('erro', 'Informe um nome de usuário e uma senha de no mínimo 8 caracteres.');
            redirect('usuarios');
        }

        if ($this->usuarios->usuarioExiste($nome)) {
            $this->session->set_flashdata('erro', "Já existe um usuário com o nome '{$nome}'. Escolha outro.");
            redirect('usuarios');
        }

        if (!$isAdmin && empty($permissoes)) {
            $this->session->set_flashdata('erro', 'Marque ao menos um acesso — sem nenhum, o usuário não consegue entrar no sistema.');
            redirect('usuarios');
        }

        $novoId = $this->usuarios->criarUsuario($nome, $senha, $isAdmin, null);

        if (!$novoId) {
            $this->session->set_flashdata('erro', 'Erro ao criar o usuário.');
            redirect('usuarios');
        }

        $this->usuarios->definirPermissoes($novoId, $isAdmin ? array() : $permissoes);

        $this->session->set_flashdata('sucesso', 'Usuário criado com sucesso!');
        redirect('usuarios');
    }

    public function editar()
    {
        if ($this->input->method() !== 'post') {
            redirect('usuarios');
        }

        $id         = (int) $this->input->post('id');
        $nome       = trim((string) $this->input->post('usuario'));
        $isAdmin    = $this->input->post('is_admin') ? 1 : 0;
        $permissoes = (array) $this->input->post('permissoes');
        $novaSenha  = (string) $this->input->post('senha');

        if (!$id || $nome === '') {
            $this->session->set_flashdata('erro', 'O nome de usuário não pode estar vazio.');
            redirect('usuarios');
        }

        $usuarioAtual = $this->usuarios->buscarUsuarioPorId($id);

        if (!$usuarioAtual) {
            $this->session->set_flashdata('erro', 'Usuário não encontrado.');
            redirect('usuarios');
        }

        if ($usuarioAtual->eletricista_id !== null) {
            $nome = $usuarioAtual->usuario;
        }

        if ($this->usuarios->usuarioExiste($nome, $id)) {
            $this->session->set_flashdata('erro', "Já existe um usuário com o nome '{$nome}'. Escolha outro.");
            redirect('usuarios');
        }

        // Não deixar o sistema ficar sem nenhum administrador.
        if (!$isAdmin && $this->usuarios->ehUltimoAdmin($id)) {
            $this->session->set_flashdata('erro', 'Não é possível remover o acesso de administrador do último admin.');
            redirect('usuarios');
        }

        if ($isAdmin && $usuarioAtual->eletricista_id !== null) {
            $this->session->set_flashdata('erro', 'Contas de eletricista não podem ser promovidas a administrador.');
            redirect('usuarios');
        }

        if (!$isAdmin && empty($permissoes)) {
            $this->session->set_flashdata('erro', 'Marque ao menos um acesso — sem nenhum, o usuário não consegue entrar no sistema.');
            redirect('usuarios');
        }

        if ($novaSenha !== '' && strlen($novaSenha) < 8) {
            $this->session->set_flashdata('erro', 'A nova senha deve ter no mínimo 8 caracteres.');
            redirect('usuarios');
        }

        $this->usuarios->atualizarDados($id, $nome, $isAdmin, $usuarioAtual->eletricista_id);

        if ($novaSenha !== '') {
            $this->usuarios->redefinirSenha($id, $novaSenha);
        }

        $this->usuarios->definirPermissoes($id, $isAdmin ? array() : $permissoes);

        $this->session->set_flashdata('sucesso', 'Usuário atualizado com sucesso!');
        redirect('usuarios');
    }

    public function excluir($id = null)
    {
        $id = (int) $id;

        if (!$id) {
            redirect('usuarios');
        }

        if ($id === (int) $this->session->userdata('user_id')) {
            $this->session->set_flashdata('erro', 'Você não pode excluir a própria conta.');
            redirect('usuarios');
        }

        if ($this->usuarios->ehUltimoAdmin($id)) {
            $this->session->set_flashdata('erro', 'Não é possível excluir o último administrador.');
            redirect('usuarios');
        }

        if ($this->usuarios->excluirUsuario($id)) {
            $this->session->set_flashdata('sucesso', 'Registo excluído com sucesso!');
        } else {
            $this->session->set_flashdata('erro', 'Não foi possível excluir. O registo pode estar vinculado a outras informações no sistema.');
        }

        redirect('usuarios');
    }
}
