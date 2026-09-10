<?php
defined('BASEPATH') or exit('No direct script access allowed');

class DashboardModel extends CI_Model
{
    public function contarTotais($idEletricista = null)
    {
        $totais = array(
            'eletricistas' => 0,
            'produtos'     => 0,
            'os'           => 0,
            'metas'        => 0.00,
        );

        if ($idEletricista !== null && $idEletricista !== '') {
            $totais['os'] = $this->db
                ->where('eletricista_os', (int) $idEletricista)
                ->count_all_results('tabela_ordens_servico');

            return $totais;
        }

        $totais['eletricistas'] = $this->db
            ->where('data_demissao', null)
            ->count_all_results('tabela_eletricistas');

        $totais['produtos'] = $this->db->count_all('tabela_produtos');
        $totais['os']       = $this->db->count_all('tabela_ordens_servico');

        $linha = $this->db
            ->select_sum('vlr_meta', 'total')
            ->get('tabela_metas')
            ->row();

        $totais['metas'] = $linha->total ?? 0;

        return $totais;
    }

    public function contarProdutosUtilizados($idEletricista = null)
    {
        $this->db
            ->select_sum('om.qtd_utilizada', 'total')
            ->from('tabela_os_materiais om')
            ->join('tabela_ordens_servico os', 'os.id = om.id_os', 'left');

        if ($idEletricista !== null && $idEletricista !== '') {
            $this->db->where('os.eletricista_os', (int) $idEletricista);
        }

        $linha = $this->db->get()->row();

        return (int) ($linha->total ?? 0);
    }

    public function getMetaAtual($idEletricista = null)
    {
        $mesAtual = date('Y-m');

        $this->db
            ->select('vlr_meta')
            ->from('tabela_metas')
            ->where('eletricista_meta', (int) $idEletricista)
            ->where('mes_meta', $mesAtual);

        $linha = $this->db->get()->row();

        return (float) ($linha->vlr_meta ?? 0);
    }

    public function getOsPorEletricista($idEletricista = null)
    {
        $this->db
            ->select('e.nome AS eletricista, COUNT(os.id) AS total')
            ->from('tabela_ordens_servico os')
            ->join('tabela_eletricistas e', 'e.id = os.eletricista_os', 'left')
            ->group_by('e.id, e.nome')
            ->order_by('total', 'DESC');

        if ($idEletricista !== null && $idEletricista !== '') {
            $this->db->where('os.eletricista_os', (int) $idEletricista);
        }

        $query = $this->db->get();

        if ($query === false || $query->num_rows() === 0) {
            return [];
        }

        return $query->result_array();
    }

    public function getMovimentacaoPorMes($idEletricista = null)
    {
        $this->db
            ->select("DATE_FORMAT(m.data_mov, '%Y-%m') AS mes,
                      SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade * m.valor_unitario ELSE 0 END) AS entrada,
                      SUM(CASE WHEN m.tipo = 'saida'   THEN m.quantidade * m.valor_unitario ELSE 0 END) AS saida", false)
            ->from('tabela_movimentacoes m')
            ->group_by("DATE_FORMAT(m.data_mov, '%Y-%m')")
            ->order_by('mes', 'ASC');

        if ($idEletricista !== null && $idEletricista !== '') {
            $this->db->join('tabela_ordens_servico os', 'os.id = m.id_os', 'left')
                ->where('os.eletricista_os', (int) $idEletricista);
        }

        $query = $this->db->get();

        if ($query === false || $query->num_rows() === 0) {
            return [];
        }

        return $query->result_array();
    }

    public function getOsPorStatus($idEletricista = null)
    {
        $this->db
            ->select('status, COUNT(id) AS total')
            ->from('tabela_ordens_servico');

        if ($idEletricista !== null && $idEletricista !== '') {
            $this->db->where('eletricista_os', (int) $idEletricista);
        }

        $query = $this->db->group_by('status')->get();

        $resultado = array('solicitada' => 0, 'aberta' => 0, 'fechada' => 0);

        if ($query === false) {
            return $resultado;
        }

        foreach ($query->result_array() as $linha) {
            $resultado[$linha['status']] = (int) $linha['total'];
        }

        return $resultado;
    }

    public function getOsPorMes($mes = null, $idEletricista = null)
    {
        $this->db
            ->select("DATE_FORMAT(data_os, '%Y-%m') AS mes, COUNT(id) AS total", false)
            ->from('tabela_ordens_servico')
            ->group_by("DATE_FORMAT(data_os, '%Y-%m')")
            ->order_by('mes', 'ASC');

        if ($idEletricista !== null && $idEletricista !== '') {
            $this->db->where('eletricista_os', (int) $idEletricista);
        }

        if (!empty($mes)) {
            $this->db->where("DATE_FORMAT(data_os, '%Y-%m') =", $mes);
        }

        $query = $this->db->get();

        if ($query === false || $query->num_rows() === 0) {
            return [];
        }

        return $query->result_array();
    }
}
