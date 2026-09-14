<?php
defined('BASEPATH') or exit('No direct script access allowed');

class ChecklistModel extends CI_Model
{
    protected $table = 'tabela_checklist';
    protected $tablePerguntas = 'tabela_checklist_perguntas';
    protected $tableRespostas = 'tabela_os_checklist_respostas';

    public function __construct()
    {
        parent::__construct();
    }

    public function get_all()
    {
        $query = $this->db
            ->select('c.*, COUNT(p.id) AS total_perguntas')
            ->from($this->table . ' c')
            ->join($this->tablePerguntas . ' p', 'p.id_checklist = c.id', 'left')
            ->group_by('c.id')
            ->order_by('c.id', 'DESC')
            ->get();

        if ($query === false) {
            return [];
        }

        return $query->result_array();
    }

    public function get_selected_by_type($tipo)
    {
        $checklist = $this->db
            ->where('tipo', $tipo)
            ->where('selecionado', 1)
            ->get($this->table)
            ->row_array();

        if (!$checklist) {
            return null;
        }

        $checklist['perguntas'] = $this->get_perguntas($checklist['id']);
        return $checklist;
    }


    public function normalizar_resposta($valor)
    {
        $valor = mb_strtolower(trim((string) $valor), 'UTF-8');

        return strtr($valor, [
            'á' => 'a',
            'à' => 'a',
            'ã' => 'a',
            'â' => 'a',
            'ä' => 'a',
            'é' => 'e',
            'è' => 'e',
            'ê' => 'e',
            'ë' => 'e',
            'í' => 'i',
            'ì' => 'i',
            'î' => 'i',
            'ï' => 'i',
            'ó' => 'o',
            'ò' => 'o',
            'õ' => 'o',
            'ô' => 'o',
            'ö' => 'o',
            'ú' => 'u',
            'ù' => 'u',
            'û' => 'u',
            'ü' => 'u',
            'ç' => 'c',
        ]);
    }

    public function get_perguntas($idChecklist)
    {
        $query = $this->db
            ->where('id_checklist', $idChecklist)
            ->order_by('ordem', 'ASC')
            ->get($this->tablePerguntas);

        if ($query === false) {
            return [];
        }

        $perguntas = $query->result_array();


        foreach ($perguntas as &$pergunta) {
            $pergunta['bloqueia_normalizado'] = $this->normalizar_resposta($pergunta['bloqueia_abertura'] ?? '');
        }
        unset($pergunta);

        return $perguntas;
    }

    public function insert_checklist(array $data, array $perguntas)
    {
        if (empty($data['titulo']) || empty($data['tipo']) || empty($perguntas)) {
            return false;
        }

        $this->db->trans_start();
        $this->db->insert($this->table, $data);
        $idChecklist = $this->db->insert_id();

        $ordem = 1;
        foreach ($perguntas as $pergunta) {

            if (is_array($pergunta)) {
                $texto = trim((string) ($pergunta['texto'] ?? ''));
                $tipoResp = isset($pergunta['tipo_resposta']) && in_array($pergunta['tipo_resposta'], ['radio', 'text']) ? $pergunta['tipo_resposta'] : 'text';
                $bloq = isset($pergunta['bloqueia_abertura']) ? trim((string) $pergunta['bloqueia_abertura']) : null;
            } else {
                $texto = trim((string) $pergunta);
                $tipoResp = 'text';
                $bloq = null;
            }

            if ($texto === '') {
                continue;
            }

            $this->db->insert($this->tablePerguntas, [
                'id_checklist' => $idChecklist,
                'texto_pergunta' => $texto,
                'tipo_resposta' => $tipoResp,
                'bloqueia_abertura' => $bloq,
                'ordem' => $ordem++,
            ]);
        }

        $this->db->trans_complete();

        if ($this->db->trans_status() === FALSE) {
            return false;
        }

        return $idChecklist;
    }

    public function clear_selected($tipo)
    {
        return $this->db
            ->where('tipo', $tipo)
            ->update($this->table, ['selecionado' => 0]);
    }

    public function select_default($idChecklist, $tipo)
    {
        $this->db->trans_start();
        $this->clear_selected($tipo);
        $this->db->where('id', $idChecklist)->update($this->table, ['selecionado' => 1]);
        $this->db->trans_complete();

        return $this->db->trans_status() !== FALSE;
    }

