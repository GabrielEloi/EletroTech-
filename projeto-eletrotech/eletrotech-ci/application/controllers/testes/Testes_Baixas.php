<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Testes_Baixas extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->library('unit_test');
        $this->load->model('BaixasModel');
    }

    public function index() {
        $this->unit->use_strict(TRUE);

        $this->testar_filtros_e_consulta();
        $this->testar_calculo_totais();
        $this->testar_detalhe_com_joins();
        $this->testar_lancamento_entrada();
        $this->testar_lancamento_saida();
        $this->testar_saida_sem_saldo();
        $this->testar_abrir_rascunho();
        $this->testar_itens_nao_mexem_no_estoque();
        $this->testar_finalizar_baixa();
        $this->testar_finalizar_sem_itens();
        $this->testar_cancelar_baixa();
        $this->testar_finalizar_e_tudo_ou_nada();
        $this->testar_consultar_por_ids();
        $this->testar_produtos_lista_e_lancamento();
        $this->testar_produto_por_id();

        echo "<div style='font-family: Arial; padding: 20px;'>";
        echo "<h2>Relatório de Testes: BaixasModel</h2>";
        echo $this->unit->report();
        echo "</div>";
    }

    private function testar_filtros_e_consulta() {
        $this->db->trans_start();

        // 1. Cria um produto e uma movimentação
        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Teste Baixa']);
        $idProd = $this->db->insert_id();

        $this->db->insert('tabela_movimentacoes', [
            'id_produto' => $idProd,
            'tipo' => 'entrada',
            'quantidade' => 10,
            'valor_unitario' => 5.00,
            'data_mov' => '2026-07-27',
            'origem' => 'Teste'
        ]);

        // 2. Testa filtro por tipo
        $filtros = ['tipo' => 'entrada', 'id_produto' => $idProd];
        $lista = $this->BaixasModel->consultar($filtros);
        
        $this->unit->run(count($lista), 1, 'Consultar: Deve encontrar a movimentação com os filtros aplicados');
        $this->unit->run((float)$lista[0]['valor_total'], 50.0, 'Consultar: Cálculo do valor total (qtd * vlr) deve ser 50.0');

        $this->db->trans_rollback();
    }

    private function testar_calculo_totais() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod T']);
        $idProd = $this->db->insert_id();

        // Insere Entrada (10 * 10 = 100)
        $this->db->insert('tabela_movimentacoes', ['id_produto' => $idProd, 'tipo' => 'entrada', 'quantidade' => 10, 'valor_unitario' => 10, 'data_mov' => date('Y-m-d')]);
        // Insere Saída (5 * 4 = 20)
        $this->db->insert('tabela_movimentacoes', ['id_produto' => $idProd, 'tipo' => 'saida', 'quantidade' => 5, 'valor_unitario' => 4, 'data_mov' => date('Y-m-d')]);

        // Filtra pelo produto do teste: sem filtro, totais() soma a tabela
        // inteira e o resultado depende dos dados que já existem no banco.
        $totais = $this->BaixasModel->totais(['id_produto' => $idProd]);

        $this->unit->run((float)$totais['total_entrada'], 100.0, 'Totais: Soma de entradas deve ser 100.0');
        $this->unit->run((float)$totais['total_saida'], 20.0, 'Totais: Soma de saídas deve ser 20.0');

        $this->db->trans_rollback();
    }

    private function testar_detalhe_com_joins() {
        $this->db->trans_start();

        // 1. Cria cenário completo: Produto -> OS -> Eletricista -> Movimentação
        // Usando CPF aleatório para evitar conflito de duplicidade no banco
        $this->db->insert('tabela_eletricistas', [
            'nome' => 'João Teste', 
            'cpf' => '123' . rand(100000000, 999999999) 
        ]);
        $idEletricista = $this->db->insert_id();

        $this->db->insert('tabela_ordens_servico', ['eletricista_os' => $idEletricista, 'status' => 'fechada']);
        $idOs = $this->db->insert_id();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Cabo Teste', 'vlr_unitario' => 10, 'qtd_estoque' => 10]);
        $idProd = $this->db->insert_id();

        $this->db->insert('tabela_movimentacoes', [
            'id_produto' => $idProd, 
            'id_os' => $idOs, 
            'tipo' => 'saida', 
            'quantidade' => 1, 
            'valor_unitario' => 10,
            'data_mov' => date('Y-m-d')
        ]);
        $idMov = $this->db->insert_id();

        // 2. Testa se o detalhe busca tudo (Joins)
        $detalhe = $this->BaixasModel->detalhe($idMov);

        $this->unit->run($detalhe['nome_produto'], 'Cabo Teste', 'Detalhe: Deve carregar o nome do produto via Join');
        $this->unit->run($detalhe['nome_eletricista'], 'João Teste', 'Detalhe: Deve carregar o nome do eletricista da OS via Join');

        $this->db->trans_rollback();
    }

    private function testar_lancamento_entrada() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Entrada', 'vlr_unitario' => 10, 'qtd_estoque' => 5]);
        $idProd = $this->db->insert_id();

        $this->db->insert('tabela_usuarios', ['usuario' => 'teste' . rand(100000, 999999), 'senha' => 'x']);
        $idUsuario = $this->db->insert_id();

        $resultado = $this->BaixasModel->lancar('entrada', [
            'id_produto'     => $idProd,
            'quantidade'     => 7,
            'valor_unitario' => 12.50,
            'data_mov'       => date('Y-m-d'),
            'origem'         => 'Entrada manual - Compra NF 1234',
            'id_usuario'     => $idUsuario,
        ]);

        $produto = $this->db->get_where('tabela_produtos', ['id' => $idProd])->row_array();
        $mov = $this->db->order_by('id', 'DESC')->get_where('tabela_movimentacoes', ['id_produto' => $idProd])->row_array();

        $this->unit->run($resultado, 'ok', 'Entrada: Lançamento válido deve retornar ok');
        $this->unit->run((int)$produto['qtd_estoque'], 12, 'Entrada: Estoque deve subir de 5 para 12');
        $this->unit->run($mov['tipo'], 'entrada', 'Entrada: Movimentação gravada deve ser do tipo entrada');
        $this->unit->run($mov['origem'], 'Entrada manual - Compra NF 1234', 'Entrada: Origem deve guardar o motivo informado');
        $this->unit->run((int)$mov['id_usuario'], $idUsuario, 'Entrada: Deve registrar o usuário que fez o lançamento');

        $this->db->trans_rollback();
    }

    private function testar_lancamento_saida() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Saida', 'vlr_unitario' => 10, 'qtd_estoque' => 10]);
        $idProd = $this->db->insert_id();

        $resultado = $this->BaixasModel->lancar('saida', [
            'id_produto'     => $idProd,
            'quantidade'     => 4,
            'valor_unitario' => 10,
            'data_mov'       => date('Y-m-d'),
            'origem'         => 'Saída manual - Perda / Avaria',
            'id_usuario'     => null,
        ]);

        $produto = $this->db->get_where('tabela_produtos', ['id' => $idProd])->row_array();

        $this->unit->run($resultado, 'ok', 'Saída: Lançamento dentro do saldo deve retornar ok');
        $this->unit->run((int)$produto['qtd_estoque'], 6, 'Saída: Estoque deve cair de 10 para 6');
        $this->unit->run($this->BaixasModel->contar(['id_produto' => $idProd, 'tipo' => 'saida']), 1, 'Saída: Deve gravar uma movimentação de saída');

        $this->db->trans_rollback();
    }

    private function testar_saida_sem_saldo() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Sem Saldo', 'vlr_unitario' => 10, 'qtd_estoque' => 2]);
        $idProd = $this->db->insert_id();

        // Pede mais do que existe: o UPDATE condicional não casa e nada é gravado.
        $resultado = $this->BaixasModel->lancar('saida', [
            'id_produto'     => $idProd,
            'quantidade'     => 5,
            'valor_unitario' => 10,
            'data_mov'       => date('Y-m-d'),
            'origem'         => 'Saída manual - Uso interno',
            'id_usuario'     => null,
        ]);

        $produto = $this->db->get_where('tabela_produtos', ['id' => $idProd])->row_array();

        $this->unit->run($resultado, 'estoque_insuficiente', 'Sem saldo: Deve avisar que o estoque é insuficiente');
        $this->unit->run((int)$produto['qtd_estoque'], 2, 'Sem saldo: Estoque não pode ser alterado');
        $this->unit->run($this->BaixasModel->contar(['id_produto' => $idProd]), 0, 'Sem saldo: Nenhuma movimentação pode ser gravada');

        $this->db->trans_rollback();
    }

    private function criar_usuario_teste() {
        $this->db->insert('tabela_usuarios', ['usuario' => 'teste' . rand(100000, 999999), 'senha' => 'x']);
        return (int) $this->db->insert_id();
    }

    private function criar_eletricista_teste() {
        $this->db->insert('tabela_eletricistas', [
            'nome' => 'Eletricista Baixa',
            'cpf'  => '456' . rand(100000000, 999999999),
            'data_contratacao' => date('Y-m-d'),
        ]);
        return (int) $this->db->insert_id();
    }

    private function abrir_baixa_teste($tipo, $idUsuario, $idEletricista = null) {
        return $this->BaixasModel->abrir_baixa([
            'tipo'           => $tipo,
            'data_baixa'     => date('Y-m-d'),
            'id_eletricista' => $idEletricista ?: $this->criar_eletricista_teste(),
            'observacao'     => 'Baixa de teste automatizado',
            'id_usuario'     => $idUsuario,
        ]);
    }

    private function testar_abrir_rascunho() {
        $this->db->trans_start();

        $idUsuario = $this->criar_usuario_teste();
        $idBaixa   = $this->abrir_baixa_teste('entrada', $idUsuario);

        $baixa    = $this->BaixasModel->baixa_por_id($idBaixa);
        $rascunho = $this->BaixasModel->rascunho_aberto($idUsuario, 'entrada');

        $this->unit->run($baixa['status'], 'rascunho', 'Abrir: Baixa nova deve nascer em rascunho');
        $this->unit->run($baixa['nome_eletricista'], 'Eletricista Baixa', 'Abrir: Deve trazer o nome do eletricista solicitante via Join');
        $this->unit->run((int)$rascunho['id'], (int)$idBaixa, 'Abrir: rascunho_aberto deve reencontrar a baixa do usuário');

        $this->unit->run($this->BaixasModel->rascunho_aberto($idUsuario, 'saida'), NULL, 'Abrir: Rascunho de entrada não vaza para a aba de saída');

        $this->db->trans_rollback();
    }

    private function testar_itens_nao_mexem_no_estoque() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Rascunho', 'vlr_unitario' => 10, 'qtd_estoque' => 50]);
        $idProd = $this->db->insert_id();

        $idUsuario = $this->criar_usuario_teste();
        $idBaixa   = $this->abrir_baixa_teste('saida', $idUsuario);

        $this->BaixasModel->incluir_item($idBaixa, ['id_produto' => $idProd, 'quantidade' => 8, 'valor_unitario' => 10]);
        $this->BaixasModel->incluir_item($idBaixa, ['id_produto' => $idProd, 'quantidade' => 2, 'valor_unitario' => 10]);

        $itens   = $this->BaixasModel->itens_da_baixa($idBaixa);
        $produto = $this->db->get_where('tabela_produtos', ['id' => $idProd])->row_array();

        $this->unit->run(count($itens), 2, 'Rascunho: Deve guardar os dois materiais incluídos');
        $this->unit->run((int)$produto['qtd_estoque'], 50, 'Rascunho: Incluir material NÃO pode mexer no estoque');
        $this->unit->run($this->BaixasModel->contar(['id_produto' => $idProd]), 0, 'Rascunho: Incluir material NÃO pode gravar no ledger');

        $this->BaixasModel->remover_item($idBaixa, $itens[0]['id']);
        $this->unit->run(count($this->BaixasModel->itens_da_baixa($idBaixa)), 1, 'Rascunho: Retirar material deve deixar só o outro');

        $this->db->trans_rollback();
    }

    private function testar_finalizar_baixa() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Fin A', 'vlr_unitario' => 10, 'qtd_estoque' => 100]);
        $idProdA = $this->db->insert_id();
        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Fin B', 'vlr_unitario' => 5, 'qtd_estoque' => 100]);
        $idProdB = $this->db->insert_id();

        $idUsuario = $this->criar_usuario_teste();
        $idBaixa   = $this->abrir_baixa_teste('saida', $idUsuario);

        $this->BaixasModel->incluir_item($idBaixa, ['id_produto' => $idProdA, 'quantidade' => 30, 'valor_unitario' => 10]);
        $this->BaixasModel->incluir_item($idBaixa, ['id_produto' => $idProdB, 'quantidade' => 20, 'valor_unitario' => 5]);

        $retorno = $this->BaixasModel->finalizar_baixa($idBaixa, $idUsuario);

        $baixa   = $this->BaixasModel->baixa_por_id($idBaixa);
        $produtoA = $this->db->get_where('tabela_produtos', ['id' => $idProdA])->row_array();
        $produtoB = $this->db->get_where('tabela_produtos', ['id' => $idProdB])->row_array();
        $movs    = $this->BaixasModel->movimentacoes_da_baixa($idBaixa);

        $this->unit->run($retorno['resultado'], 'ok', 'Finalizar: Baixa com saldo deve retornar ok');
        $this->unit->run($baixa['status'], 'finalizada', 'Finalizar: Documento deve ficar como finalizada');
        $this->unit->run((int)$produtoA['qtd_estoque'], 70, 'Finalizar: Estoque do material A deve cair de 100 para 70');
        $this->unit->run((int)$produtoB['qtd_estoque'], 80, 'Finalizar: Estoque do material B deve cair de 100 para 80');
        $this->unit->run(count($movs), 2, 'Finalizar: Deve gravar uma movimentação por material');

        $this->db->trans_rollback();
    }

    private function testar_finalizar_sem_itens() {
        $this->db->trans_start();

        $idUsuario = $this->criar_usuario_teste();
        $idBaixa   = $this->abrir_baixa_teste('entrada', $idUsuario);

        $retorno = $this->BaixasModel->finalizar_baixa($idBaixa, $idUsuario);
        $baixa   = $this->BaixasModel->baixa_por_id($idBaixa);

        $this->unit->run($retorno['resultado'], 'sem_itens', 'Finalizar vazia: Deve recusar baixa sem nenhum material');
        $this->unit->run($baixa['status'], 'rascunho', 'Finalizar vazia: Documento deve continuar em rascunho');

        $this->db->trans_rollback();
    }

    private function testar_cancelar_baixa() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Cancel', 'vlr_unitario' => 10, 'qtd_estoque' => 40]);
        $idProd = $this->db->insert_id();

        $idUsuario = $this->criar_usuario_teste();
        $idBaixa   = $this->abrir_baixa_teste('saida', $idUsuario);
        $this->BaixasModel->incluir_item($idBaixa, ['id_produto' => $idProd, 'quantidade' => 10, 'valor_unitario' => 10]);

        $cancelou = $this->BaixasModel->cancelar_baixa($idBaixa);

        $baixa   = $this->BaixasModel->baixa_por_id($idBaixa);
        $produto = $this->db->get_where('tabela_produtos', ['id' => $idProd])->row_array();

        $this->unit->run($cancelou, TRUE, 'Cancelar: Deve conseguir cancelar um rascunho');
        $this->unit->run($baixa['status'], 'cancelada', 'Cancelar: Documento deve ficar como cancelada');
        $this->unit->run((int)$produto['qtd_estoque'], 40, 'Cancelar: Estoque não pode ser alterado');
        $this->unit->run(count($this->BaixasModel->itens_da_baixa($idBaixa)), 0, 'Cancelar: Materiais do rascunho devem ser descartados');

        $retorno = $this->BaixasModel->finalizar_baixa($idBaixa, $idUsuario);
        $this->unit->run($retorno['resultado'], 'erro', 'Cancelar: Baixa cancelada não pode mais ser finalizada');

        $this->db->trans_rollback();
    }

    // Sem trans_start() de propósito: transação aninhada só decrementa a
    // profundidade, então o rollback do finalizar_baixa() não seria exercido
    // de verdade aqui dentro. Por isso a limpeza no fim é manual.
    private function testar_finalizar_e_tudo_ou_nada() {
        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Atomico OK', 'vlr_unitario' => 10, 'qtd_estoque' => 100]);
        $idProdOk = $this->db->insert_id();
        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Atomico Falta', 'vlr_unitario' => 10, 'qtd_estoque' => 3]);
        $idProdFalta = $this->db->insert_id();

        $idUsuario     = $this->criar_usuario_teste();
        $idEletricista = $this->criar_eletricista_teste();
        $idBaixa       = $this->abrir_baixa_teste('saida', $idUsuario, $idEletricista);

        $this->BaixasModel->incluir_item($idBaixa, ['id_produto' => $idProdOk, 'quantidade' => 10, 'valor_unitario' => 10]);
        $this->BaixasModel->incluir_item($idBaixa, ['id_produto' => $idProdFalta, 'quantidade' => 99, 'valor_unitario' => 10]);

        $retorno = $this->BaixasModel->finalizar_baixa($idBaixa, $idUsuario);

        $produtoOk = $this->db->get_where('tabela_produtos', ['id' => $idProdOk])->row_array();
        $baixa     = $this->BaixasModel->baixa_por_id($idBaixa);

        $this->unit->run($retorno['resultado'], 'estoque_insuficiente', 'Tudo ou nada: Deve avisar que faltou estoque');
        $this->unit->run($retorno['produto'], 'Prod Atomico Falta', 'Tudo ou nada: Deve dizer QUAL material travou o fechamento');
        $this->unit->run((int)$produtoOk['qtd_estoque'], 100, 'Tudo ou nada: O material que cabia também NÃO pode ser baixado');
        $this->unit->run(count($this->BaixasModel->movimentacoes_da_baixa($idBaixa)), 0, 'Tudo ou nada: Nenhuma movimentação pode sobrar no ledger');
        $this->unit->run($baixa['status'], 'rascunho', 'Tudo ou nada: Documento deve continuar em rascunho');

        $this->db->where('id_baixa', $idBaixa)->delete('tabela_movimentacoes');
        $this->db->where('id_baixa', $idBaixa)->delete('tabela_baixa_itens');
        $this->db->where('id', $idBaixa)->delete('tabela_baixas');
        $this->db->where_in('id', [$idProdOk, $idProdFalta])->delete('tabela_produtos');
        $this->db->where('id', $idUsuario)->delete('tabela_usuarios');
        $this->db->where('id', $idEletricista)->delete('tabela_eletricistas');
    }

        private function testar_consultar_por_ids() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod IDs', 'vlr_unitario' => 10, 'qtd_estoque' => 20]);
        $idProd = $this->db->insert_id();

        $this->db->insert('tabela_movimentacoes', ['id_produto' => $idProd, 'tipo' => 'entrada', 'quantidade' => 3, 'valor_unitario' => 10, 'data_mov' => date('Y-m-d')]);
        $idMov = $this->db->insert_id();

        $resultado = $this->BaixasModel->consultar_por_ids([$idMov]);
        $vazio     = $this->BaixasModel->consultar_por_ids([]);

        $this->unit->run(count($resultado), 1, 'ConsultarPorIds: Deve trazer a movimentação pelo ID');
        $this->unit->run((float)$resultado[0]['valor_entrada'], 30.0, 'ConsultarPorIds: valor_entrada deve refletir o total quando tipo é entrada');
        $this->unit->run((float)$resultado[0]['valor_saida'], 0.0, 'ConsultarPorIds: valor_saida deve ser 0 quando tipo é entrada');
        $this->unit->run($vazio, [], 'ConsultarPorIds: Array de IDs vazio deve retornar array vazio sem consultar o banco');

        $this->db->trans_rollback();
    }

    private function testar_produtos_lista_e_lancamento() {
        $this->db->trans_start();

        $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Lista', 'vlr_unitario' => 15, 'qtd_estoque' => 8]);
        $idProd = $this->db->insert_id();

        $lista = $this->BaixasModel->produtos_lista();
        $paraLancamento = $this->BaixasModel->produtos_para_lancamento();

        $encontrado = array_filter($lista, fn($p) => (int)$p['id'] === (int)$idProd);
        $encontradoLanc = array_filter($paraLancamento, fn($p) => (int)$p['id'] === (int)$idProd);

        $this->unit->run(count($encontrado) > 0, TRUE, 'ProdutosLista: Deve incluir o produto criado');
        $this->unit->run(count($encontradoLanc) > 0, TRUE, 'ProdutosParaLancamento: Deve incluir o produto criado');

        $itemLanc = array_values($encontradoLanc)[0];
        $this->unit->run((float)$itemLanc['vlr_unitario'], 15.0, 'ProdutosParaLancamento: Deve trazer o valor unitário do produto');
        $this->unit->run((int)$itemLanc['qtd_estoque'], 8, 'ProdutosParaLancamento: Deve trazer o estoque atual do produto');

        $this->db->trans_rollback();
    }

    private function testar_produto_por_id() {
    $this->db->trans_start();

    $this->db->insert('tabela_produtos', ['nome_produto' => 'Prod Unico', 'vlr_unitario' => 22, 'qtd_estoque' => 5]);
    $idProd = $this->db->insert_id();

    $produto = $this->BaixasModel->produto_por_id($idProd);
    $inexistente = $this->BaixasModel->produto_por_id(999999999);

    $this->unit->run($produto['nome_produto'], 'Prod Unico', 'ProdutoPorId: Deve encontrar o produto pelo ID');
    $this->unit->run((float)$produto['vlr_unitario'], 22.0, 'ProdutoPorId: Deve trazer o valor unitário correto');
    $this->unit->run(empty($inexistente), TRUE, 'ProdutoPorId: ID inexistente deve retornar vazio/null');

    $this->db->trans_rollback();
    }
}