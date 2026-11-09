# Endpoints atuais da API EletroTech

Base: `/api/v1`. Sucesso usa `{ data, meta? }`; erro usa
`{ error: { code, message, details? } }`. Rotas protegidas exigem JWT Bearer.
Datas de calendário: `YYYY-MM-DD`; mês: `YYYY-MM`; ano: `YYYY`.
A matriz completa está em [operacao-e-permissoes.md](operacao-e-permissoes.md).

## Autenticação

| Método | Caminho | Regra |
| --- | --- | --- |
| POST | `/auth/login` | `{ nome, senha }`, usuário ou CPF; devolve usuário/token e cookie de renovação |
| GET | `/auth/me` | Perfil atual consultado no banco |
| POST | `/auth/refresh` | Cookie HttpOnly; rotaciona sessão e emite access token |
| POST | `/auth/logout` | Revoga sessões e tokens da conta, limpa cookie |

## Pessoas e supervisão

| Método | Caminho | Regra |
| --- | --- | --- |
| GET | `/usuarios?page=1&pageSize=10` | Admin; paginação em `meta` |
| POST | `/usuarios` | Admin; `{ usuario, senha, perfil, permissoes, eletricista_id? }` |
| PUT | `/usuarios/:id` | Admin; edição parcial, proteção do último admin |
| DELETE | `/usuarios/:id` | Admin; preserva usuários referenciados no histórico |
| GET | `/supervisores` | Admin; `{ supervisores: [{ id,usuario,equipe }], eletricistasAtivos }` |
| POST | `/supervisores` | Admin; `{ usuario,senha }` |
| PUT | `/supervisores/:id` | Admin; `{ usuario,senha? }` |
| PUT | `/supervisores/:id/equipe` | Admin; `{ eletricistaIds: [1,2], transferir: false }` substitui a equipe |
| GET | `/equipe` | Admin ou supervisor; nomes e quantidades de OS por estado no escopo permitido |
| GET | `/eletricistas?status=ativos` | Permissão `eletricistas`; cadastro, supervisor e indicadores |
| POST | `/eletricistas` | `{ nome,cpf,data_contratacao,senha }`; cria acesso na mesma transação |
| PUT | `/eletricistas/:id` | `{ nome?,senha? }`; pode ativar login antigo |
| PATCH | `/eletricistas/:id/demissao` | Desliga, remove associação e revoga sessões |
| PATCH | `/eletricistas/:id/reativacao` | Reativa; não recompõe associação |
| GET | `/eletricistas/:id/ordens-servico` | Histórico pela permissão de cadastro |

Supervisor não recebe acesso ao cadastro administrativo de eletricistas. Opções
de atribuição têm rotas próprias e retornam apenas ID/nome no seu escopo.

## Produtos e movimentações

| Método | Caminho | Regra |
| --- | --- | --- |
| GET / POST | `/produtos` | Permissão `produtos`; cadastrar com `{ nome_produto,vlr_unitario,qtd_estoque }` |
| PUT | `/produtos/:id` | Nome e valor unitário |
| POST | `/produtos/:id/zerar-estoque` | Saída manual transacional |
| POST | `/produtos/:id/entrada-estoque` | `{ qtd_estoque }`, entrada transacional |
| GET | `/movimentacoes` | Permissão `baixas`; filtros `tipo,produtoId,dataInicio,dataFim` e aliases snake_case |
| GET | `/movimentacoes/opcoes` | ID/nome dos produtos para o filtro |
| GET | `/movimentacoes/totais` | Mesmos filtros da listagem |
| GET | `/movimentacoes/:id` | Detalhe de uma movimentação, incluindo `valor_total` |
| POST | `/movimentacoes/relatorio` | `{ ids: [1,2] }`, máximo 500; registros selecionados |
| GET | `/baixas/:id` | Permissão `baixas`; cabeçalho e itens da baixa |

## Metas

| Método | Caminho | Regra |
| --- | --- | --- |
| GET | `/metas` | Permissão `metas`; escopo por vínculo, com realizados e percentuais |
| GET | `/metas/opcoes` | Admin/supervisor; eletricistas ativos permitidos |
| POST | `/metas` | Admin/supervisor; profissional ativo no escopo |
| PUT | `/metas/:id` | Admin/supervisor; altera somente objetivos |
| DELETE | `/metas/:id` | Admin/supervisor; meta no escopo |

Filtros: `eletricistaId`, `tipo_periodo=mensal|anual`, `periodo`. Aliases legados
`filtro_eletricista`, `filtro_mes`, `mes` continuam aceitos.

Exemplo de criação mensal:

```json
{
  "eletricista_meta": 1,
  "tipo_periodo": "mensal",
  "mes_meta": "2026-11",
  "qtd_os_meta": 20,
  "vlr_meta": 15000
}
```

Para anual, use `tipo_periodo: "anual"` e `mes_meta: "2026"`. Pode informar apenas
quantidade ou faturamento. A resposta inclui `os_realizadas`,
`faturamento_realizado`, `progresso_os` e `progresso_faturamento`.

## Checklists e pendências

