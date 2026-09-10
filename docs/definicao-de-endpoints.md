# Definição de Endpoints — Migração EletroTech (Node.js + React)

> Documento de referência para a migração do sistema **EletroTech** de
> **PHP / CodeIgniter 3 (MVC com páginas server-side)** para uma
> **API REST em Node.js** consumida por um **SPA em React**.
>
> A aplicação atual não expõe uma API: cada "endpoint" é uma ação de
> controller que processa `POST` de formulário e responde com `redirect` +
> `flashdata`. Nesta migração todas as telas passam a consumir JSON.

---

## 1. Convenções gerais

| Item | Definição |
|---|---|
| Base URL | `/api/v1` |
| Formato | JSON em request e response (`Content-Type: application/json`), exceto upload de arquivos (`multipart/form-data`) |
| Autenticação | JWT via header `Authorization: Bearer <token>` (access token curto) + refresh token em cookie `httpOnly` |
| Autorização | Middleware por permissão (ver §3). Claims do token: `sub`, `usuario`, `isAdmin`, `eletricistaId`, `permissoes[]` |
| Paginação | Query `?page=1&pageSize=10`. Resposta inclui `meta: { page, pageSize, total, totalPages }` |
| Ordenação / filtro | Query string (`?tipo=inicio&ordenar=data_desc`) |
| Datas | ISO-8601 (`YYYY-MM-DD` para datas, `YYYY-MM-DDTHH:mm:ssZ` para timestamps) |
| Valores monetários | `number` com 2 casas decimais |
| IDs | inteiros |

### 1.1. Envelope de resposta

Sucesso:
```json
{ "data": { }, "meta": { } }
```

Erro:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem legível para o usuário",
    "details": [
      { "field": "cpf", "message": "CPF deve ter 11 dígitos" }
    ]
  }
}
```

### 1.2. Códigos HTTP usados

| Código | Uso |
|---|---|
| 200 | Consulta / atualização bem-sucedida |
| 201 | Recurso criado |
| 204 | Exclusão / ação sem corpo de resposta |
| 400 | Erro de validação / regra de negócio |
| 401 | Sem token ou token inválido/expirado |
| 403 | Autenticado, mas sem permissão para a ação |
| 404 | Recurso inexistente |
| 409 | Conflito (ex.: CPF/usuário duplicado, rascunho de baixa já aberto) |
| 422 | Entidade não processável (ex.: comentário sem texto e sem foto) |
| 429 | Rate limit de login excedido |
| 500 | Erro interno |

---

## 2. Autenticação

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | pública | Autentica por usuário **ou** CPF do eletricista vinculado |
| `POST` | `/api/v1/auth/logout` | Bearer | Invalida o refresh token atual |
| `POST` | `/api/v1/auth/refresh` | cookie refresh | Emite novo access token |
| `GET` | `/api/v1/auth/me` | Bearer | Retorna usuário logado, `isAdmin`, `eletricistaId` e `permissoes[]` |

**`POST /auth/login`**
```json
// request
{ "login": "Eloi", "senha": "********" }

// 200
{
  "data": {
    "accessToken": "jwt...",
    "usuario": {
      "id": 49, "usuario": "Eloi", "nomeExibicao": "Eloi",
      "isAdmin": true, "eletricistaId": null,
      "permissoes": ["menu","ordemServico","checklist","produtos","baixas","metas","eletricistas"],
      "rotaInicial": "/dashboard"
    }
  }
}
```
Regras herdadas do `AuthController`:
- Rate limit: 5 tentativas / 60s por sessão-IP → `429`.
- Eletricista com `data_demissao` preenchida → `403` (acesso desativado).
- Usuário sem nenhuma permissão liberada → `403` com mensagem específica.
- Admin recebe todas as permissões de `permissoes_disponiveis()`.

---

## 3. Permissões

Chaves de permissão (tabela `tabela_usuario_permissao`, iguais às atuais):

| Chave | Área | Observação |
|---|---|---|
| `menu` | Dashboard | Padrão do eletricista |
| `ordemServico` | Ordens de Serviço | Padrão do eletricista; escopo por `eletricistaId` quando não-admin |
| `checklist` | Checklist + Consulta Checklist | |
| `produtos` | Produtos | |
| `baixas` | Baixas / Movimentações | |
| `metas` | Metas | |
| `eletricistas` | Eletricistas | |
| *(admin)* | Usuários, Lançamentos de baixa | Exigem `isAdmin === true` |

Middlewares sugeridos: `requireAuth`, `requirePermissao('produtos')`, `requireAdmin`.

---

## 4. Usuários  *(admin)*

Origem: `UsuariosController` + `UsuarioModel`.

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/usuarios` | admin | Lista paginada de usuários com permissões e vínculo de eletricista |
| `GET` | `/api/v1/usuarios/:id` | admin | Detalhe de um usuário |
| `POST` | `/api/v1/usuarios` | admin | Cria usuário |
| `PUT` | `/api/v1/usuarios/:id` | admin | Atualiza dados, permissões e (opcional) senha |
| `DELETE` | `/api/v1/usuarios/:id` | admin | Exclui usuário |

