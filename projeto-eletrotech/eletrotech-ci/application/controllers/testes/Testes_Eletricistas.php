<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Testes_Eletricistas extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->library('unit_test');
        $this->load->model('EletricistasModel');
    }

    public function index() {
        $this->unit->use_strict(TRUE);

        $this->testar_crud_e_status();
        $this->testar_buscas_e_vinculos();
        $this->testar_get_all_com_subqueries();
        $this->testar_os_por_eletricista();
        $this->testar_contar();
        $this->testar_get_all_com_paginacao();

        echo "<div style='font-family: Arial; padding: 20px;'>";
        echo "<h2>Relatório de Testes: EletricistasModel</h2>";
        echo $this->unit->report();
        echo "</div>";
    }

    private function testar_crud_e_status() {
        $this->db->trans_start();

        // 1. Testa Insert
        $dados = ['nome' => 'Eletricista CRUD', 'cpf' => '00011122233'];
        $sucesso_insert = $this->EletricistasModel->insert($dados);
        $this->unit->run($sucesso_insert, TRUE, 'CRUD: Deve retornar TRUE ao inserir um eletricista');
        $id = $this->db->insert_id();

        // 2. Testa Update
        $this->EletricistasModel->update($id, ['nome' => 'Nome Atualizado']);
        $eletricista = $this->EletricistasModel->get_by_id($id);
        $this->unit->run($eletricista['nome'], 'Nome Atualizado', 'CRUD: Deve atualizar os dados corretamente');

        // 3. Testa Demitir
        $this->EletricistasModel->demitir($id);
        $demitido = $this->EletricistasModel->get_by_id($id);
        $this->unit->run($demitido['data_demissao'], date('Y-m-d'), 'Status: O método demitir() deve preencher a data_demissao com a data de hoje');

        // 4. Testa Reativar
        $this->EletricistasModel->reativar($id);
        $reativado = $this->EletricistasModel->get_by_id($id);
        $this->unit->run($reativado['data_demissao'], null, 'Status: O método reativar() deve setar a data_demissao como NULL');

        $this->db->trans_rollback();
    }

    private function testar_buscas_e_vinculos() {
        $this->db->trans_start();

        // Insere Eletricista Ativo
        $this->EletricistasModel->insert(['nome' => 'José Ativo', 'cpf' => '12312312312']);
        $id_ativo = $this->db->insert_id();

        // Insere Eletricista Demitido (data preenchida)
        $this->EletricistasModel->insert(['nome' => 'Maria Demitida', 'cpf' => '99988877766', 'data_demissao' => '2025-01-01']);
        $id_demitida = $this->db->insert_id();

        // Testa Busca por CPF
        $busca_cpf = $this->EletricistasModel->get_by_cpf('12312312312');
        $this->unit->run($busca_cpf['nome'], 'José Ativo', 'Busca: Deve retornar o eletricista correto buscando pelo CPF');

        // Testa Lista para Vínculo (dropdown de usuários)
        $lista_vinculo = $this->EletricistasModel->listar_para_vinculo();
        $ids_ativos = array_column($lista_vinculo, 'id');
        
        $this->unit->run(in_array($id_ativo, $ids_ativos), TRUE, 'Vínculo: Eletricista ativo DEVE aparecer na lista');
        $this->unit->run(in_array($id_demitida, $ids_ativos), FALSE, 'Vínculo: Eletricista demitido NÃO DEVE aparecer na lista');

        $this->db->trans_rollback();
    }

    private function testar_get_all_com_subqueries() {
        $this->db->trans_start();

        // 1. Cria o Eletricista com CPF aleatório para evitar erro de duplicidade
        $this->EletricistasModel->insert([
            'nome' => 'Eletricista Master',
            'cpf' => '000' . rand(100000000, 999999999)
        ]);
        $idEletricista = $this->db->insert_id();

        // 2. Simula 2 Ordens de Serviço para ele
        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $idEletricista, 'status' => 'aberta']);
        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $idEletricista, 'status' => 'fechada']);

        // 3. Simula uma Meta para o mês ATUAL (que é o que a query da model exige)
        $mesAtual = date('Y-m');
        $this->db->insert('tabela_metas', [
            'eletricista_meta' => $idEletricista, 
            'mes_meta' => $mesAtual, 
            'vlr_meta' => 3500.50
        ]);

        // 4. Puxa a lista completa
        $lista = $this->EletricistasModel->get_all();

        // Encontra o nosso eletricista de teste no meio da lista retornada
        $meu_teste = null;
        foreach ($lista as $item) {
            if ((int)$item['id'] === $idEletricista) {
                $meu_teste = $item;
                break;
            }
        }

        // 5. Validações das subqueries
        $this->unit->run(is_array($meu_teste), TRUE, 'Query Complexa: O eletricista inserido deve constar no retorno de get_all()');
        
        if ($meu_teste) {
            $this->unit->run((int)$meu_teste['total_os'], 2, 'Subquery: O total de OS calculadas no SELECT deve bater com o banco (2)');
            $this->unit->run((float)$meu_teste['meta_atual'], 3500.50, 'Subquery: A meta do mês atual deve ser resgatada corretamente na query');
        }

        $this->db->trans_rollback();
    }

    private function testar_os_por_eletricista() {
        $this->db->trans_start();

        // Adicionado 'cpf' aleatório para satisfazer a constraint de unicidade
        $this->EletricistasModel->insert([
            'nome' => 'Carlos das OS',
            'cpf' => '000' . rand(100000000, 999999999) 
        ]);
        $id = $this->db->insert_id();

        // Insere 3 OS
        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $id]);
        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $id]);
        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $id]);

        $ordens = $this->EletricistasModel->get_os_by_eletricista($id);
        
        $this->unit->run(count($ordens), 3, 'Relação: get_os_by_eletricista deve retornar exatamente 3 registros');

        $this->db->trans_rollback();
    }

    private function testar_contar() {
        $this->db->trans_start();

        $antes = $this->EletricistasModel->contar();

        $this->EletricistasModel->insert(['nome' => 'Eletricista Contar 1', 'cpf' => '000' . rand(100000000, 999999999)]);
        $this->EletricistasModel->insert(['nome' => 'Eletricista Contar 2', 'cpf' => '000' . rand(100000000, 999999999)]);

        $depois = $this->EletricistasModel->contar();

        $this->unit->run($depois - $antes, 2, 'Contar: Deve refletir exatamente os 2 eletricistas inseridos');

        $this->db->trans_rollback();
    }

    private function testar_get_all_com_paginacao() {
        $this->db->trans_start();

        // Cria 3 eletricistas extras para garantir que há o que paginar
        for ($i = 0; $i < 3; $i++) {
            $this->EletricistasModel->insert([
                'nome' => 'Eletricista Paginado ' . $i,
                'cpf'  => '000' . rand(100000000, 999999999),
            ]);
        }

        $pagina = $this->EletricistasModel->get_all(2, 0);

        $this->unit->run(count($pagina), 2, 'GetAll: Com limite=2 deve retornar exatamente 2 registros');

        $paginaOffset = $this->EletricistasModel->get_all(2, 2);
        $this->unit->run(count($paginaOffset) <= 2, TRUE, 'GetAll: Com offset deve continuar respeitando o limite');

        // IDs da primeira página não devem se repetir na segunda (ordenação por e.id DESC)
        $idsPagina1 = array_column($pagina, 'id');
        $idsPagina2 = array_column($paginaOffset, 'id');
        $this->unit->run(count(array_intersect($idsPagina1, $idsPagina2)), 0, 'GetAll: Paginação não deve repetir registros entre páginas');

        $this->db->trans_rollback();
    }
}