    public function delete_checklist($idChecklist)
    {
        $this->db->trans_start();
        $this->db->where('id', $idChecklist)->delete($this->table);
        $this->db->trans_complete();

        return $this->db->trans_status() !== FALSE;
    }
    public function registrar_bloqueio($idOs, $tipo)
    {
        $existente = $this->db->where('id_os', $idOs)->where('tipo', $tipo)
            ->get('tabela_os_checklist_status')->row_array();

        if ($existente) {
            return $this->db->where('id', $existente['id'])->update('tabela_os_checklist_status', [
                'bloqueado' => 1,
                'observacao' => null,
                'data_bloqueio' => date('Y-m-d H:i:s'),
                'data_finalizacao' => null,
            ]);
        }

        return $this->db->insert('tabela_os_checklist_status', [
            'id_os' => (int) $idOs,
            'tipo' => $tipo,
            'bloqueado' => 1,
            'data_bloqueio' => date('Y-m-d H:i:s'),
        ]);
    }

    private function aplicar_filtros_bloqueados($filtroTipo = null, $filtroEletricista = null)
    {
        $this->db->from('tabela_os_checklist_status s')
            ->join('tabela_ordens_servico os', 'os.id = s.id_os', 'inner')
            ->join('tabela_eletricistas e', 'e.id = os.eletricista_os', 'left')
            ->where('s.bloqueado', 1);

        if (!empty($filtroTipo) && in_array($filtroTipo, ['inicio', 'fim'], true)) {
            $this->db->where('s.tipo', $filtroTipo);
        }

        if (!empty($filtroEletricista) && is_numeric($filtroEletricista)) {
            $this->db->where('e.id', (int) $filtroEletricista);
        }
    }

    public function contar_bloqueados($filtroTipo = null, $filtroEletricista = null)
    {
        $this->aplicar_filtros_bloqueados($filtroTipo, $filtroEletricista);

        return $this->db->count_all_results();
    }

    public function get_bloqueados($filtroTipo = null, $filtroEletricista = null, $ordenar = 'data_desc', $limite = null, $offset = 0)
    {
        $this->db->select('s.id AS id_status, s.id_os, s.tipo, s.data_bloqueio, os.data_os, os.status AS status_os, e.id AS id_eletricista, e.nome AS nome_eletricista');

        $this->aplicar_filtros_bloqueados($filtroTipo, $filtroEletricista);

        switch ($ordenar) {
            case 'data_asc':
                $this->db->order_by('s.data_bloqueio', 'ASC');
                break;
            case 'os_asc':
                $this->db->order_by('s.id_os', 'ASC');
                break;
            case 'os_desc':
                $this->db->order_by('s.id_os', 'DESC');
                break;
            case 'eletricista_asc':
                $this->db->order_by('e.nome', 'ASC');
                break;
            case 'eletricista_desc':
                $this->db->order_by('e.nome', 'DESC');
                break;
            case 'data_desc':
            default:
                $this->db->order_by('s.data_bloqueio', 'DESC');
                break;
        }

        if ($limite !== null) {
            $this->db->limit($limite, $offset);
        }

        $query = $this->db->get();
        return $query === false ? [] : $query->result_array();
    }

    public function get_status_by_os_tipo($idOs, $tipo)
    {
        return $this->db->where('id_os', $idOs)->where('tipo', $tipo)
            ->get('tabela_os_checklist_status')->row_array();
    }

    public function finalizar_checklist($idOs, $tipo, $observacao, $acao = 'autorizar')
    {
        $status = $this->get_status_by_os_tipo($idOs, $tipo);

        if (empty($status) || !$status['bloqueado']) {
            return false;
        }

        $autorizar = $acao === 'autorizar';
        $novoStatusOs = $tipo === 'inicio'
            ? ($autorizar ? 'aberta' : 'bloqueada')
            : ($autorizar ? 'fechada' : 'bloqueada');

        $this->db->trans_start();

        $this->db->where('id', $status['id'])->update('tabela_os_checklist_status', [
            'bloqueado' => $autorizar ? 0 : 1,
            'observacao' => $observacao,
            'data_finalizacao' => $autorizar ? date('Y-m-d H:i:s') : null,
        ]);

        $this->db->where('id', $idOs)->update('tabela_ordens_servico', [
            'status' => $novoStatusOs,
        ]);

        $this->db->trans_complete();
        return $this->db->trans_status() !== FALSE;
    }

    public function listarEletricistas()
    {
        $query = $this->db->select('id, nome')->from('tabela_eletricistas')->order_by('nome', 'ASC')->get();
        return $query === false ? [] : $query->result_array();
    }
}