**`POST /usuarios`**
```json
{
  "usuario": "joao",
  "senha": "********",          // min 8
  "isAdmin": false,
  "eletricistaId": 2,           // opcional; único por usuário
  "permissoes": ["menu","ordemServico"]
}
```
Regras: `409` se `usuario` já existe ou se `eletricistaId` já está vinculado;
`400` se remover o `isAdmin` do **último administrador** (`ehUltimoAdmin`);
mesma trava vale para `DELETE` e `PUT`.

---

## 5. Eletricistas

Origem: `EletricistasController` + `EletricistasModel`.

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/eletricistas` | `eletricistas` | Lista paginada (ativos + demitidos, com histórico) |
| `GET` | `/api/v1/eletricistas?status=ativos` | `eletricistas` | Filtro para selects de vínculo |
| `GET` | `/api/v1/eletricistas/:id` | `eletricistas` | Detalhe |
| `POST` | `/api/v1/eletricistas` | `eletricistas` | Cadastra eletricista **e cria o usuário de acesso** (login = CPF) |
| `PUT` | `/api/v1/eletricistas/:id` | `eletricistas` | Edita nome e, opcionalmente, a senha de acesso |
| `PATCH` | `/api/v1/eletricistas/:id/demissao` | `eletricistas` | Demite (`data_demissao = hoje`) |
| `PATCH` | `/api/v1/eletricistas/:id/reativacao` | `eletricistas` | Reativa (`data_demissao = null`) |
| `GET` | `/api/v1/eletricistas/:id/ordens-servico` | `eletricistas` | Histórico de OS do eletricista |

**`POST /eletricistas`**
```json
{
  "cpf": "07574900345",          // 11 dígitos, numérico, único
  "nome": "Lucas",
  "dataContratacao": "2025-03-15",
  "senha": "********"             // min 8 — senha do usuário criado junto
}
```
Regras: `409` se CPF já cadastrado; criação do eletricista + usuário deve ser
transacional.

---

## 6. Produtos

Origem: `ProdutosController` + `ProdutosModel`.

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/produtos` | `produtos` | Lista paginada com `qtdEstoque` e `vlrUnitario` |
| `GET` | `/api/v1/produtos/:id` | `produtos` | Detalhe |
| `POST` | `/api/v1/produtos` | `produtos` | Cadastra produto (estoque inicial gera movimentação de entrada) |
| `PUT` | `/api/v1/produtos/:id` | `produtos` | Edita nome e valor unitário |
| `POST` | `/api/v1/produtos/:id/zerar-estoque` | `produtos` | Zera estoque gerando movimentação de saída |
| `POST` | `/api/v1/produtos/:id/entrada-estoque` | `produtos` | Repõe estoque gerando movimentação de entrada |

**`POST /produtos`**
```json
{ "nomeProduto": "Cabo Flexível 2.5mm", "vlrUnitario": 120.50, "qtdEstoque": 50 }
```
**`POST /produtos/:id/entrada-estoque`**
```json
{ "quantidade": 40, "valorUnitario": 10.90, "origem": "Reposição de estoque" }
```
Regras: toda alteração de estoque grava linha em `tabela_movimentacoes`
(ledger). `quantidade > 0`. Operações transacionais.

---

## 7. Metas

