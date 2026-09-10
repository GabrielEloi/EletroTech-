<?php
defined('BASEPATH') or exit('No direct script access allowed');

class EletricistasModel extends CI_Model
{
    protected $table = 'tabela_eletricistas';

    public function __construct()
    {
        parent::__construct();
    }

    public function get_all($limite = null, $offset = 0)
    {
        $mesAtual = date('Y-m');
        $sql = "SELECT e.*,
                    (SELECT COUNT(*) FROM tabela_ordens_servico WHERE eletricista_os = e.id) as total_os,
                    (SELECT vlr_meta FROM tabela_metas
                        WHERE eletricista_meta = e.id
                        AND mes_meta = ?
                        LIMIT 1) as meta_atual
                FROM tabela_eletricistas e
                ORDER BY e.id DESC";

        $params = [$mesAtual];

        if ($limite !== null) {
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = (int) $limite;
            $params[] = (int) $offset;
        }

        $query = $this->db->query($sql, $params);

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

    // Eletricistas ativos, para o dropdown de vínculo na tela de Usuários.
    public function listar_para_vinculo()
    {
        return $this->db
            ->select('id, nome, cpf')
            ->where('data_demissao', null)
            ->order_by('nome', 'ASC')
            ->get($this->table)
            ->result_array();
    }

    public function get_by_cpf($cpf)
    {
        return $this->db->get_where($this->table, ['cpf' => $cpf])->row_array();
    }

    public function get_os_by_eletricista($idEletricista)
    {
        $query = $this->db
            ->select('os.id, os.data_os, os.data_fechamento, os.status')
            ->from('tabela_ordens_servico os')
            ->where('os.eletricista_os', (int) $idEletricista)
            ->order_by('os.id', 'DESC')
            ->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function insert($data)
    {
        return $this->db->insert($this->table, $data);
    }

    public function update($id, $data)
    {
        $this->db->where('id', $id);
        return $this->db->update($this->table, $data);
    }

    public function demitir($id)
    {
        $this->db->where('id', $id);
        return $this->db->update($this->table, [
            'data_demissao' => date('Y-m-d')
        ]);
    }

    public function reativar($id)
    {
        $this->db->where('id', $id);
        return $this->db->update($this->table, [
            'data_demissao' => null
        ]);
    }
}
