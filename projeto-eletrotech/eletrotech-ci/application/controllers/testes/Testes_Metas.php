<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Testes_Metas extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->library('unit_test');
        $this->load->model('MetasModel');
    }

    public function index() {
        $this->unit->use_strict(TRUE);

        $this->testar_crud_metas();
        $this->testar_filtros_e_contagem();
        $this->testar_eletricistas_ativos();
        $this->testar_get_all_com_paginacao();

        echo "<div style='font-family: Arial; padding: 20px;'>";
        echo "<h2>Relatório de Testes: MetasModel</h2>";
        echo $this->unit->report();
        echo "</div>";
    }

    private function testar_crud_metas() {
        $this->db->trans_start();

        // 1. Prepara dados falsos com CPF único
        $this->db->insert('tabela_eletricistas', [
            'nome' => 'Eletricista CRUD',
            'cpf'  => '000' . rand(100000000, 999999999)
        ]);
        $eletricistaId = $this->db->insert_id();

        // CORREÇÃO: Alterado 'valor_meta' para 'vlr_meta' para bater com o banco
        $dados_meta = [
            'eletricista_meta' => $eletricistaId,
            'mes_meta'         => '2026-07',
            'vlr_meta'         => 5000.00 
        ];

        // 2. Testa Insert
        $inseriu = $this->MetasModel->insert($dados_meta);
        $this->unit->run($inseriu, TRUE, 'CRUD - Insert: Deve retornar TRUE ao inserir nova meta');
        $id_meta = $this->db->insert_id();

        // 3. Testa Get By ID
        $meta = $this->MetasModel->get_by_id($id_meta);
        $this->unit->run($meta['mes_meta'], '2026-07', 'CRUD - Read: Deve retornar os dados corretos inseridos');

        // 4. Testa Update
        $this->MetasModel->update($id_meta, ['mes_meta' => '2026-08']);
        $meta_atualizada = $this->MetasModel->get_by_id($id_meta);
        $this->unit->run($meta_atualizada['mes_meta'], '2026-08', 'CRUD - Update: Deve atualizar o registro no banco');

        // 5. Testa Delete
        $deletou = $this->MetasModel->delete($id_meta);
        $this->unit->run($deletou, TRUE, 'CRUD - Delete: Deve retornar TRUE ao excluir a meta');
        
        $meta_deletada = $this->MetasModel->get_by_id($id_meta);
        $this->unit->run(empty($meta_deletada), TRUE, 'CRUD - Delete: O registro não deve mais existir ao buscá-lo novamente');

        $this->db->trans_rollback();
    }

    private function testar_filtros_e_contagem() {
        $this->db->trans_start();

        // Cria dois eletricistas de teste com CPFs únicos
        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletr A', 'cpf' => '001' . rand(100000000, 999999999)]);
        $id_A = $this->db->insert_id();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletr B', 'cpf' => '002' . rand(100000000, 999999999)]);
        $id_B = $this->db->insert_id();

        // Eletricista A tem duas metas em meses diferentes
        $this->MetasModel->insert(['eletricista_meta' => $id_A, 'mes_meta' => '2026-01']);
        $this->MetasModel->insert(['eletricista_meta' => $id_A, 'mes_meta' => '2026-02']);

        // Eletricista B tem apenas uma meta
        $this->MetasModel->insert(['eletricista_meta' => $id_B, 'mes_meta' => '2026-01']);

        // Teste de Contagem (Filtro por ID)
        $contagemA = $this->MetasModel->contar($id_A, '');
        $this->unit->run($contagemA, 2, 'Filtros: A contagem deve achar 2 metas para o Eletricista A');

        // Teste de Contagem Combinada (Filtro por ID + Mês)
        $contagemA_Fev = $this->MetasModel->contar($id_A, '2026-02');
        $this->unit->run($contagemA_Fev, 1, 'Filtros: Deve achar exatamente 1 meta para Eletricista A no mês 2026-02');

        // Teste do get_all com filtros e verificação do JOIN
        $resultados = $this->MetasModel->get_all($id_B, '2026-01');
        $this->unit->run(count($resultados), 1, 'Filtros: get_all deve retornar apenas 1 registro combinando eletricista B e mês');
        
        // Verifica se o JOIN com a tabela de eletricistas funcionou
        $this->unit->run($resultados[0]['nome_eletricista'] ?? '', 'Eletr B', 'Filtros/Join: Deve trazer o "nome_eletricista" corretamente');

        $this->db->trans_rollback();
    }

    private function testar_eletricistas_ativos() {
        $this->db->trans_start();

        // Insere um ativo e um demitido com CPFs únicos
        $this->db->insert('tabela_eletricistas', [
            'nome' => 'Ativo Teste', 
            'data_demissao' => null,
            'cpf' => '003' . rand(100000000, 999999999)
        ]);
        $id_ativo = $this->db->insert_id();

        $this->db->insert('tabela_eletricistas', [
            'nome' => 'Demitido Teste', 
            'data_demissao' => '2026-01-01',
            'cpf' => '004' . rand(100000000, 999999999)
        ]);
        $id_demitido = $this->db->insert_id();

        // Puxa a lista da model
        $lista_ativos = $this->MetasModel->get_eletricistas_ativos();
        
        // Extrai apenas os IDs para facilitar a busca no array
        $ids = array_column($lista_ativos, 'id');

        // Verifica as lógicas
        $this->unit->run(in_array($id_ativo, $ids), TRUE, 'Ativos: Eletricista sem data_demissao DEVE constar na lista');
        $this->unit->run(in_array($id_demitido, $ids), FALSE, 'Ativos: Eletricista com data_demissao NÃO pode constar na lista');

        $this->db->trans_rollback();
    }
    private function testar_get_all_com_paginacao() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletr Paginacao', 'cpf' => '005' . rand(100000000, 999999999)]);
        $id = $this->db->insert_id();

        $this->MetasModel->insert(['eletricista_meta' => $id, 'mes_meta' => '2026-03']);
        $this->MetasModel->insert(['eletricista_meta' => $id, 'mes_meta' => '2026-04']);
        $this->MetasModel->insert(['eletricista_meta' => $id, 'mes_meta' => '2026-05']);

        // Com limite=2, deve trazer só 2 dos 3 registros
        $pagina1 = $this->MetasModel->get_all($id, '', 2, 0);
        $this->unit->run(count($pagina1), 2, 'Paginacao: Com limite=2 deve retornar exatamente 2 registros');

        // Offset=2 deve trazer o restante (1 registro)
        $pagina2 = $this->MetasModel->get_all($id, '', 2, 2);
        $this->unit->run(count($pagina2), 1, 'Paginacao: Com offset=2 deve retornar o registro restante');

        // Os registros não devem se repetir entre as páginas
        $idsPagina1 = array_column($pagina1, 'id');
        $idsPagina2 = array_column($pagina2, 'id');
        $this->unit->run(count(array_intersect($idsPagina1, $idsPagina2)), 0, 'Paginacao: Não deve haver sobreposição de registros entre páginas');

        $this->db->trans_rollback();
    }
}