Origem: `MetasController` + `MetasModel`.

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/metas?eletricistaId=&mes=YYYY-MM` | `metas` | Lista paginada com filtros opcionais |
| `POST` | `/api/v1/metas` | `metas` | Cadastra meta |
| `PUT` | `/api/v1/metas/:id` | `metas` | Atualiza **apenas** `vlrMeta` |
| `DELETE` | `/api/v1/metas/:id` | `metas` | Exclui meta |

**`POST /metas`**
```json
{ "eletricistaId": 2, "mes": "2026-08", "vlrMeta": 3000.00 }
```

---

## 8. Checklist (configuração)

Origem: `ChecklistController` + `ChecklistModel`.

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/checklists?tipo=inicio&titulo=` | `checklist` | Lista com filtros |
| `GET` | `/api/v1/checklists/:id/perguntas` | `checklist` | Perguntas de um checklist |
| `GET` | `/api/v1/checklists/selecionados` | `checklist` | Checklist ativo de `inicio` e de `fim` |
| `POST` | `/api/v1/checklists` | `checklist` | Cria checklist com perguntas |
| `PUT` | `/api/v1/checklists/selecao` | `checklist` | Define qual checklist é o padrão de um tipo |
| `DELETE` | `/api/v1/checklists/:id` | `checklist` | Exclui checklist e perguntas (cascade) |

**`POST /checklists`**
```json
{
  "titulo": "Checklist de abertura",
  "tipo": "inicio",                       // inicio | fim
  "perguntas": [
    { "texto": "EPI em uso?", "tipoResposta": "radio", "bloqueiaAbertura": "nao", "ordem": 1 },
    { "texto": "Observações", "tipoResposta": "text", "bloqueiaAbertura": null, "ordem": 2 }
  ]
}
```
**`PUT /checklists/selecao`**
```json
{ "checklistId": 4, "tipo": "inicio" }
```

---

## 9. Consulta de Checklist (pendências / bloqueios)

Origem: `ConsultaChecklistController` + `ChecklistModel` (usa permissão `checklist`).

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/checklists/pendencias?tipo=&eletricistaId=&ordenar=data_desc` | `checklist` | Lista OS com checklist bloqueado aguardando revisão |
| `POST` | `/api/v1/checklists/pendencias/:idOs/:tipo/resolucao` | `checklist` | Autoriza ou nega a pendência |
| `GET` | `/api/v1/checklists/pendencias/:idOs/:tipo/relatorio` | `checklist` | Relatório das respostas do checklist da OS |

**`POST .../resolucao`**
```json
{ "acao": "autorizar", "observacao": "Revisado com o encarregado." }  // acao: autorizar | negar
```

---

## 10. Ordens de Serviço

Origem: `OrdensServicoController` + `OrdemservicoModel` + `ChecklistModel`.

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/ordens-servico?page=&pageSize=` | `ordemServico` | Lista paginada. Não-admin vê apenas as próprias (`eletricistaId`) |
| `GET` | `/api/v1/ordens-servico/opcoes` | `ordemServico` | Dados p/ formulários: eletricistas ativos, produtos disponíveis, checklists selecionados, `podeSolicitar` |
| `GET` | `/api/v1/ordens-servico/:id` | `ordemServico` | Detalhe: cabeçalho, materiais, respostas de checklist, comentários |
| `POST` | `/api/v1/ordens-servico` | admin | **Solicita** OS (status `solicitada`) |
| `POST` | `/api/v1/ordens-servico/:id/abertura` | `ordemServico` (dono ou admin) | Abre a OS: consome estoque + grava checklist de início |
| `POST` | `/api/v1/ordens-servico/:id/fechamento` | `ordemServico` (dono ou admin) | Fecha a OS: grava checklist de fim |
| `POST` | `/api/v1/ordens-servico/:id/comentarios` | `ordemServico` (dono ou admin) | Adiciona comentário e/ou foto (`multipart/form-data`) |

**`POST /ordens-servico`** (solicitar — admin)
```json
{ "eletricistaId": 2, "dataOs": "2026-07-20" }   // dataOs opcional (YYYY-MM-DD)
```

