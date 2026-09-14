<?php

/** @var string $paginacao   */
/** @var int    $total_rows   */
/** @var int    $offset      */
/** @var int    $por_pagina   */


$paginacao  = isset($paginacao) ? $paginacao : '';
$total_rows = isset($total_rows) ? (int) $total_rows : 0;
$offset     = isset($offset) ? (int) $offset : 0;
$por_pagina = isset($por_pagina) && $por_pagina > 0 ? (int) $por_pagina : 10;

if ($total_rows <= $por_pagina) {
    return;
}
?>
<style>
    .rodape-paginacao {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 15px;
        margin: 20px 0 40px 0;
    }

    .rodape-paginacao .contagem {
        color: #a0a0a0;
        font-size: 14px;
    }

    .rodape-paginacao .page-link {
        background-color: #282828;
        border-color: #555;
        color: #ffffff;
    }

    .rodape-paginacao .page-link:hover {
        background-color: #FBD814;
        border-color: #FBD814;
        color: #282828;
    }

    .rodape-paginacao .page-item.active .page-link {
        background-color: #FBD814;
        border-color: #FBD814;
        color: #282828;
        font-weight: bold;
    }

    @media print {
        .rodape-paginacao {
            display: none;
        }
    }
</style>

<div class="rodape-paginacao">
    <nav><?= $paginacao ?></nav>
    <span class="contagem">
        Mostrando <?= $offset + 1 ?>–<?= min($offset + $por_pagina, $total_rows) ?> de <?= $total_rows ?> registros
    </span>
</div>