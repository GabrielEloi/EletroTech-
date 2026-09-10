<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MetasModel extends CI_Model
{
    protected $table = 'tabela_metas';

    public function __construct()
    {
        parent::__construct();
    }

    public function get_all($filtroEletricista = '', $filtroMes = '', $limite = null, $offset = 0)
    {
        $this->aplicar_filtros($filtroEletricista, $filtroMes);

        $this->db->order_by('m.id', 'DESC');

        if ($limite !== null) {
            $this->db->limit($limite, $offset);
        }

        $query = $this->db->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function contar($filtroEletricista = '', $filtroMes = '')
    {
        $this->aplicar_filtros($filtroEletricista, $filtroMes);

        return $this->db->count_all_results();
    }

    private function aplicar_filtros($filtroEletricista, $filtroMes)
    {
        $this->db->from('tabela_metas m')
                  ->join('tabela_eletricistas e', 'm.eletricista_meta = e.id', 'inner')
                  ->select('m.*, e.nome as nome_eletricista');

        if (!empty($filtroEletricista)) {
            $this->db->where('m.eletricista_meta', (int) $filtroEletricista);
        }

        if (!empty($filtroMes)) {
            $this->db->where('m.mes_meta', $filtroMes);
        }
    }
    
    public function get_eletricistas_ativos()
    {
        $query = $this->db->select('id, nome')
                            ->where('data_demissao', null)
                            ->order_by('nome', 'ASC')
                            ->get('tabela_eletricistas');

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function get_by_id($id)
    {
        return $this->db->get_where($this->table, ['id' => $id])->row_array();
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

    public function delete($id)
    {
        return $this->db->delete($this->table, ['id' => $id]);
    }
}