**`POST /ordens-servico/:id/abertura`** — `multipart/form-data`
| Campo | Tipo | Regra |
|---|---|---|
| `itens` | JSON string: `[{ "produtoId": 3, "quantidade": 30 }]` | quantidade > 0; produto não repetido |
| `checklistRespostas` | JSON string: `{ "<perguntaId>": "sim" \| "nao" \| "<texto>" }` | todas obrigatórias; radio só aceita sim/nao |
| `fotoAbertura` | file (opcional) | jpg/jpeg/png/gif/webp, ≤ 8 MB |

Regras: só OS com status `solicitada` pode ser aberta; precisa existir checklist
de início selecionado; se alguma resposta `bloqueia`, a OS abre mas fica
`bloqueada`/pendente em Consulta Checklist; baixa de estoque é atômica → `400` se
estoque insuficiente.

**`POST /ordens-servico/:id/fechamento`** — `multipart/form-data`
| Campo | Tipo | Regra |
|---|---|---|
| `checklistRespostas` | JSON string `{ "<perguntaId>": "sim"\|"nao"\|"<texto>" }` | todas obrigatórias |
| `fotoFechamento` | file (opcional) | mesmas regras de upload |

**`POST /ordens-servico/:id/comentarios`** — `multipart/form-data`
| Campo | Tipo | Regra |
|---|---|---|
| `comentario` | string | obrigatório se não houver foto |
| `foto` | file | obrigatório se não houver comentário; gera thumbnail `_thumb` |

Respostas: `422` se sem texto e sem foto; `403` se a OS não pertence ao eletricista.

---

## 11. Baixas / Movimentações (consulta e relatórios)

Origem: `BaixasController` + `BaixasModel`.

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/movimentacoes?tipo=&produtoId=&dataInicio=&dataFim=&page=` | `baixas` | Lista de entradas/saídas com filtros |
| `GET` | `/api/v1/movimentacoes/totais?...` | `baixas` | Totais agregados (qtd e valor) para os mesmos filtros |
| `POST` | `/api/v1/movimentacoes/relatorio` | `baixas` | Relatório misto a partir de uma lista de IDs |
| `GET` | `/api/v1/baixas/:id` | `baixas` | Detalhe de uma baixa (cabeçalho + itens) |

**`POST /movimentacoes/relatorio`**
```json
{ "ids": [12, 18, 22] }
```

---

## 12. Lançamentos de Baixa (fluxo de rascunho)  *(admin)*

Origem: `LancamentosController` + `BaixasModel`. Fluxo: abrir → incluir/remover itens → finalizar (ou cancelar).

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/lancamentos` | admin | Estado da tela: produtos, eletricistas, rascunho aberto de `entrada` e de `saida` com itens |
| `POST` | `/api/v1/lancamentos` | admin | Abre uma baixa (rascunho) de um tipo |
| `POST` | `/api/v1/lancamentos/:idBaixa/itens` | admin | Inclui item no rascunho |
| `DELETE` | `/api/v1/lancamentos/:idBaixa/itens/:idItem` | admin | Remove item do rascunho |
| `POST` | `/api/v1/lancamentos/:idBaixa/finalizacao` | admin | Finaliza: aplica movimentações no estoque |
| `POST` | `/api/v1/lancamentos/:idBaixa/cancelamento` | admin | Cancela o rascunho (não altera estoque) |
| `GET` | `/api/v1/lancamentos/:idBaixa/relatorio` | admin | Relatório da baixa finalizada |

**`POST /lancamentos`**
```json
{ "tipo": "saida", "dataBaixa": "2026-07-21", "eletricistaId": 2, "observacao": "..." }
```
Regras: `dataBaixa` válida e não futura; eletricista ativo; `409` se o usuário já
tem rascunho aberto do mesmo tipo.

**`POST /lancamentos/:idBaixa/itens`**
```json
{ "produtoId": 4, "quantidade": 50, "valorUnitario": 10.90 }
```

**`POST /lancamentos/:idBaixa/finalizacao`** — respostas possíveis:
| Resultado | HTTP | Mensagem |
|---|---|---|
| OK | 200 | Baixa finalizada; retorna `relatorioUrl` |
| Sem itens | 400 | "Inclua pelo menos um material..." |
| Sem saldo | 400 | "Estoque insuficiente de `<produto>`..." |
| Erro | 500 | "Erro ao finalizar a baixa." |

Somente o dono do rascunho (`idUsuario`) pode incluir/remover/finalizar/cancelar → senão `404`.

---

