<?php
defined('BASEPATH') or exit('No direct script access allowed');

class AuthController extends MY_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('UsuarioModel', 'usuarios');
        $this->load->library('form_validation');
    }

    public function index()
    {
        if ($this->session->userdata('user_id')) {
            redirect('home');
            return;
        }

        $this->load->view('telas/LoginView');
    }

    public function entrar()
    {
        if ($this->input->method() !== 'post') {
            redirect('auth');
        }

        if ($this->estaBloqueado('login', 5, 60)) {
            $this->session->set_flashdata('erro', 'Muitas tentativas falhadas. Tente novamente mais tarde.');
            redirect('auth');
        }

        $this->form_validation->set_rules('nome', 'Nome de Usuário', 'trim|required');
        $this->form_validation->set_rules('senha', 'Senha', 'required');

        if ($this->form_validation->run() === false) {
            $this->session->set_flashdata('erro', 'Por favor, preencha todos os campos.');
            redirect('auth');
        }

        $nomeUsuario = $this->input->post('nome');
        $senha       = $this->input->post('senha');

        // Aceita nome de usuário ou CPF do eletricista vinculado.
        $usuario = $this->usuarios->buscarPorLogin($nomeUsuario);

        if (!$usuario || !password_verify($senha, $usuario->senha)) {
            $this->session->set_flashdata('erro', 'Credenciais inválidas.');
            redirect('auth');
        }

        // Eletricista desligado não acessa, mesmo que a conta ainda exista.
        if ($usuario->eletricista_id !== null && !empty($usuario->data_demissao)) {
            $this->session->set_flashdata('erro', 'Acesso desativado. Fale com o administrador.');
            redirect('auth');
        }

        $ehAdmin    = ((int) $usuario->is_admin === 1);
        $permissoes = $ehAdmin
            ? array_keys(permissoes_disponiveis())
            : $this->usuarios->permissoesDoUsuario($usuario->id);
        $rota = rota_inicial($ehAdmin, $permissoes);

        if ($rota === null) {
            $this->session->set_flashdata('erro', 'Seu usuário ainda não tem nenhum acesso liberado. Fale com o administrador.');
            redirect('auth');
        }

        $this->session->set_userdata(array(
            'user_id'        => $usuario->id,
            'usuario'        => $usuario->usuario,
            'nome_exibicao'  => $usuario->eletricista_nome ?? $usuario->usuario,
            'is_admin'       => $ehAdmin,
            'eletricista_id' => $usuario->eletricista_id !== null ? (int) $usuario->eletricista_id : null,
            'permissoes'     => $permissoes,
        ));

        redirect($rota);
    }

    public function sair()
    {
        $this->session->sess_destroy();
        redirect('auth');
    }

    private function estaBloqueado($acao, $limiteTentativas = 5, $bloqueioSegundos = 60)
    {
        $chaveTentativas = "rl_{$acao}_tentativas";
        $chaveBloqueio   = "rl_{$acao}_bloqueio_ate";

        $bloqueadoAte = $this->session->userdata($chaveBloqueio);

        if ($bloqueadoAte) {
            if (time() < $bloqueadoAte) {
                return true;
            }
            $this->session->unset_userdata(array($chaveBloqueio, $chaveTentativas));
        }

        $tentativas = (int) $this->session->userdata($chaveTentativas) + 1;
        $this->session->set_userdata($chaveTentativas, $tentativas);

        if ($tentativas > $limiteTentativas) {
            $this->session->set_userdata($chaveBloqueio, time() + $bloqueioSegundos);
            return true;
        }

        return false;
    }
}