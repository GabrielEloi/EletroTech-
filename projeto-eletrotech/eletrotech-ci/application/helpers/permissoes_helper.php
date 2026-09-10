<?php
defined('BASEPATH') or exit('No direct script access allowed');

if (!function_exists('permissoes_disponiveis')) {
    function permissoes_disponiveis()
    {
        return array(
            'menu'         => 'Dashboard',
            'ordemServico' => 'Ordens de Serviço',
            'checklist'    => 'Checklist',
            'produtos'     => 'Produtos',
            'baixas'       => 'Baixas',
            'metas'        => 'Metas',
            'eletricistas' => 'Eletricistas',
        );
    }
}

if (!function_exists('permissoes_padrao_eletricista')) {
    function permissoes_padrao_eletricista()
    {
        return array('menu', 'ordemServico');
    }
}

if (!function_exists('primeira_tela_liberada')) {
    function primeira_tela_liberada($ehAdmin, $permissoes)
    {
        if ($ehAdmin) {
            return 'menu';
        }

        foreach (array_keys(permissoes_disponiveis()) as $chave) {
            if (in_array($chave, (array) $permissoes, true)) {
                return $chave;
            }
        }

        return null;
    }
}

if (!function_exists('rota_inicial')) {
    function rota_inicial($ehAdmin, $permissoes)
    {
        return primeira_tela_liberada($ehAdmin, $permissoes) === null ? null : 'home';
    }
}