## 13. Dashboard

Origem: `MenuController` + `HomeController` + `DashboardModel`.

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/dashboard?mes=YYYY-MM` | `menu` | Payload consolidado do dashboard. Admin vê tudo; eletricista vê versão pessoal (escopo por `eletricistaId`) |

Resposta agrega os métodos do `DashboardModel`:
```json
{
  "data": {
    "totais": { "eletricistas": 2, "produtos": 7, "osAbertas": 5, "osFechadas": 0 },
    "produtosUtilizados": [ { "nome": "Fita Isolante 3M", "quantidade": 30 } ],
    "metaAtual": { "mes": "2026-08", "valor": 3000.00, "realizado": 1200.00 },
    "osPorEletricista": [ { "eletricista": "Lucas", "total": 8 } ],
    "movimentacaoPorMes": [ { "mes": "2026-07", "entrada": 10120, "saida": 111 } ],
    "osPorStatus": [ { "status": "aberta", "total": 5 } ],
    "osPorMes": [ { "mes": "2026-07", "total": 2 } ]
  }
}
```

---

## 14. Assistente de IA (Chat)

Origem: `ChatController` (proxy para Flowise).

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/chat` | Bearer | Encaminha a pergunta para o Flowise (`FLOWISE_API_URL`) e devolve a resposta |

```json
// request
{ "mensagem": "Como abrir uma OS?" }
// 200
{ "data": { "resposta": "Para abrir uma OS..." } }
// erros -> 400 (mensagem vazia), 502 (falha de comunicação / HTTP != 200 do Flowise)
```
`FLOWISE_API_URL` deve vir de variável de ambiente do backend (nunca exposta ao React).

---

