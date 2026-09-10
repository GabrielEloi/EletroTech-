<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * @property CI_Loader $load
 * @property CI_Input $input
 * @property CI_Output $output
 * @property CI_Session $session
 * @property CI_DB_query_builder $db
 * @property CI_Form_validation $form_validation
 * @property CI_Pagination $pagination
 * @property UsuarioModel $usuarios
 * @property DashboardModel $dashboard
 */
class MY_Controller extends CI_Controller
{
    const POR_PAGINA_PADRAO = 10;

    protected function paginar($total, $baseUrl, $porPagina = null)
    {
        $porPagina = $porPagina ?: self::POR_PAGINA_PADRAO;

        // O offset vem da URL; valores inválidos voltam para a primeira página.
        $offset = (int) $this->input->get('per_page');

        if ($offset < 0 || $offset >= $total) {
            $offset = 0;
        }

        return array(
            'total_rows' => $total,
            'offset'     => $offset,
            'por_pagina' => $porPagina,
            'paginacao'  => $this->montar_paginacao($total, $baseUrl, $porPagina),
        );
    }

    // page_query_string mantém os filtros da tela ao trocar de página.
    protected function montar_paginacao($total, $baseUrl, $porPagina)
    {
        $config = array(
            'base_url'             => $baseUrl,
            'total_rows'           => $total,
            'per_page'             => $porPagina,
            'page_query_string'    => TRUE,
            'query_string_segment' => 'per_page',
            'reuse_query_string'   => TRUE,
            'num_links'            => 2,
            'first_link'           => 'Primeira',
            'last_link'            => 'Última',
            'prev_link'            => '&laquo;',
            'next_link'            => '&raquo;',
            'full_tag_open'        => '<ul class="pagination justify-content-center mb-0">',
            'full_tag_close'       => '</ul>',
            'first_tag_open'       => '<li class="page-item">',
            'first_tag_close'      => '</li>',
            'last_tag_open'        => '<li class="page-item">',
            'last_tag_close'       => '</li>',
            'prev_tag_open'        => '<li class="page-item">',
            'prev_tag_close'       => '</li>',
            'next_tag_open'        => '<li class="page-item">',
            'next_tag_close'       => '</li>',
            'num_tag_open'         => '<li class="page-item">',
            'num_tag_close'        => '</li>',
            'cur_tag_open'         => '<li class="page-item active"><span class="page-link">',
            'cur_tag_close'        => '</span></li>',
            'attributes'           => array('class' => 'page-link'),
        );

        $this->pagination->initialize($config);

        return $this->pagination->create_links();
    }
}

class Auth_Controller extends MY_Controller
{
    protected $ehAdmin = false;
    protected $permissoes = array();
    protected $eletricistaId = null;

    public function __construct()
    {
        parent::__construct();

        $userId = $this->session->userdata('user_id');

        if (!$userId) {
            redirect('auth');
        }

        $this->load->model('UsuarioModel', 'usuarios');
        $usuario = $this->usuarios->buscarUsuarioPorId($userId);

        if (!$usuario) {
            $this->session->sess_destroy();
            redirect('auth');
        }

        // Autorização vem do banco, não da sessão.
        $this->ehAdmin       = ((int) $usuario->is_admin === 1);
        $this->eletricistaId = $usuario->eletricista_id !== null ? (int) $usuario->eletricista_id : null;
        $this->permissoes    = $this->ehAdmin
            ? array_keys(permissoes_disponiveis())
            : $this->usuarios->permissoesDoUsuario($userId);

        $this->session->set_userdata(array(
            'is_admin'   => $this->ehAdmin,
            'permissoes' => $this->permissoes,
            'nome_exibicao' => $usuario->eletricista_nome ?? $usuario->usuario,
        ));
    }

    protected function exigirPermissao($chave)
    {
        if ($this->ehAdmin || in_array($chave, $this->permissoes, true)) {
            return;
        }

        $this->session->set_flashdata('erro', 'Você não tem acesso a essa área.');
        redirect(rota_inicial($this->ehAdmin, $this->permissoes) ?? 'auth/sair');
    }

    protected function exigirAdmin()
    {
        if ($this->ehAdmin) {
            return;
        }

        $this->session->set_flashdata('erro', 'Área restrita ao administrador.');
        redirect(rota_inicial($this->ehAdmin, $this->permissoes) ?? 'auth/sair');
    }
}