| Método | Caminho | Regra |
| --- | --- | --- |
| GET | `/checklists?tipo=&titulo=` | Permissão `checklist`; inclui `qtd_perguntas` |
| GET | `/checklists/selecionados` | Modelos padrão |
| GET | `/checklists/:id/perguntas` | `texto_pergunta` e alias `pergunta` |
| POST | `/checklists` | Admin/supervisor; título, tipo e perguntas |
| PUT | `/checklists/selecao` | Admin/supervisor; `{ id_checklist,tipo }` |
| DELETE | `/checklists/:id` | Admin/supervisor; bloqueia modelos selecionados ou já utilizados |
| GET | `/checklists/pendencias/opcoes` | Admin/supervisor; opções de equipe |
| GET | `/checklists/pendencias` | Admin/supervisor; bloqueios no escopo |
| POST | `/checklists/pendencias/:idOs/:tipo/resolucao` | `{ acao: "autorizar" ou "negar", observacao }` |
| GET | `/checklists/pendencias/:idOs/:tipo/relatorio` | OS, pendência e respostas no escopo |

Pendências aceitam filtros `tipo`, `eletricistaId` e `ordenar` (`data_desc`,
`data_asc`, `os_asc`, `os_desc`, `eletricista_asc`, `eletricista_desc`).

Criação aceita arrays legados `pergunta`, `tipo_resposta`, `bloqueia_abertura`,
ou `perguntas: [{ texto,tipoResposta,bloqueiaAbertura }]`. Tipos `radio`/`text`;
condição de bloqueio `sim`/`nao` ou nula. Os modelos são compartilhados da empresa,
mas os dados operacionais de pendências são filtrados pela equipe.

## Ordens de serviço

| Método | Caminho | Regra |
| --- | --- | --- |
| GET | `/ordens-servico?page=&pageSize=&status=&eletricistaId=` | Permissão `ordemServico`; escopo por perfil |
| GET | `/ordens-servico/opcoes` | Eletricistas ativos permitidos, produtos e checklists |
| POST | `/ordens-servico` | Admin/supervisor; `{ eletricista_os,data_os?,descricao?,local_servico?,valor_servico? }` |
| GET | `/ordens-servico/:id` | OS, materiais, respostas, comentários, pendências, eventos e fotos |
| PUT | `/ordens-servico/:id` | Admin/supervisor; descrição, local e valor antes de fechar |
| POST | `/ordens-servico/:id/abertura` | Dono/admin/supervisor autorizado; materiais e checklist inicial |
| POST | `/ordens-servico/:id/fechamento` | Dono/admin/supervisor autorizado; checklist final, OS aberta e sem pendências |
| POST | `/ordens-servico/:id/bloqueio` | Admin/supervisor; `{ motivo }`, OS solicitada ou aberta |
| POST | `/ordens-servico/:id/comentarios` | Comentário e/ou foto, registro adicional |
| GET | `/ordens-servico/:id/fotos/:fotoId` | Conteúdo binário autenticado, mesma restrição da OS |

A listagem devolve `{ ordensServico, paginacao, eletricistasAtivos,
produtosDisponiveis, checklistInicio, checklistFim, podeSolicitar }` em `data`.
Status válidos: solicitada, aberta, bloqueada, fechada.

Abertura aceita JSON:

```json
{
  "itens": [{ "produtoId": 1, "quantidade": 2 }],
  "checklistRespostas": { "11": "sim" }
}
```

Materiais são opcionais (`itens: []`). Formulários legados `id_produto[]` e
`qtd_utilizada[]` também são aceitos. Fechamento recebe `checklistRespostas` e
`motivos` por ID de pergunta. Para fotos, envie multipart com campo `foto`;
`itens`, `checklistRespostas` e `motivos` são strings JSON nesse formato.
JPG/PNG/GIF/WebP até 8 MB, uma foto por operação. Formatos binários são conferidos.

## Baixas manuais

Todas as rotas abaixo exigem admin. Escrita é limitada ao criador do rascunho.

| Método | Caminho | Regra |
| --- | --- | --- |
| GET | `/lancamentos` | Produtos, eletricistas, abas com rascunhos próprios e histórico |
| POST | `/lancamentos` | `{ tipo,data_baixa,id_eletricista,observacao? }` |
| POST | `/lancamentos/:id/itens` | `{ id_produto,quantidade,valor_unitario }` |
| DELETE | `/lancamentos/:id/itens/:itemId` | Remove somente do rascunho próprio |
| POST | `/lancamentos/:id/finalizacao` | Aplica estoque uma única vez |
| POST | `/lancamentos/:id/cancelamento` | Cancela sem aplicar estoque |
| GET | `/lancamentos/:id/relatorio` | Cabeçalho e itens para impressão |

## Dashboard e assistente

`GET /dashboard?mes=YYYY-MM` exige `menu`, retorna indicadores e gráficos no
escopo do usuário e metas mensais/anuais do período. O filtro mensal se aplica
aos indicadores operacionais; o acompanhamento anual mantém o ano correspondente.
OS concluídas e faturamento usam data de fechamento.

`POST /chat` recebe `{ mensagem }`, devolve `{ resposta }` e usa `FLOWISE_API_URL`.
Bloqueado para eletricistas. Configuração ausente: 503. Falha do serviço: 502.

## Erros e compatibilidade

401: sessão ausente/expirada/revogada. 403: papel/equipe insuficientes.
404: recurso ausente ou rascunho de outro admin. 409: conflito de estado,
duplicação, transferência não confirmada ou estoque insuficiente.
422: dados inválidos. 413: foto acima do limite. 429: limite de login.
500: falha interna sem expor SQL ou credenciais.

O frontend atual consome apenas a API REST. Os antigos links e formulários PHP
foram substituídos. Relatórios são renderizados no cliente após consulta
autenticada e impressos pelo navegador.
