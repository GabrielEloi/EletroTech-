<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Testes_Checklist extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->library('unit_test');
        $this->load->model('ChecklistModel');
    }

    public function index() {
        $this->unit->use_strict(TRUE);

        $this->testar_crud_checklist();
        $this->testar_normalizacao();
        $this->testar_fluxo_bloqueio_autorizacao();
        $this->testar_get_all_e_selected();
        $this->testar_select_default_e_clear();
        $this->testar_delete_checklist();
        $this->testar_finalizar_bloquear_e_sem_status();
        $this->testar_get_bloqueados_e_listar_eletricistas();

        echo "<div style='font-family: Arial; padding: 20px;'>";
        echo "<h2>Relatório de Testes: ChecklistModel</h2>";
        echo $this->unit->report();
        echo "</div>";
    }

    private function testar_crud_checklist() {
        $this->db->trans_start();

        $dados = ['titulo' => 'Checklist Teste', 'tipo' => 'inicio', 'selecionado' => 0];
        $perguntas = [
            ['texto' => 'Pergunta 1', 'tipo_resposta' => 'radio'],
            'Pergunta 2' // Testando o formato string simples também
        ];

        $id = $this->ChecklistModel->insert_checklist($dados, $perguntas);
        
        $this->unit->run($id > 0, TRUE, 'CRUD: Deve inserir checklist com sucesso');

        $lista_perguntas = $this->ChecklistModel->get_perguntas($id);
        $this->unit->run(count($lista_perguntas), 2, 'CRUD: Deve carregar exatamente 2 perguntas');

        $this->db->trans_rollback();
    }

    private function testar_normalizacao() {
        $input = "Água, Ção, Ênfase";
        $esperado = "agua, cao, enfase";
        
        $resultado = $this->ChecklistModel->normalizar_resposta($input);
        
        $this->unit->run($resultado, $esperado, 'Utils: Normalizar deve remover acentos e converter para minusculo');
    }

    private function testar_fluxo_bloqueio_autorizacao() {
        $this->db->trans_start();

        // 1. Setup: Eletricista e OS
        $this->db->insert('tabela_eletricistas', [
            'nome' => 'Eletricista Teste', 
            'cpf' => '000' . rand(100000000, 999999999)
        ]);
        $idE = $this->db->insert_id();
        
        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $idE, 'status' => 'aberta']);
        $idOs = $this->db->insert_id();

        // 2. Simula bloqueio (checklist de início falhou)
        $this->ChecklistModel->registrar_bloqueio($idOs, 'inicio');
        
        $status = $this->ChecklistModel->get_status_by_os_tipo($idOs, 'inicio');
        $this->unit->run((int)$status['bloqueado'], 1, 'Fluxo: OS deve estar bloqueada após registrar_bloqueio');

        // 3. Simula autorização (admin liberando)
        $autorizado = $this->ChecklistModel->finalizar_checklist($idOs, 'inicio', 'Tudo ok', 'autorizar');
        $this->unit->run($autorizado, TRUE, 'Fluxo: A liberação deve retornar true');

        // 4. Verifica se o status mudou
        $status_atualizado = $this->ChecklistModel->get_status_by_os_tipo($idOs, 'inicio');
        $this->unit->run((int)$status_atualizado['bloqueado'], 0, 'Fluxo: Bloqueado deve ser 0 após autorização');

        $this->db->trans_rollback();
    }
    private function testar_get_all_e_selected() {
        $this->db->trans_start();

        $dados = ['titulo' => 'Checklist GetAll', 'tipo' => 'fim', 'selecionado' => 0];
        $perguntas = ['Pergunta A', 'Pergunta B', 'Pergunta C'];
        $id = $this->ChecklistModel->insert_checklist($dados, $perguntas);

        $lista = $this->ChecklistModel->get_all();
        $encontrado = array_values(array_filter($lista, fn($c) => (int)$c['id'] === (int)$id));

        $this->unit->run(count($encontrado) > 0, TRUE, 'GetAll: Deve incluir o checklist criado');
        $this->unit->run((int)$encontrado[0]['total_perguntas'], 3, 'GetAll: Deve contar corretamente as perguntas via join');

        // Nenhum selecionado ainda
        $nenhumSelecionado = $this->ChecklistModel->get_selected_by_type('fim');
        $this->unit->run($nenhumSelecionado, NULL, 'GetSelected: Sem checklist selecionado deve retornar null');

        $this->db->trans_rollback();
    }

    private function testar_select_default_e_clear() {
        $this->db->trans_start();

        $idA = $this->ChecklistModel->insert_checklist(['titulo' => 'Checklist A', 'tipo' => 'inicio', 'selecionado' => 1], ['P1']);
        $idB = $this->ChecklistModel->insert_checklist(['titulo' => 'Checklist B', 'tipo' => 'inicio', 'selecionado' => 0], ['P1']);

        $ok = $this->ChecklistModel->select_default($idB, 'inicio');
        $this->unit->run($ok, TRUE, 'SelectDefault: Deve retornar true ao trocar o selecionado');

        $selecionado = $this->ChecklistModel->get_selected_by_type('inicio');
        $this->unit->run((int)$selecionado['id'], (int)$idB, 'SelectDefault: O novo checklist deve ser o selecionado');
        $this->unit->run(count($selecionado['perguntas']), 1, 'GetSelectedByType: Deve trazer as perguntas embutidas');

        $this->db->trans_rollback();
    }

    private function testar_delete_checklist() {
        $this->db->trans_start();

        $id = $this->ChecklistModel->insert_checklist(['titulo' => 'Checklist Delete', 'tipo' => 'inicio', 'selecionado' => 0], ['P1']);

        $deletou = $this->ChecklistModel->delete_checklist($id);
        $lista = $this->ChecklistModel->get_all();
        $ainda_existe = array_filter($lista, fn($c) => (int)$c['id'] === (int)$id);

        $this->unit->run($deletou, TRUE, 'Delete: Deve retornar true ao deletar');
        $this->unit->run(count($ainda_existe), 0, 'Delete: Checklist não pode mais aparecer em get_all');

        $this->db->trans_rollback();
    }

    private function testar_finalizar_bloquear_e_sem_status() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Bloqueio', 'cpf' => '111' . rand(100000000, 999999999)]);
        $idE = $this->db->insert_id();

        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $idE, 'status' => 'aberta']);
        $idOs = $this->db->insert_id();

        // Sem status registrado ainda: deve falhar
        $semStatus = $this->ChecklistModel->finalizar_checklist($idOs, 'inicio', 'obs', 'autorizar');
        $this->unit->run($semStatus, FALSE, 'Finalizar: Sem bloqueio registrado deve retornar false');

        $this->ChecklistModel->registrar_bloqueio($idOs, 'inicio');
        $bloqueou = $this->ChecklistModel->finalizar_checklist($idOs, 'inicio', 'Não passou', 'bloquear');

        $status = $this->ChecklistModel->get_status_by_os_tipo($idOs, 'inicio');
        $os = $this->db->get_where('tabela_ordens_servico', ['id' => $idOs])->row_array();

        $this->unit->run($bloqueou, TRUE, 'Finalizar: Ação bloquear deve retornar true');
        $this->unit->run((int)$status['bloqueado'], 1, 'Finalizar: Deve continuar bloqueado após ação bloquear');
        $this->unit->run($status['observacao'], 'Não passou', 'Finalizar: Deve gravar a observação do bloqueio');
        $this->unit->run($os['status'], 'bloqueada', 'Finalizar: Status da OS deve virar bloqueada');

        $this->db->trans_rollback();
    }

    private function testar_get_bloqueados_e_listar_eletricistas() {
        $this->db->trans_start();

        $this->db->insert('tabela_eletricistas', ['nome' => 'Eletricista Lista', 'cpf' => '222' . rand(100000000, 999999999)]);
        $idE = $this->db->insert_id();

        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $idE, 'status' => 'aberta']);
        $idOs = $this->db->insert_id();

        $this->ChecklistModel->registrar_bloqueio($idOs, 'inicio');

        $bloqueados = $this->ChecklistModel->get_bloqueados('inicio', $idE);
        $encontrado = array_filter($bloqueados, fn($b) => (int)$b['id_os'] === (int)$idOs);

        $this->unit->run(count($encontrado) > 0, TRUE, 'GetBloqueados: Deve encontrar a OS bloqueada filtrando por tipo e eletricista');

        $eletricistas = $this->ChecklistModel->listarEletricistas();
        $achouEletricista = array_filter($eletricistas, fn($e) => (int)$e['id'] === (int)$idE);
        $this->unit->run(count($achouEletricista) > 0, TRUE, 'ListarEletricistas: Deve incluir o eletricista criado');

        $this->db->trans_rollback();
    }
}