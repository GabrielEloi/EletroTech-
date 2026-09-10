<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Testes_Usuario extends CI_Controller {

    public function __construct() {
        parent::__construct();
        // Carrega a biblioteca nativa de testes do CI3
        $this->load->library('unit_test');
        
        // Carrega a model que vamos testar
        $this->load->model('UsuarioModel');
    }

    // A função index roda todos os testes e imprime a tabela
    public function index() {
        // Habilita formatação visual em HTML
        $this->unit->use_strict(TRUE);

        // Chama as funções de teste
        $this->testar_criacao_e_busca();
        $this->testar_usuario_existe();
        $this->testar_contar_usuarios();

        // Gera e exibe o relatório na tela
        echo "<div style='font-family: Arial; padding: 20px;'>";
        echo "<h2>Relatório de Testes: UsuarioModel</h2>";
        echo $this->unit->report();
        echo "</div>";
    }

    private function testar_criacao_e_busca() {
        // Inicia transação: nada será salvo de verdade no banco
        $this->db->trans_start();

        // 1. Testa a criação
        $novo_id = $this->UsuarioModel->criarUsuario('joao_teste', 'senha123', 1);
        $criou_com_sucesso = ($novo_id > 0);
        $this->unit->run($criou_com_sucesso, TRUE, 'Deve criar um usuário e retornar um ID válido (> 0)');

        // 2. Testa a busca pelo ID gerado
        $usuario_salvo = $this->UsuarioModel->buscarUsuarioPorId($novo_id);
        $nome_salvo = $usuario_salvo ? $usuario_salvo->usuario : '';
        $this->unit->run($nome_salvo, 'joao_teste', 'Deve buscar o usuário correto no banco usando o ID');

        // Desfaz a transação: apaga o 'joao_teste' do banco de dados
        $this->db->trans_rollback();
    }

    private function testar_usuario_existe() {
        $this->db->trans_start();

        // Prepara o cenário criando um usuário falso
        $this->UsuarioModel->criarUsuario('maria_teste', 'senha123');

        // Testa cenário positivo
        $existe = $this->UsuarioModel->usuarioExiste('maria_teste');
        $this->unit->run($existe, TRUE, 'O método usuarioExiste() deve retornar TRUE para um usuário existente');

        // Testa cenário negativo
        $nao_existe = $this->UsuarioModel->usuarioExiste('usuario_fantasma');
        $this->unit->run($nao_existe, FALSE, 'O método usuarioExiste() deve retornar FALSE para um usuário que não existe');

        $this->db->trans_rollback();
    }

    private function testar_contar_usuarios() {
        $this->db->trans_start();

        // Pega a quantidade atual antes do teste
        $total_antes = $this->UsuarioModel->contarUsuarios();

        // Cria dois usuários novos
        $this->UsuarioModel->criarUsuario('user_1', '123');
        $this->UsuarioModel->criarUsuario('user_2', '123');

        // Pega a nova quantidade
        $total_depois = $this->UsuarioModel->contarUsuarios();
        
        // A diferença deve ser exatamente 2
        $diferenca = $total_depois - $total_antes;
        $this->unit->run($diferenca, 2, 'Ao adicionar 2 usuários, o total retornado por contarUsuarios() deve aumentar em 2');

        $this->db->trans_rollback();
    }
}