## 15. Uploads / arquivos estáticos

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/uploads/os/:arquivo` | Serve foto original da OS |
| `GET` | `/uploads/os/:arquivo` (`_thumb`) | Serve a miniatura gerada |

Sugestão: em produção, mover para storage de objetos (S3/MinIO) e retornar URLs
assinadas; manter `multer` + disco local em desenvolvimento.

---

## 16. Mapa de migração (rota antiga → endpoint novo)

| CI3 (atual) | Método | Endpoint novo |
|---|---|---|
| `POST /auth/entrar` | POST | `/api/v1/auth/login` |
| `GET /auth/sair` | POST | `/api/v1/auth/logout` |
| `GET /home`, `GET /menu` | GET | `/api/v1/dashboard` |
| `GET /usuarios` | GET | `/api/v1/usuarios` |
| `POST /usuarios/criar` | POST | `/api/v1/usuarios` |
| `POST /usuarios/editar` | PUT | `/api/v1/usuarios/:id` |
| `GET /usuarios/excluir/{id}` | DELETE | `/api/v1/usuarios/:id` |
| `GET /eletricistas` | GET | `/api/v1/eletricistas` |
| `POST /eletricistas/cadastrar` | POST | `/api/v1/eletricistas` |
| `POST /eletricistas/editar` | PUT | `/api/v1/eletricistas/:id` |
| `GET /eletricistas/demitir/{id}` | PATCH | `/api/v1/eletricistas/:id/demissao` |
| `GET /eletricistas/reativar/{id}` | PATCH | `/api/v1/eletricistas/:id/reativacao` |
| `GET /eletricistas/historico_os/{id}` | GET | `/api/v1/eletricistas/:id/ordens-servico` |
| `POST /produtos/cadastrar` | POST | `/api/v1/produtos` |
| `POST /produtos/editar` | PUT | `/api/v1/produtos/:id` |
| `GET /produtos/ZerarEstoque/{id}` | POST | `/api/v1/produtos/:id/zerar-estoque` |
| `POST /produtos/aumentarQtdEstoque/{id}` | POST | `/api/v1/produtos/:id/entrada-estoque` |
| `GET /metas` | GET | `/api/v1/metas` |
| `POST /metas/cadastrar` | POST | `/api/v1/metas` |
| `POST /metas/editar` | PUT | `/api/v1/metas/:id` |
| `GET /metas/excluir/{id}` | DELETE | `/api/v1/metas/:id` |
| `GET /checklist` | GET | `/api/v1/checklists` |
| `POST /checklist/cadastrar` | POST | `/api/v1/checklists` |
| `POST /checklist/selecionar` | PUT | `/api/v1/checklists/selecao` |
| `GET /checklist/perguntas/{id}` | GET | `/api/v1/checklists/:id/perguntas` |
| `GET /checklist/excluir/{id}` | DELETE | `/api/v1/checklists/:id` |
| `GET /consultachecklist` | GET | `/api/v1/checklists/pendencias` |
| `POST /consultachecklist/finalizar` | POST | `/api/v1/checklists/pendencias/:idOs/:tipo/resolucao` |
| `GET /consultachecklist/relatorio/{idOs}/{tipo}` | GET | `/api/v1/checklists/pendencias/:idOs/:tipo/relatorio` |
| `GET /ordemServico` | GET | `/api/v1/ordens-servico` |
| `POST /ordemServico/solicitar` | POST | `/api/v1/ordens-servico` |
| `POST /ordemServico/abrir` | POST | `/api/v1/ordens-servico/:id/abertura` |
| `POST /ordemServico/fechar` | POST | `/api/v1/ordens-servico/:id/fechamento` |
| `GET /ordemServico/detalhes/{id}` | GET | `/api/v1/ordens-servico/:id` |
| `POST /ordemServico/adicionarComentario` | POST | `/api/v1/ordens-servico/:id/comentarios` |
| `GET /baixas` | GET | `/api/v1/movimentacoes` |
| `POST /baixas/relatorio_misto` | POST | `/api/v1/movimentacoes/relatorio` |
| `GET /baixas/detalhes/{id}` | GET | `/api/v1/baixas/:id` |
| `GET /lancamentos` | GET | `/api/v1/lancamentos` |
| `POST /lancamentos/abrir` | POST | `/api/v1/lancamentos` |
| `POST /lancamentos/incluir_item` | POST | `/api/v1/lancamentos/:idBaixa/itens` |
| `POST /lancamentos/remover_item` | DELETE | `/api/v1/lancamentos/:idBaixa/itens/:idItem` |
| `POST /lancamentos/finalizar` | POST | `/api/v1/lancamentos/:idBaixa/finalizacao` |
| `POST /lancamentos/cancelar` | POST | `/api/v1/lancamentos/:idBaixa/cancelamento` |
| `GET /lancamentos/relatorio/{id}` | GET | `/api/v1/lancamentos/:idBaixa/relatorio` |
| `POST /chat/enviar` | POST | `/api/v1/chat` |

---

## 17. Entidades (referência rápida do banco atual)

| Tabela | Descrição |
|---|---|
| `tabela_usuarios` | Contas de acesso (`usuario`, `senha` bcrypt, `is_admin`, `eletricista_id`) |
| `tabela_usuario_permissao` | Permissões por usuário (chave composta `usuario_id` + `permissao`) |
| `tabela_eletricistas` | Funcionários técnicos (`cpf` único, `data_contratacao`, `data_demissao`) |
| `tabela_produtos` | Catálogo + `qtd_estoque` + `vlr_unitario` |
| `tabela_movimentacoes` | Ledger de estoque (entrada/saida, origem, `id_os`/`id_baixa`) |
| `tabela_metas` | Meta mensal por eletricista (`mes_meta` `YYYY-MM`, `vlr_meta`) |
| `tabela_checklist` | Checklist (`tipo` inicio/fim, `selecionado`) |
| `tabela_checklist_perguntas` | Perguntas (`tipo_resposta` radio/text, `bloqueia_abertura`) |
| `tabela_ordens_servico` | OS (`status` solicitada/aberta/bloqueada/fechada) |
| `tabela_os_materiais` | Materiais consumidos por OS |
| `tabela_os_checklist_respostas` | Respostas de checklist da OS |
| `tabela_os_checklist_status` | Bloqueio/pendência de checklist por OS e tipo |
| `tabela_os_comentarios` | Comentários e fotos da OS |
| `tabela_baixas` | Cabeçalho da baixa (`status` rascunho/finalizada/cancelada) |
| `tabela_baixa_itens` | Itens da baixa |

> Recomendação: manter os nomes das tabelas na primeira fase da migração (menor
> risco) e padronizar via camada de ORM (ex.: Prisma `@@map` / Sequelize
> `tableName`), deixando o código em `camelCase`.
