<?php
defined('BASEPATH') or exit('No direct script access allowed');

class UsuarioModel extends CI_Model
{
    public function listarUsuarios($limite = null, $offset = 0)
    {
        $this->db
            ->select('u.id, u.usuario, u.is_admin, u.eletricista_id, e.nome AS eletricista_nome')
            ->from('tabela_usuarios u')
            ->join('tabela_eletricistas e', 'e.id = u.eletricista_id', 'left')
            ->order_by('u.id', 'DESC');

        if ($limite !== null) {
            $this->db->limit($limite, $offset);
        }

        return $this->db->get()->result();
    }

    public function contarUsuarios()
    {
        return $this->db->count_all_results('tabela_usuarios');
    }

    public function buscarUsuarioPorId($id)
    {
        return $this->db
            ->select('u.id, u.usuario, u.is_admin, u.eletricista_id, e.nome AS eletricista_nome')
            ->from('tabela_usuarios u')
            ->join('tabela_eletricistas e', 'e.id = u.eletricista_id', 'left')
            ->where('u.id', (int) $id)
            ->get()
            ->row();
    }

    public function buscarUsuarioPorNome($nomeUsuario)
    {
        return $this->db
            ->select('id, senha')
            ->where('usuario', $nomeUsuario)
            ->get('tabela_usuarios')
            ->row();
    }

    // Login por nome de usuário ou CPF do eletricista vinculado.
    public function buscarPorLogin($identificador)
    {
        return $this->db
            ->select('u.id, u.usuario, u.senha, u.is_admin, u.eletricista_id, e.data_demissao, e.nome AS eletricista_nome')
            ->from('tabela_usuarios u')
            ->join('tabela_eletricistas e', 'e.id = u.eletricista_id', 'left')
            ->group_start()
                ->where('u.usuario', $identificador)
                ->or_where('e.cpf', $identificador)
            ->group_end()
            ->get()
            ->row();
    }

    public function buscarPorEletricista($eletricistaId)
    {
        return $this->db
            ->select('id, usuario, is_admin, eletricista_id')
            ->where('eletricista_id', (int) $eletricistaId)
            ->get('tabela_usuarios')
            ->row();
    }

    public function permissoesDoUsuario($usuarioId)
    {
        $linhas = $this->db
            ->select('permissao')
            ->where('usuario_id', (int) $usuarioId)
            ->get('tabela_usuario_permissao')
            ->result_array();

        return array_column($linhas, 'permissao');
    }

    public function usuarioExiste($nomeUsuario, $ignorarId = null)
    {
        $this->db->where('usuario', $nomeUsuario);

        if ($ignorarId !== null) {
            $this->db->where('id !=', (int) $ignorarId);
        }

        return $this->db->count_all_results('tabela_usuarios') > 0;
    }

    public function criarUsuario($nomeUsuario, $senha, $isAdmin = 0, $eletricistaId = null)
    {
        $ok = $this->db->insert('tabela_usuarios', array(
            'usuario'        => $nomeUsuario,
            'senha'          => password_hash($senha, PASSWORD_DEFAULT),
            'is_admin'       => $isAdmin ? 1 : 0,
            'eletricista_id' => ($eletricistaId !== null && $eletricistaId > 0) ? (int) $eletricistaId : null,
        ));

        return $ok ? (int) $this->db->insert_id() : false;
    }

    public function atualizarDados($id, $nomeUsuario, $isAdmin, $eletricistaId)
    {
        return $this->db
            ->where('id', (int) $id)
            ->update('tabela_usuarios', array(
                'usuario'        => $nomeUsuario,
                'is_admin'       => $isAdmin ? 1 : 0,
                'eletricista_id' => ($eletricistaId !== null && $eletricistaId > 0) ? (int) $eletricistaId : null,
            ));
    }

    public function redefinirSenha($id, $senha)
    {
        return $this->db
            ->where('id', (int) $id)
            ->update('tabela_usuarios', array('senha' => password_hash($senha, PASSWORD_DEFAULT)));
    }

    // Substitui o conjunto de permissões do usuário (ignora chaves inválidas).
    public function definirPermissoes($usuarioId, array $chaves)
    {
        $usuarioId = (int) $usuarioId;
        $this->db->delete('tabela_usuario_permissao', array('usuario_id' => $usuarioId));

        $validas = array_keys(permissoes_disponiveis());
        $linhas  = array();
        foreach (array_unique($chaves) as $chave) {
            if (in_array($chave, $validas, true)) {
                $linhas[] = array('usuario_id' => $usuarioId, 'permissao' => $chave);
            }
        }

        if (!empty($linhas)) {
            $this->db->insert_batch('tabela_usuario_permissao', $linhas);
        }

        return true;
    }

    public function ehUltimoAdmin($id)
    {
        $id = (int) $id;

        $u = $this->db->select('is_admin')->where('id', $id)->get('tabela_usuarios')->row();
        if (!$u || (int) $u->is_admin !== 1) {
            return false;
        }

        $outrosAdmins = $this->db
            ->where('is_admin', 1)
            ->where('id !=', $id)
            ->count_all_results('tabela_usuarios');

        return $outrosAdmins === 0;
    }

    public function eletricistaJaVinculado($eletricistaId, $ignorarUsuarioId = null)
    {
        $this->db->where('eletricista_id', (int) $eletricistaId);

        if ($ignorarUsuarioId !== null) {
            $this->db->where('id !=', (int) $ignorarUsuarioId);
        }

        return $this->db->count_all_results('tabela_usuarios') > 0;
    }

    public function excluirUsuario($id)
    {
        // db_debug off: com vínculo (FK) o delete retorna FALSE em vez de estourar erro
        $debugOriginal = $this->db->db_debug;
        $this->db->db_debug = false;

        $ok = $this->db->delete('tabela_usuarios', array('id' => (int) $id));

        $this->db->db_debug = $debugOriginal;

        return $ok;
    }
}
