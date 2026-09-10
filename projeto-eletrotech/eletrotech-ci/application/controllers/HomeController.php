<?php
defined('BASEPATH') or exit('No direct script access allowed');

class HomeController extends Auth_Controller
{
    public function index()
    {
        $destino = $this->ehAdmin || !$this->eletricistaId
            ? primeira_tela_liberada($this->ehAdmin, $this->permissoes)
            : 'menu';

        if ($destino === null) {
            $this->session->set_flashdata('erro', 'Seu usuário não tem nenhum acesso liberado. Fale com o administrador.');
            redirect('auth/sair');
            return;
        }

        $rotulos = permissoes_disponiveis();

        $this->load->view('telas/HomeView', array(
            'usuario'       => $this->session->userdata('nome_exibicao') ?: $this->session->userdata('usuario'),
            'destino'       => $destino,
            'rotuloDestino' => $rotulos[$destino] ?? 'Dashboard',
        ));
    }
}
