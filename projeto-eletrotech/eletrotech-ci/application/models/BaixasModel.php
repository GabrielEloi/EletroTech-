<?php
defined('BASEPATH') or exit('No direct script access allowed');

class BaixasModel extends CI_Model
{
    const RESULTADO_OK        = 'ok';
    const RESULTADO_SEM_SALDO = 'estoque_insuficiente';
    const RESULTADO_SEM_ITENS = 'sem_itens';
    const RESULTADO_ERRO      = 'erro';

    private function aplicar_filtros($filtros)
    {
        if (!empty($filtros['tipo']) && in_array($filtros['tipo'], array('entrada', 'saida'))) {
            $this->db->where('m.tipo', $filtros['tipo']);
        }
        if (!empty($filtros['id_produto'])) {
            $this->db->where('m.id_produto', (int) $filtros['id_produto']);
        }
        if (!empty($filtros['data_inicio'])) {
            $this->db->where('m.data_mov >=', $filtros['data_inicio']);
        }
        if (!empty($filtros['data_fim'])) {
            $this->db->where('m.data_mov <=', $filtros['data_fim']);
        }
    }

    public function consultar($filtros, $limite = null, $offset = 0)
    {
        $this->db
            ->select('m.id, m.tipo, m.quantidade, m.valor_unitario,
                      (m.quantidade * m.valor_unitario) AS valor_total,
                      m.data_mov, m.origem, m.id_baixa, p.nome_produto')
            ->from('tabela_movimentacoes m')
            ->join('tabela_produtos p', 'm.id_produto = p.id', 'inner')
            ->order_by('m.data_mov', 'DESC')
            ->order_by('m.id', 'DESC');

        $this->aplicar_filtros($filtros);

        if ($limite !== null) {
            $this->db->limit($limite, $offset);
        }

        $query = $this->db->get();
        return $query === false ? array() : $query->result_array();
    }

    public function contar($filtros)
    {
        $this->db->from('tabela_movimentacoes m');
        $this->aplicar_filtros($filtros);

        return $this->db->count_all_results();
    }


    public function totais($filtros)
    {
        $this->db
            ->select("IFNULL(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade * m.valor_unitario END), 0) AS total_entrada,
                      IFNULL(SUM(CASE WHEN m.tipo = 'saida'   THEN m.quantidade * m.valor_unitario END), 0) AS total_saida")
            ->from('tabela_movimentacoes m');

        $this->aplicar_filtros($filtros);

        $query = $this->db->get();

        if ($query === false) {
            return array('total_entrada' => 0, 'total_saida' => 0);
        }

        return $query->row_array();
    }


    public function consultar_por_ids(array $ids)
    {
        if (empty($ids)) {
            return array();
        }

        $this->db
            ->select('m.id, m.tipo, m.quantidade, m.valor_unitario,
                      (m.quantidade * m.valor_unitario) AS valor_total,
                      m.data_mov, m.origem, p.nome_produto,
                      CASE WHEN m.tipo = "entrada" THEN (m.quantidade * m.valor_unitario) ELSE 0 END AS valor_entrada,
                      CASE WHEN m.tipo = "saida" THEN (m.quantidade * m.valor_unitario) ELSE 0 END AS valor_saida')
            ->from('tabela_movimentacoes m')
            ->join('tabela_produtos p', 'm.id_produto = p.id', 'inner')
            ->where_in('m.id', array_map('intval', $ids))
            ->order_by('m.data_mov', 'DESC')
            ->order_by('m.id', 'DESC');

        $query = $this->db->get();

        return $query === false ? array() : $query->result_array();
    }

    public function detalhe($id)
    {
        $query = $this->db
            ->select('m.id, m.tipo, m.quantidade, m.valor_unitario,
                      (m.quantidade * m.valor_unitario) AS valor_total,
                      m.data_mov, m.origem, m.id_os, m.id_baixa, m.id_usuario,
                      p.nome_produto, p.vlr_unitario AS vlr_atual, p.qtd_estoque,
                      os.data_os, os.status, os.data_fechamento,
                      e.nome AS nome_eletricista,
                      u.usuario AS nome_usuario')
            ->from('tabela_movimentacoes m')
            ->join('tabela_produtos p', 'm.id_produto = p.id', 'inner')
            ->join('tabela_ordens_servico os', 'm.id_os = os.id', 'left')
            ->join('tabela_eletricistas e', 'os.eletricista_os = e.id', 'left')
            ->join('tabela_usuarios u', 'm.id_usuario = u.id', 'left')
            ->where('m.id', (int) $id)
            ->get();

        if ($query === false) {
            return null;
        }

        return $query->row_array();
    }

    public function produtos_lista()
    {
        $query = $this->db
            ->select('id, nome_produto')
            ->order_by('nome_produto', 'ASC')
            ->get('tabela_produtos');

        return $query === false ? array() : $query->result_array();
    }

    public function produtos_para_lancamento()
    {
        $query = $this->db
            ->select('id, nome_produto, vlr_unitario, qtd_estoque')
            ->order_by('nome_produto', 'ASC')
            ->get('tabela_produtos');

        return $query === false ? array() : $query->result_array();
    }

    public function produto_por_id($id)
    {
        $query = $this->db
            ->select('id, nome_produto, vlr_unitario, qtd_estoque')
            ->where('id', (int) $id)
            ->get('tabela_produtos');

        return $query === false ? null : $query->row_array();
    }

    // Retorna RESULTADO_OK, RESULTADO_SEM_SALDO ou RESULTADO_ERRO.
    public function lancar($tipo, array $dados)
    {
        if (!in_array($tipo, array('entrada', 'saida'), true)) {
            return self::RESULTADO_ERRO;
        }

        if ((int) $dados['id_produto'] <= 0 || (int) $dados['quantidade'] <= 0) {
            return self::RESULTADO_ERRO;
        }

        $this->db->trans_start();

        if (!$this->aplicar_movimentacao($tipo, $dados)) {
            // trans_rollback() já fecha este nível: chamar trans_complete()
            // depois decrementaria a profundidade duas vezes.
            $this->db->trans_rollback();
            return self::RESULTADO_SEM_SALDO;
        }

        $this->db->trans_complete();

        return $this->db->trans_status() === FALSE ? self::RESULTADO_ERRO : self::RESULTADO_OK;
    }

    // Não abre transação: quem chama é responsável, porque o fechamento de
    // uma baixa aplica vários itens de uma vez. false = saída sem saldo.
    private function aplicar_movimentacao($tipo, array $dados)
    {
        $idProduto  = (int) $dados['id_produto'];
        $quantidade = (int) $dados['quantidade'];

        if ($idProduto <= 0 || $quantidade <= 0) {
            return false;
        }

        if ($tipo === 'saida') {
            // Saldo conferido no próprio UPDATE: em concorrência o WHERE não
            // casa com nenhuma linha e nada é gravado.
            $this->db->set('qtd_estoque', 'qtd_estoque - ' . $quantidade, FALSE)
                ->where('id', $idProduto)
                ->where('qtd_estoque >=', $quantidade)
                ->update('tabela_produtos');

            if ($this->db->affected_rows() === 0) {
                return false;
            }
        } else {
            $this->db->set('qtd_estoque', 'qtd_estoque + ' . $quantidade, FALSE)
                ->where('id', $idProduto)
                ->update('tabela_produtos');
        }

        $this->db->insert('tabela_movimentacoes', array(
            'id_produto'     => $idProduto,
            'tipo'           => $tipo,
            'quantidade'     => $quantidade,
            'valor_unitario' => $dados['valor_unitario'],
            'data_mov'       => $dados['data_mov'],
            'origem'         => $dados['origem'],
            'id_os'          => null,
            'id_baixa'       => empty($dados['id_baixa']) ? null : (int) $dados['id_baixa'],
            'id_usuario'     => empty($dados['id_usuario']) ? null : (int) $dados['id_usuario'],
        ));

        return true;
    }

    public function rascunho_aberto($idUsuario, $tipo)
    {
        // Mesmo select do baixa_por_id: a tela do rascunho exibe o nome do
        // eletricista, que só vem pelo join.
        $query = $this->db
            ->select('b.*, u.usuario AS nome_usuario, e.nome AS nome_eletricista')
            ->from('tabela_baixas b')
            ->join('tabela_usuarios u', 'b.id_usuario = u.id', 'left')
            ->join('tabela_eletricistas e', 'b.id_eletricista = e.id', 'left')
            ->where('b.id_usuario', (int) $idUsuario)
            ->where('b.tipo', $tipo)
            ->where('b.status', 'rascunho')
            ->order_by('b.id', 'DESC')
            ->limit(1)
            ->get();

        return $query === false ? null : $query->row_array();
    }

    public function abrir_baixa(array $dados)
    {
        $this->db->insert('tabela_baixas', array(
            'tipo'           => $dados['tipo'],
            'data_baixa'     => $dados['data_baixa'],
            'id_eletricista' => (int) $dados['id_eletricista'],
            'observacao'     => $dados['observacao'],
            'status'         => 'rascunho',
            'id_usuario'     => empty($dados['id_usuario']) ? null : (int) $dados['id_usuario'],
            'data_abertura'  => date('Y-m-d H:i:s'),
        ));

        $id = (int) $this->db->insert_id();

        return $id > 0 ? $id : false;
    }

    public function baixa_por_id($id)
    {
        $query = $this->db
            ->select('b.*, u.usuario AS nome_usuario, e.nome AS nome_eletricista')
            ->from('tabela_baixas b')
            ->join('tabela_usuarios u', 'b.id_usuario = u.id', 'left')
            // Sem filtrar demissão: documento antigo mantém o nome de quem solicitou.
            ->join('tabela_eletricistas e', 'b.id_eletricista = e.id', 'left')
            ->where('b.id', (int) $id)
            ->get();

        return $query === false ? null : $query->row_array();
    }

    public function itens_da_baixa($idBaixa)
    {
        $query = $this->db
            ->select('i.id, i.id_produto, i.quantidade, i.valor_unitario,
                      (i.quantidade * i.valor_unitario) AS valor_total,
                      p.nome_produto, p.qtd_estoque')
            ->from('tabela_baixa_itens i')
            ->join('tabela_produtos p', 'i.id_produto = p.id', 'inner')
            ->where('i.id_baixa', (int) $idBaixa)
            ->order_by('i.id', 'ASC')
            ->get();

        return $query === false ? array() : $query->result_array();
    }

    public function incluir_item($idBaixa, array $dados)
    {
        $baixa = $this->baixa_por_id($idBaixa);

        if (empty($baixa) || $baixa['status'] !== 'rascunho') {
            return false;
        }

        return $this->db->insert('tabela_baixa_itens', array(
            'id_baixa'       => (int) $idBaixa,
            'id_produto'     => (int) $dados['id_produto'],
            'quantidade'     => (int) $dados['quantidade'],
            'valor_unitario' => $dados['valor_unitario'],
        ));
    }

    public function remover_item($idBaixa, $idItem)
    {
        $baixa = $this->baixa_por_id($idBaixa);

        if (empty($baixa) || $baixa['status'] !== 'rascunho') {
            return false;
        }

        $this->db->where('id', (int) $idItem)
            ->where('id_baixa', (int) $idBaixa)
            ->delete('tabela_baixa_itens');

        return $this->db->affected_rows() > 0;
    }

    // Tudo ou nada: se um item não couber no estoque, nenhum é aplicado.
    // Retorna ['resultado', 'produto' (o que travou o fechamento)].
    public function finalizar_baixa($idBaixa, $idUsuario = null)
    {
        $baixa = $this->baixa_por_id($idBaixa);

        if (empty($baixa) || $baixa['status'] !== 'rascunho') {
            return array('resultado' => self::RESULTADO_ERRO, 'produto' => '');
        }

        $itens = $this->itens_da_baixa($idBaixa);

        if (empty($itens)) {
            return array('resultado' => self::RESULTADO_SEM_ITENS, 'produto' => '');
        }

        $origem = sprintf(
            'Baixa de %s #%s',
            $baixa['tipo'] === 'entrada' ? 'entrada' : 'saída',
            str_pad($baixa['id'], 5, '0', STR_PAD_LEFT)
        );

        $this->db->trans_start();

        foreach ($itens as $item) {
            $aplicou = $this->aplicar_movimentacao($baixa['tipo'], array(
                'id_produto'     => $item['id_produto'],
                'quantidade'     => $item['quantidade'],
                'valor_unitario' => $item['valor_unitario'],
                'data_mov'       => $baixa['data_baixa'],
                'origem'         => $origem,
                'id_baixa'       => $baixa['id'],
                'id_usuario'     => $idUsuario,
            ));

            if (!$aplicou) {
                $this->db->trans_rollback();

                return array(
                    'resultado' => self::RESULTADO_SEM_SALDO,
                    'produto'   => $item['nome_produto'],
                );
            }
        }

        $this->db->where('id', (int) $idBaixa)->update('tabela_baixas', array(
            'status'           => 'finalizada',
            'data_finalizacao' => date('Y-m-d H:i:s'),
        ));

        $this->db->trans_complete();

        return array(
            'resultado' => $this->db->trans_status() === FALSE ? self::RESULTADO_ERRO : self::RESULTADO_OK,
            'produto'   => '',
        );
    }

    public function cancelar_baixa($idBaixa)
    {
        $baixa = $this->baixa_por_id($idBaixa);

        if (empty($baixa) || $baixa['status'] !== 'rascunho') {
            return false;
        }

        // A baixa continua existindo como histórico cancelado, então os itens
        // saem na mão. O estoque nunca foi tocado, não há o que estornar.
        $this->db->where('id_baixa', (int) $idBaixa)->delete('tabela_baixa_itens');

        return $this->db->where('id', (int) $idBaixa)->update('tabela_baixas', array(
            'status' => 'cancelada',
        ));
    }

    public function movimentacoes_da_baixa($idBaixa)
    {
        $query = $this->db
            ->select('m.id, m.quantidade, m.valor_unitario,
                      (m.quantidade * m.valor_unitario) AS valor_total,
                      p.nome_produto, p.qtd_estoque')
            ->from('tabela_movimentacoes m')
            ->join('tabela_produtos p', 'm.id_produto = p.id', 'inner')
            ->where('m.id_baixa', (int) $idBaixa)
            ->order_by('m.id', 'ASC')
            ->get();

        return $query === false ? array() : $query->result_array();
    }
}
