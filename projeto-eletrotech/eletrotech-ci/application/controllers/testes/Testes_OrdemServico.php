<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Testes_OrdemServico extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->library('unit_test');
        $this->load->model('OrdemServicoModel');
    }

    public function index() {
        $this->unit->use_strict(TRUE);

        $this->testar_fluxo_completo_os();
        $this->testar_bloqueio_estoque_insuficiente();
        $this->testar_contadores_por_eletricista();
        $this->testar_consultas_simples();
        $this->testar_contadores_gerais();
        $this->testar_get_all_e_get_all_by_eletricista();
        $this->testar_materiais_checklist_comentarios();
        $this->testar_abrir_os_bloqueado_e_com_respostas();
        $this->testar_fechar_os_bloqueado_e_status_invalido();
        $this->testar_totais_abertas_fechadas_por_eletricista();

        echo "<div style='font-family: Arial; padding: 20px;'>";
        echo "<h2>Relatório de Testes: OrdemServicoModel</h2>";
        echo $this->unit->report();
        echo "</div>";
    }

    private function testar_fluxo_completo_os() {
        $this->db->trans_start();

        // 1. Setup: Eletricista e Produto
        $this->db->insert('tabela_eletricistas', [
            'nome' => 'Eletricista Teste OS', 
            'cpf' => '000' . rand(100000000, 999999999)
        ]);
        $idEletricista = $this->db->insert_id();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Cabo Teste', 'qtd_estoque' => 10, 'vlr_unitario' => 5.0]);
        $idProd = $this->db->insert_id();

        // 2. Solicitar
        $idOs = $this->OrdemServicoModel->solicitar_os($idEletricista, date('Y-m-d'));
        $this->unit->run($idOs > 0, TRUE, 'Ciclo: Deve solicitar a OS com sucesso');

        // 3. Abrir (Baixa de Estoque)
        $produtos = [['id' => $idProd, 'qtd' => 2]];
        $abriu = $this->OrdemServicoModel->abrir_os($idOs, $produtos);
        $this->unit->run($abriu, TRUE, 'Ciclo: Deve abrir a OS e baixar estoque');

        // Verifica estoque baixado (10 - 2 = 8)
        $prod = $this->db->get_where('tabela_produtos', ['id' => $idProd])->row_array();
        $this->unit->run((int)$prod['qtd_estoque'], 8, 'Estoque: Estoque deve ser 8 após abertura');

        // 4. Fechar
        $fechou = $this->OrdemServicoModel->fechar_os($idOs, []);
        $this->unit->run($fechou, TRUE, 'Ciclo: Deve fechar a OS com sucesso');

        $this->db->trans_rollback();
    }

    private function testar_bloqueio_estoque_insuficiente() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Teste 2', 'cpf' => '000' . rand(100000000, 999999999)]);
        $idEletricista = $this->db->insert_id();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Produto Raro', 'qtd_estoque' => 1, 'vlr_unitario' => 10]);
        $idProd = $this->db->insert_id();

        $idOs = $this->OrdemServicoModel->solicitar_os($idEletricista, date('Y-m-d'));

        // Tenta gastar 5 (tem apenas 1)
        $produtos = [['id' => $idProd, 'qtd' => 5]];
        $abriu = $this->OrdemServicoModel->abrir_os($idOs, $produtos);

        $this->unit->run($abriu, FALSE, 'Validação: Não deve permitir abrir OS com estoque insuficiente');
        
        $this->db->trans_rollback();
    }

    private function testar_contadores_por_eletricista() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Contador', 'cpf' => '000' . rand(100000000, 999999999)]);
        $id = $this->db->insert_id();

        // Insere 2 solicitadas
        $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));
        $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));

        $total = $this->OrdemServicoModel->totalSolicitadasPorEletricista($id);
        $this->unit->run($total, 2, 'Contador: Deve contar exatamente 2 OS solicitadas');

        $this->db->trans_rollback();
    }
    private function testar_consultas_simples() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Consulta', 'cpf' => '000' . rand(100000000, 999999999), 'data_demissao' => null]);
        $idEletricista = $this->db->insert_id();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Produto Disponivel', 'qtd_estoque' => 5, 'vlr_unitario' => 10]);
        $idProdDisponivel = $this->db->insert_id();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Produto Zerado', 'qtd_estoque' => 0, 'vlr_unitario' => 10]);
        $idProdZerado = $this->db->insert_id();

        $idOs = $this->OrdemServicoModel->solicitar_os($idEletricista, date('Y-m-d'));

        // get_by_id
        $os = $this->OrdemServicoModel->get_by_id($idOs);
        $this->unit->run($os['nome_eletricista'], 'Eletricista Consulta', 'GetById: Deve trazer o nome do eletricista via join');
        $this->unit->run($os['status'], 'solicitada', 'GetById: Status inicial deve ser solicitada');

        // get_eletricistas_ativos
        $ativos = $this->OrdemServicoModel->get_eletricistas_ativos();
        $ids = array_column($ativos, 'id');
        $this->unit->run(in_array($idEletricista, $ids), TRUE, 'EletricistasAtivos: Deve incluir o eletricista ativo criado');

        // get_produtos_disponiveis
        $disponiveis = $this->OrdemServicoModel->get_produtos_disponiveis();
        $idsDisp = array_column($disponiveis, 'id');
        $this->unit->run(in_array($idProdDisponivel, $idsDisp), TRUE, 'ProdutosDisponiveis: Produto com estoque deve aparecer');
        $this->unit->run(in_array($idProdZerado, $idsDisp), FALSE, 'ProdutosDisponiveis: Produto zerado NÃO deve aparecer');

        $this->db->trans_rollback();
    }

    private function testar_contadores_gerais() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Geral', 'cpf' => '000' . rand(100000000, 999999999)]);
        $id = $this->db->insert_id();

        $antesTotal = $this->OrdemServicoModel->contar();
        $antesPorEletricista = $this->OrdemServicoModel->contar_por_eletricista($id);

        $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));
        $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));

        $this->unit->run($this->OrdemServicoModel->contar() - $antesTotal, 2, 'Contar: Deve refletir as 2 OS criadas');
        $this->unit->run($this->OrdemServicoModel->contar_por_eletricista($id) - $antesPorEletricista, 2, 'ContarPorEletricista: Deve contar só as OS desse eletricista');
        $this->unit->run($this->OrdemServicoModel->totalPorEletricista($id), 2, 'TotalPorEletricista: Deve bater com o total geral do eletricista');

        $this->db->trans_rollback();
    }

    private function testar_get_all_e_get_all_by_eletricista() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Lista OS', 'cpf' => '000' . rand(100000000, 999999999)]);
        $id = $this->db->insert_id();

        $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));
        $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));
        $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));

        $lista = $this->OrdemServicoModel->get_all_by_eletricista($id);
        $this->unit->run(count($lista), 3, 'GetAllByEletricista: Deve trazer as 3 OS do eletricista');

        $paginado = $this->OrdemServicoModel->get_all_by_eletricista($id, 2, 0);
        $this->unit->run(count($paginado), 2, 'GetAllByEletricista: Paginação deve limitar a 2 registros');

        $geral = $this->OrdemServicoModel->get_all(2, 0);
        $this->unit->run(count($geral), 2, 'GetAll: Paginação geral deve limitar a 2 registros');

        $ultimas = $this->OrdemServicoModel->ultimasOSs($id, 2);
        $this->unit->run(count($ultimas), 2, 'UltimasOSs: Deve respeitar o limite informado');

        $this->db->trans_rollback();
    }

    private function testar_materiais_checklist_comentarios() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Materiais', 'cpf' => '000' . rand(100000000, 999999999)]);
        $idEletricista = $this->db->insert_id();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Materiais', 'qtd_estoque' => 10, 'vlr_unitario' => 8]);
        $idProd = $this->db->insert_id();

        $idOs = $this->OrdemServicoModel->solicitar_os($idEletricista, date('Y-m-d'));
        $this->OrdemServicoModel->abrir_os($idOs, [['id' => $idProd, 'qtd' => 3]]);

        $materiais = $this->OrdemServicoModel->get_materiais_by_os($idOs);
        $this->unit->run(count($materiais), 1, 'MateriaisByOs: Deve trazer o material utilizado na abertura');
        $this->unit->run((int)$materiais[0]['qtd_utilizada'], 3, 'MateriaisByOs: Quantidade utilizada deve bater');

        // Comentário
        $adicionou = $this->OrdemServicoModel->add_comentario($idOs, 'Comentário de teste');
        $falhaComentario = $this->OrdemServicoModel->add_comentario(999999999, 'Comentário órfão');

        $this->unit->run($adicionou, TRUE, 'AddComentario: Deve inserir comentário em OS existente');
        $this->unit->run($falhaComentario, FALSE, 'AddComentario: Deve recusar comentário em OS inexistente');

        $comentarios = $this->OrdemServicoModel->get_comentarios_by_os($idOs);
        $this->unit->run(count($comentarios), 1, 'ComentariosByOs: Deve listar o comentário inserido');

        $this->db->trans_rollback();
    }

    private function testar_abrir_os_bloqueado_e_com_respostas() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Bloqueio Abertura', 'cpf' => '000' . rand(100000000, 999999999)]);
        $idEletricista = $this->db->insert_id();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Bloqueio', 'qtd_estoque' => 10, 'vlr_unitario' => 5]);
        $idProd = $this->db->insert_id();

        $idOs = $this->OrdemServicoModel->solicitar_os($idEletricista, date('Y-m-d'));

        // Abre já bloqueada (checklist de início reprovado)
        $abriu = $this->OrdemServicoModel->abrir_os($idOs, [['id' => $idProd, 'qtd' => 1]], [], true);
        $os = $this->OrdemServicoModel->get_by_id($idOs);

        $this->unit->run($abriu, TRUE, 'AbrirOs Bloqueado: Deve conseguir abrir mesmo bloqueada');
        $this->unit->run($os['status'], 'bloqueada', 'AbrirOs Bloqueado: Status deve ficar como bloqueada');

        // Tentar abrir de novo (não está mais em 'solicitada') deve falhar
        $tentativaDupla = $this->OrdemServicoModel->abrir_os($idOs, [['id' => $idProd, 'qtd' => 1]]);
        $this->unit->run($tentativaDupla, FALSE, 'AbrirOs: Não pode reabrir OS que não está em solicitada');

        $this->db->trans_rollback();
    }

    private function testar_fechar_os_bloqueado_e_status_invalido() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Fechamento', 'cpf' => '000' . rand(100000000, 999999999)]);
        $idEletricista = $this->db->insert_id();

        $idOs = $this->OrdemServicoModel->solicitar_os($idEletricista, date('Y-m-d'));

        // Ainda em 'solicitada': fechar_os deve falhar
        $falhaStatusInvalido = $this->OrdemServicoModel->fechar_os($idOs, []);
        $this->unit->run($falhaStatusInvalido, FALSE, 'FecharOs: Não pode fechar OS em status solicitada');

        $this->OrdemServicoModel->abrir_os($idOs, []);

        // Fecha bloqueada (checklist de fim reprovado)
        $fechouBloqueada = $this->OrdemServicoModel->fechar_os($idOs, [], true);
        $os = $this->OrdemServicoModel->get_by_id($idOs);

        $this->unit->run($fechouBloqueada, TRUE, 'FecharOs Bloqueado: Deve conseguir fechar como bloqueada');
        $this->unit->run($os['status'], 'bloqueada', 'FecharOs Bloqueado: Status deve continuar/virar bloqueada');
        $this->unit->run($os['data_fechamento'], NULL, 'FecharOs Bloqueado: data_fechamento não deve ser preenchida');

        $this->db->trans_rollback();
    }

    private function testar_totais_abertas_fechadas_por_eletricista() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Totais Status', 'cpf' => '000' . rand(100000000, 999999999)]);
        $id = $this->db->insert_id();

        $idOs1 = $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));
        $this->OrdemServicoModel->abrir_os($idOs1, []);

        $idOs2 = $this->OrdemServicoModel->solicitar_os($id, date('Y-m-d'));
        $this->OrdemServicoModel->abrir_os($idOs2, []);
        $this->OrdemServicoModel->fechar_os($idOs2, []);

        $this->unit->run($this->OrdemServicoModel->totalAbertasPorEletricista($id), 1, 'TotalAbertas: Deve contar apenas a OS aberta');
        $this->unit->run($this->OrdemServicoModel->totalFechadasPorEletricista($id), 1, 'TotalFechadas: Deve contar apenas a OS fechada');

        $this->db->trans_rollback();
    }
}