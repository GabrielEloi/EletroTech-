<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Testes_Produtos extends CI_Controller {

    public function __construct() {
        parent::__construct();
        // Carrega a biblioteca nativa
        $this->load->library('unit_test');
        // Carrega a model
        $this->load->model('ProdutosModel');
    }

    public function index() {
        // Habilita formatação estrita
        $this->unit->use_strict(TRUE);

        // Roda os testes
        $this->testar_insercao_e_movimentacao_inicial();
        $this->testar_update();
        $this->testar_zerar_estoque();
        $this->testar_aumentar_estoque();
        $this->testar_aumentar_estoque_produto_inexistente();
        $this->testar_get_all_e_contar();
        $this->testar_insert_sem_estoque_nao_gera_movimentacao();
        $this->testar_zerar_estoque_ja_zerado_e_inexistente();

        // Exibe o relatório
        echo "<div style='font-family: Arial; padding: 20px;'>";
        echo "<h2>Relatório de Testes: ProdutosModel</h2>";
        echo $this->unit->report();
        echo "</div>";
    }

    private function testar_insercao_e_movimentacao_inicial() {
        $this->db->trans_start();
        try {
            // Cenário: Criar um produto com estoque inicial > 0
            $dados = array(
                'nome_produto' => 'Produto Teste 1',
                'vlr_unitario' => 50.00,
                'qtd_estoque'  => 10
            );

            // insert() devolve o ID do produto. Não usar $this->db->insert_id()
            // aqui: com estoque inicial a última inserção é a da movimentação.
            $id = $this->ProdutosModel->insert($dados);

            $this->unit->run(is_int($id) && $id > 0, TRUE, 'Insert: Deve criar o produto e retornar o ID dele');

            // O produto tem que existir mesmo, com os dados que mandamos
            $produto = $this->ProdutosModel->get_by_id($id);
            $this->unit->run($produto['nome_produto'] ?? '', 'Produto Teste 1', 'Insert: O ID retornado deve apontar para o produto criado');
            $this->unit->run((int)($produto['qtd_estoque'] ?? -1), 10, 'Insert: O estoque inicial deve ser gravado no cadastro');

            // E o estoque inicial tem que virar uma entrada no ledger
            $mov = $this->db->get_where('tabela_movimentacoes', ['id_produto' => $id])->row_array();
            $this->unit->run($mov['tipo'] ?? '', 'entrada', 'Insert: Deve gerar uma movimentação de "entrada" para o estoque inicial');
            $this->unit->run((int)($mov['quantidade'] ?? 0), 10, 'Insert: A movimentação inicial deve ter a quantidade cadastrada (10)');
        } finally {
            $this->db->trans_rollback();
        }
    }

    private function testar_update() {
        $this->db->trans_start();
        try {
            // Insere um produto para atualizar depois
            // nome_produto é NOT NULL no banco, então precisa vir sempre.
            $id = $this->ProdutosModel->insert([
                'nome_produto' => 'Produto Update',
                'vlr_unitario' => 10.00,
                'qtd_estoque'  => 0
            ]);

            // Atualiza o valor
            $this->ProdutosModel->update($id, ['vlr_unitario' => 15.50]);

            // Busca e verifica se o valor mudou
            $produto = $this->ProdutosModel->get_by_id($id);

            // Convertendo para float para evitar falsos negativos por causa do tipo de dado do banco (string decimal vs float)
            $this->unit->run((float)$produto['vlr_unitario'], 15.50, 'Update: Deve atualizar o valor unitário corretamente');
        } finally {
            $this->db->trans_rollback();
        }
    }

    private function testar_zerar_estoque() {
        $this->db->trans_start();
        try {
            // Cria produto com estoque 5
            $id = $this->ProdutosModel->insert([
                'nome_produto' => 'Produto Zerar',
                'vlr_unitario' => 20.00,
                'qtd_estoque'  => 5
            ]);

            // Zera o estoque
            $ok = $this->ProdutosModel->zerarEstoque($id);
            $this->unit->run($ok, TRUE, 'ZerarEstoque: Deve retornar TRUE ao zerar um produto existente');

            // 1. Verifica se a tabela principal zerou
            $produto = $this->ProdutosModel->get_by_id($id);
            $this->unit->run((int)$produto['qtd_estoque'], 0, 'ZerarEstoque: A quantidade no cadastro do produto deve ir para 0');

            // 2. Verifica se a movimentação de SAÍDA foi gerada
            // Order by id DESC para pegar a última movimentação (a saída) já que a entrada inicial gera um registro também.
            $mov_saida = $this->db->order_by('id', 'DESC')->get_where('tabela_movimentacoes', ['id_produto' => $id])->row_array();
            $this->unit->run($mov_saida['tipo'], 'saida', 'ZerarEstoque: Deve gerar uma movimentação do tipo "saida" no ledger');
            $this->unit->run((int)$mov_saida['quantidade'], 5, 'ZerarEstoque: A quantidade da movimentação de saída deve ser igual ao estoque que foi zerado (5)');
        } finally {
            $this->db->trans_rollback();
        }
    }

    private function testar_aumentar_estoque() {
        $this->db->trans_start();
        try {
            // Cria produto com estoque 2
            $id = $this->ProdutosModel->insert([
                'nome_produto' => 'Produto Aumentar',
                'vlr_unitario' => 30.00,
                'qtd_estoque'  => 2
            ]);

            // Aumenta o estoque em +3
            $ok = $this->ProdutosModel->aumentarQtdEstoque($id, 3);
            $this->unit->run($ok, TRUE, 'AumentarEstoque: Deve retornar TRUE ao repor um produto existente');

            // 1. Verifica se a matemática deu certo (2 + 3 = 5)
            $produto = $this->ProdutosModel->get_by_id($id);
            $this->unit->run((int)$produto['qtd_estoque'], 5, 'AumentarEstoque: O saldo total do produto deve ser a soma exata (2 + 3 = 5)');

            // 2. Verifica a movimentação de ENTRADA
            $mov_entrada = $this->db->order_by('id', 'DESC')->get_where('tabela_movimentacoes', ['id_produto' => $id])->row_array();
            $this->unit->run($mov_entrada['tipo'], 'entrada', 'AumentarEstoque: Deve gerar uma movimentação do tipo "entrada"');
            $this->unit->run((int)$mov_entrada['quantidade'], 3, 'AumentarEstoque: A quantidade do registro deve refletir o valor adicionado (3)');
        } finally {
            $this->db->trans_rollback();
        }
    }

    /**
     * Regressão: repor estoque de um produto que não existe tentava gravar a
     * movimentação mesmo assim e estourava a FK fk_mov_produto (erro 1452).
     */
    private function testar_aumentar_estoque_produto_inexistente() {
        $this->db->trans_start();
        try {
            $ok = $this->ProdutosModel->aumentarQtdEstoque(999999, 3);
            $this->unit->run($ok, FALSE, 'AumentarEstoque: Deve retornar FALSE para produto inexistente, sem violar a FK');

            $orfas = $this->db->where('id_produto', 999999)->count_all_results('tabela_movimentacoes');
            $this->unit->run($orfas, 0, 'AumentarEstoque: Não pode deixar movimentação órfã no ledger');
        } finally {
            $this->db->trans_rollback();
        }
    }

    private function testar_get_all_e_contar() {
        $this->db->trans_start();
        try {
            $antesContar = $this->ProdutosModel->contar();

            $id1 = $this->ProdutosModel->insert(['nome_produto' => 'Produto GetAll 1', 'vlr_unitario' => 5, 'qtd_estoque' => 0]);
            $id2 = $this->ProdutosModel->insert(['nome_produto' => 'Produto GetAll 2', 'vlr_unitario' => 5, 'qtd_estoque' => 0]);

            $depoisContar = $this->ProdutosModel->contar();
            $this->unit->run($depoisContar - $antesContar, 2, 'Contar: Deve refletir exatamente os 2 produtos inseridos');

            $lista = $this->ProdutosModel->get_all();
            $ids = array_column($lista, 'id');
            $this->unit->run(in_array($id1, $ids) && in_array($id2, $ids), TRUE, 'GetAll: Deve incluir os produtos criados');

            $paginado = $this->ProdutosModel->get_all(1, 0);
            $this->unit->run(count($paginado), 1, 'GetAll: Com limite=1 deve retornar exatamente 1 registro');
        } finally {
            $this->db->trans_rollback();
        }
    }

    private function testar_insert_sem_estoque_nao_gera_movimentacao() {
        $this->db->trans_start();
        try {
            $id = $this->ProdutosModel->insert([
                'nome_produto' => 'Produto Sem Estoque',
                'vlr_unitario' => 10.00,
                'qtd_estoque'  => 0
            ]);

            $mov = $this->db->where('id_produto', $id)->count_all_results('tabela_movimentacoes');
            $this->unit->run($mov, 0, 'Insert: Produto cadastrado com estoque 0 não deve gerar movimentação');
        } finally {
            $this->db->trans_rollback();
        }
    }

    private function testar_zerar_estoque_ja_zerado_e_inexistente() {
        $this->db->trans_start();
        try {
            // Produto já com estoque 0
            $id = $this->ProdutosModel->insert([
                'nome_produto' => 'Produto Ja Zerado',
                'vlr_unitario' => 10.00,
                'qtd_estoque'  => 0
            ]);

            $ok = $this->ProdutosModel->zerarEstoque($id);
            $this->unit->run($ok, TRUE, 'ZerarEstoque: Deve retornar TRUE mesmo se o estoque já estava em 0');

            $mov = $this->db->where('id_produto', $id)->where('tipo', 'saida')->count_all_results('tabela_movimentacoes');
            $this->unit->run($mov, 0, 'ZerarEstoque: Não deve gerar movimentação de saída se não havia estoque a baixar');

            // Produto inexistente
            $falhou = $this->ProdutosModel->zerarEstoque(999999);
            $this->unit->run($falhou, FALSE, 'ZerarEstoque: Deve retornar FALSE para produto inexistente');
        } finally {
            $this->db->trans_rollback();
        }
    }
}
