<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class ProdutosModel extends CI_Model
{
    protected $table = 'tabela_produtos';

    public function __construct()
    {
        parent::__construct();
    }

    public function get_all($limite = null, $offset = 0)
    {
        $this->db->order_by('id', 'DESC');

        if ($limite !== null) {
            $this->db->limit($limite, $offset);
        }

        $query = $this->db->get($this->table);

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function contar()
    {
        return $this->db->count_all_results($this->table);
    }

    public function get_by_id($id)
    {
        return $this->db->get_where($this->table, ['id' => $id])->row_array();
    }

    /**
     * Cadastra o produto e, se já nascer com estoque, lança a entrada no ledger.
     *
     * Retorna o ID do produto criado (ou FALSE em caso de falha). Não use
     * $this->db->insert_id() depois de chamar este método: quando há estoque
     * inicial a última inserção é a da movimentação, não a do produto.
     */
    public function insert($data)
    {
        $this->db->trans_start();

        $this->db->insert($this->table, $data);
        $idProduto = (int) $this->db->insert_id();

        if ($idProduto > 0 && (int) ($data['qtd_estoque'] ?? 0) > 0) {
            $this->registrarMovimentacao(
                $idProduto,
                'entrada',
                (int) $data['qtd_estoque'],
                $data['vlr_unitario'] ?? 0,
                'Estoque inicial (cadastro)'
            );
        }

        $this->db->trans_complete();

        if ($idProduto <= 0 || $this->db->trans_status() === FALSE) {
            return false;
        }

        return $idProduto;
    }

    public function update($id, $data)
    {
        $this->db->where('id', $id);
        return $this->db->update($this->table, $data);
    }

    public function zerarEstoque($id)
    {
        $produto = $this->get_by_id($id);

        if (!$produto) {
            return false;
        }

        $qtdAtual = (int) $produto['qtd_estoque'];

        $this->db->trans_start();
        $this->db->update($this->table, ['qtd_estoque' => 0], ['id' => $id]);

        if ($qtdAtual > 0) {
            $this->registrarMovimentacao(
                $id,
                'saida',
                $qtdAtual,
                $produto['vlr_unitario'] ?? 0,
                'Baixa manual de estoque'
            );
        }

        $this->db->trans_complete();

        return $this->db->trans_status() !== FALSE;
    }

    public function aumentarQtdEstoque($id, $quantidade)
    {
        $quantidade = (int) $quantidade;

        if ($quantidade <= 0) {
            return false;
        }

        // Sem o produto não há como lançar a movimentação: a FK fk_mov_produto
        // rejeitaria o insert e derrubaria a requisição.
        $produto = $this->get_by_id($id);

        if (!$produto) {
            return false;
        }

        $this->db->trans_start();

        $this->db->set('qtd_estoque', 'qtd_estoque + ' . $quantidade, FALSE);
        $this->db->where('id', $id);
        $this->db->update($this->table);

        $this->registrarMovimentacao(
            $id,
            'entrada',
            $quantidade,
            $produto['vlr_unitario'] ?? 0,
            'Reposição de estoque'
        );

        $this->db->trans_complete();

        return $this->db->trans_status() !== FALSE;
    }

    /**
     * Grava uma movimentação no ledger (tabela_movimentacoes),
     * que alimenta a tela de Baixas.
     */
    private function registrarMovimentacao($idProduto, $tipo, $qtd, $valorUnitario, $origem, $idOs = null)
    {
        $this->db->insert('tabela_movimentacoes', array(
            'id_produto'     => (int) $idProduto,
            'tipo'           => $tipo,
            'quantidade'     => (int) $qtd,
            'valor_unitario' => $valorUnitario,
            'data_mov'       => date('Y-m-d'),
            'origem'         => $origem,
            'id_os'          => $idOs,
        ));
    }
}