<?php
defined('BASEPATH') or exit('No direct script access allowed');

class OrdemServicoModel extends CI_Model
{
    protected $table = 'tabela_ordens_servico';
    protected $tabelaPivot = 'tabela_os_materiais';
    protected $tableRespostas = 'tabela_os_checklist_respostas';
    protected $tableComentarios = 'tabela_os_comentarios';

    public function __construct()
    {
        parent::__construct();
    }

    public function get_by_id($idOs)
    {
        return $this->db
            ->select('os.id, os.eletricista_os, os.status, os.data_os, os.data_fechamento, e.nome AS nome_eletricista')
            ->from($this->table . ' os')
            ->join('tabela_eletricistas e', 'e.id = os.eletricista_os', 'left')
            ->where('os.id', (int) $idOs)
            ->get()
            ->row_array();
    }

    public function get_all($limite = null, $offset = 0)
    {
        $this->db->select('os.id, os.data_os, os.data_fechamento, os.status, e.nome as nome_eletricista')
            ->from('tabela_ordens_servico os')
            ->join('tabela_eletricistas e', 'os.eletricista_os = e.id', 'inner')
            ->order_by('os.id', 'DESC');

        if ($limite !== null) {
            $this->db->limit($limite, $offset);
        }

        $query = $this->db->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function contar()
    {
        return $this->db->from('tabela_ordens_servico os')
            ->join('tabela_eletricistas e', 'os.eletricista_os = e.id', 'inner')
            ->count_all_results();
    }

    public function contar_por_eletricista($idEletricista)
    {
        return $this->db->from('tabela_ordens_servico os')
            ->join('tabela_eletricistas e', 'os.eletricista_os = e.id', 'inner')
            ->where('os.eletricista_os', (int) $idEletricista)
            ->count_all_results();
    }

    public function get_all_by_eletricista($idEletricista, $limite = null, $offset = 0)
    {
        $this->db->select('os.id, os.data_os, os.data_fechamento, os.status, e.nome as nome_eletricista')
            ->from('tabela_ordens_servico os')
            ->join('tabela_eletricistas e', 'os.eletricista_os = e.id', 'inner')
            ->where('os.eletricista_os', (int) $idEletricista)
            ->order_by('os.id', 'DESC');

        if ($limite !== null) {
            $this->db->limit($limite, $offset);
        }

        $query = $this->db->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
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

    public function get_produtos_disponiveis()
    {
        $query = $this->db->select('id, nome_produto, qtd_estoque')
            ->where('qtd_estoque >', 0)
            ->order_by('nome_produto', 'ASC')
            ->get('tabela_produtos');

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function get_materiais_by_os($idOs)
    {
        $query = $this->db->select('p.nome_produto, mp.qtd_utilizada')
            ->from($this->tabelaPivot . ' mp')
            ->join('tabela_produtos p', 'mp.id_produto = p.id', 'inner')
            ->where('mp.id_os', $idOs)
            ->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function get_checklist_respostas_by_os($idOs)
    {
        $query = $this->db->select('r.id_pergunta, p.texto_pergunta, r.resposta, r.motivo_nao')
            ->from($this->tableRespostas . ' r')
            ->join('tabela_checklist_perguntas p', 'r.id_pergunta = p.id', 'inner')
            ->where('r.id_os', $idOs)
            ->order_by('p.ordem', 'ASC')
            ->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    /**
     * Respostas do checklist de uma OS filtradas por tipo (inicio ou fim),
     * usadas no relatório de Consulta Checklist.
     */
    public function get_checklist_respostas_by_os_tipo($idOs, $tipo)
    {
        $query = $this->db
            ->select('r.id_pergunta, p.texto_pergunta, r.resposta, r.motivo_nao')
            ->from($this->tableRespostas . ' r')
            ->join('tabela_checklist_perguntas p', 'r.id_pergunta = p.id', 'inner')
            ->join('tabela_checklist c', 'p.id_checklist = c.id', 'inner')
            ->where('r.id_os', $idOs)
            ->where('c.tipo', $tipo)
            ->order_by('p.ordem', 'ASC')
            ->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function get_comentarios_by_os($idOs)
    {
        $query = $this->db->select('id, comentario, foto, data_comentario')
            ->from($this->tableComentarios)
            ->where('id_os', $idOs)
            ->order_by('data_comentario', 'DESC')
            ->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function add_comentario($idOs, $comentario, $foto = null)
    {
        $ordem = $this->db->select('id')->where('id', $idOs)->get($this->table)->row_array();

        if (empty($ordem)) {
            return false;
        }

        return $this->db->insert($this->tableComentarios, [
            'id_os' => (int) $idOs,
            'comentario' => ($comentario !== '' ? $comentario : null),
            'foto' => $foto,
        ]);
    }

    /**
     * Primeiro passo do ciclo de vida: o admin solicita o serviço e atribui o
     * eletricista. Nenhum material é reservado aqui — a baixa de estoque só
     * acontece quando o eletricista abre a OS (ver abrir_os).
     *
     * @return int|false ID da OS criada, ou false em caso de falha.
     */
    public function solicitar_os($eletricistaId, $dataOs)
    {
        $ok = $this->db->insert($this->table, [
            'eletricista_os' => (int) $eletricistaId,
            'data_os' => $dataOs,
            'status' => 'solicitada',
        ]);

        if (!$ok) {
            return false;
        }

        return $this->db->insert_id();
    }

    /**
     * Segundo passo: o eletricista abre a OS solicitada, informando os materiais
     * que vai utilizar e respondendo o checklist de início. É aqui que o estoque
     * é baixado e as movimentações de saída são geradas.
     *
     * @param bool $bloqueado Se true, a OS é marcada como 'aberta_pendente' em vez
     *                        de 'aberta' — a resposta do checklist bloqueou a abertura
     *                        normal e a OS aguarda revisão em Consulta Checklist.
     *
     * @return bool
     */
    public function abrir_os($idOs, array $produtos, array $respostas = [], $bloqueado = false)
    {
        $ordem = $this->db->where('id', (int) $idOs)
            ->where('status', 'solicitada')
            ->get($this->table)
            ->row_array();

        if (empty($ordem)) {
            return false;
        }

        $idOs = (int) $idOs;

        $this->db->trans_start();

        $insufficientStock = false;
        foreach ($produtos as $item) {
            $produtoId = (int) $item['id'];
            $qtd = (int) $item['qtd'];

            $produto = $this->db->select('qtd_estoque, vlr_unitario')
                ->where('id', $produtoId)
                ->get('tabela_produtos')
                ->row_array();

            if (!$produto || $produto['qtd_estoque'] < $qtd) {
                $insufficientStock = true;
                break;
            }

            $this->db->insert($this->tabelaPivot, [
                'id_os' => $idOs,
                'id_produto' => $produtoId,
                'qtd_utilizada' => $qtd,
            ]);

            $this->db->set('qtd_estoque', 'qtd_estoque - ' . $qtd, FALSE)
                ->where('id', $produtoId)
                ->update('tabela_produtos');

            $this->db->insert('tabela_movimentacoes', [
                'id_produto' => $produtoId,
                'tipo' => 'saida',
                'quantidade' => $qtd,
                'valor_unitario' => $produto['vlr_unitario'],
                'data_mov' => $ordem['data_os'],
                'origem' => 'OS #' . str_pad($idOs, 5, '0', STR_PAD_LEFT),
                'id_os' => $idOs,
            ]);
        }

        // trans_rollback() já desfaz e fecha este nível da transação; chamar
        // trans_complete() na sequência decrementaria a profundidade duas vezes
        // e acabaria commitando quando esta operação roda dentro de outra
        // transação (como nas suítes de teste).
        if ($insufficientStock) {
            $this->db->trans_rollback();
            return false;
        }

        foreach ($respostas as $perguntaId => $resposta) {
            $this->db->insert($this->tableRespostas, [
                'id_os' => $idOs,
                'id_pergunta' => (int) $perguntaId,
                'resposta' => $resposta,
            ]);
        }

        $this->db->where('id', $idOs)->update($this->table, [
            'status' => $bloqueado ? 'bloqueada' : 'aberta',
        ]);

        $this->db->trans_complete();

        return $this->db->trans_status() !== FALSE;
    }

    /**
     * @param bool $bloqueado Se true, a OS é marcada como 'fechada_pendente' em vez
     *                        de 'fechada' — o checklist de fim bloqueou o fechamento
     *                        e a OS aguarda revisão em Consulta Checklist.
     */
    public function fechar_os($idOs, array $respostas, $bloqueado = false)
    {
        // Aceita tanto OS abertas normalmente quanto OS que ficaram pendentes
        // na abertura (o checklist de início bloqueou, mas o trabalho seguiu).
        $ordem = $this->db->where('id', $idOs)
            ->where_in('status', ['aberta', 'bloqueada'])
            ->get($this->table)
            ->row_array();

        if (empty($ordem)) {
            return false;
        }

        $this->db->trans_start();

        $this->db->where('id', $idOs)->update($this->table, [
            'status' => $bloqueado ? 'bloqueada' : 'fechada',
            'data_fechamento' => $bloqueado ? null : date('Y-m-d'),
        ]);

        foreach ($respostas as $perguntaId => $respostaData) {
            $this->db->insert($this->tableRespostas, [
                'id_os' => $idOs,
                'id_pergunta' => (int) $perguntaId,
                'resposta' => $respostaData['resposta'],
                'motivo_nao' => isset($respostaData['motivo_nao']) ? $respostaData['motivo_nao'] : null,
            ]);
        }

        $this->db->trans_complete();

        return $this->db->trans_status() !== FALSE;
    }


    public function totalSolicitadasPorEletricista($idEletricista)
    {
        return $this->db->from($this->table)
            ->where('status', 'solicitada')
            ->where('eletricista_os', (int) $idEletricista)
            ->count_all_results();
    }

    public function totalAbertasPorEletricista($idEletricista)
    {
        return $this->db->from($this->table)
            ->where_in('status', ['aberta', 'aberta_pendente'])
            ->where('eletricista_os', (int) $idEletricista)
            ->count_all_results();
    }

    public function totalFechadasPorEletricista($idEletricista)
    {
        return $this->db->from($this->table)
            ->where_in('status', ['fechada', 'fechada_pendente'])
            ->where('eletricista_os', (int) $idEletricista)
            ->count_all_results();
    }

    public function totalPorEletricista($idEletricista)
    {
        return $this->db->from($this->table)
            ->where('eletricista_os', (int) $idEletricista)
            ->count_all_results();
    }

    public function ultimasOSs($idEletricista = null, $limite = 3)
    {
        $this->db->select('os.id, os.data_os, os.data_fechamento, os.status, e.nome as nome_eletricista')
            ->from('tabela_ordens_servico os')
            ->join('tabela_eletricistas e', 'os.eletricista_os = e.id', 'inner')
            ->order_by('os.id', 'DESC');

        if ($idEletricista !== null && $idEletricista !== '') {
            $this->db->where('os.eletricista_os', (int) $idEletricista);
        }

        $query = $this->db->limit((int) $limite)->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }
}