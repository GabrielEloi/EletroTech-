# Estrutura de Pastas — Migração EletroTech (Node.js + React)

> Proposta de organização de diretórios para a migração do **EletroTech** de
> **PHP / CodeIgniter 3** para **Node.js (API REST)** no back-end e **React (SPA)**
> no front-end.
>
> A estrutura reflete os módulos que já existem hoje: `auth`, `usuarios`,
> `eletricistas`, `produtos`, `metas`, `checklist`, `ordens-servico`, `baixas`
> (movimentações + lançamentos), `dashboard` e `chat`.

---

## 1. Visão geral do repositório (monorepo)

```
projeto-eletrotech-2/
├── docs/                         # esta documentação
│   ├── definicao-de-endpoints.md
│   └── estrutura-de-pastas.md
├── backend/                      # API Node.js
├── frontend/                     # SPA React
├── db/                           # scripts e migrações de banco
│   ├── legacy/
│   │   └── banco-eletrotech.sql  # dump atual (referência)
│   └── migrations/
├── docker-compose.yml            # mysql + backend + frontend em dev
├── .editorconfig
├── .gitignore
└── README.md
```

> Alternativa: dois repositórios separados (`eletrotech-api` e `eletrotech-web`).
> O monorepo é recomendado nesta fase por facilitar manter contrato de API e
> tipos compartilhados sincronizados.

---

## 2. Back-end — `backend/`

Stack sugerida: **Node.js 20+ · Express · Prisma (ou Sequelize) · MySQL 8 ·
Zod (validação) · JWT · Multer (upload) · Jest/Vitest · ESLint + Prettier**.

Arquitetura em camadas: **route → controller → service → repository/model**.
Regras de negócio ficam nos *services* (equivalente aos `*Model.php` atuais que
concentram lógica + transações).

```
backend/
├── src/
│   ├── server.js                 # sobe o HTTP server
│   ├── app.js                    # cria o app Express, middlewares globais, monta /api/v1
│   │
│   ├── config/
│   │   ├── env.js                # leitura/validação das variáveis de ambiente (Zod)
│   │   ├── database.js           # instância do Prisma/Sequelize
│   │   ├── logger.js             # pino/winston
│   │   └── upload.js             # config do multer (destino, limites, mimetypes)
│   │
│   ├── middlewares/
│   │   ├── auth.js               # requireAuth (valida JWT, injeta req.user)
│   │   ├── authorize.js          # requirePermissao('produtos'), requireAdmin
│   │   ├── validate.js           # valida body/params/query com schema Zod
│   │   ├── errorHandler.js       # captura erros e devolve o envelope padrão
│   │   ├── notFound.js
│   │   └── rateLimit.js          # limite de tentativas de login
│   │
│   ├── modules/                  # um diretório por domínio de negócio
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js       # login (usuario ou CPF), refresh, rota inicial
│   │   │   ├── auth.schema.js        # schemas Zod (login, refresh)
│   │   │   └── auth.test.js
│   │   │
│   │   ├── usuarios/
│   │   │   ├── usuarios.routes.js
│   │   │   ├── usuarios.controller.js
│   │   │   ├── usuarios.service.js   # regra "último admin", vínculo de eletricista
│   │   │   ├── usuarios.repository.js
│   │   │   ├── usuarios.schema.js
│   │   │   └── usuarios.test.js
│   │   │
│   │   ├── eletricistas/
│   │   │   ├── eletricistas.routes.js
│   │   │   ├── eletricistas.controller.js
│   │   │   ├── eletricistas.service.js   # cadastro cria usuário (login = CPF), demitir/reativar
│   │   │   ├── eletricistas.repository.js
│   │   │   ├── eletricistas.schema.js
│   │   │   └── eletricistas.test.js
│   │   │
│   │   ├── produtos/
│   │   │   ├── produtos.routes.js
│   │   │   ├── produtos.controller.js
│   │   │   ├── produtos.service.js       # zerar/repor estoque + gravar movimentação (transação)
│   │   │   ├── produtos.repository.js
│   │   │   ├── produtos.schema.js
│   │   │   └── produtos.test.js
│   │   │
│   │   ├── metas/
│   │   │   ├── metas.routes.js
│   │   │   ├── metas.controller.js
│   │   │   ├── metas.service.js
│   │   │   ├── metas.repository.js
│   │   │   ├── metas.schema.js
│   │   │   └── metas.test.js
│   │   │
│   │   ├── checklist/
│   │   │   ├── checklist.routes.js       # config de checklists + perguntas + seleção
│   │   │   ├── checklist.controller.js
│   │   │   ├── checklist.service.js
│   │   │   ├── checklist.repository.js
│   │   │   ├── checklist.schema.js
│   │   │   ├── pendencias.controller.js  # ex-ConsultaChecklistController (bloqueios/revisão)
│   │   │   ├── pendencias.service.js
│   │   │   └── checklist.test.js
│   │   │
│   │   ├── ordens-servico/
│   │   │   ├── ordens-servico.routes.js
│   │   │   ├── ordens-servico.controller.js
│   │   │   ├── ordens-servico.service.js # solicitar/abrir/fechar, baixa de estoque atômica, bloqueio por checklist
│   │   │   ├── ordens-servico.repository.js
│   │   │   ├── comentarios.service.js    # comentário + upload de foto + thumbnail
│   │   │   ├── ordens-servico.schema.js
│   │   │   └── ordens-servico.test.js
│   │   │
│   │   ├── baixas/
│   │   │   ├── movimentacoes.routes.js   # ex-BaixasController (consulta/relatórios)
│   │   │   ├── movimentacoes.controller.js
│   │   │   ├── movimentacoes.service.js
│   │   │   ├── lancamentos.routes.js     # ex-LancamentosController (fluxo de rascunho, admin)
│   │   │   ├── lancamentos.controller.js
│   │   │   ├── lancamentos.service.js    # abrir/incluir/remover/finalizar/cancelar
│   │   │   ├── baixas.repository.js
│   │   │   ├── baixas.schema.js
│   │   │   └── baixas.test.js
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.routes.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── dashboard.service.js      # agrega os métodos do DashboardModel
│   │   │   └── dashboard.test.js
│   │   │
│   │   └── chat/
│   │       ├── chat.routes.js
│   │       ├── chat.controller.js
│   │       └── chat.service.js           # proxy para o Flowise (FLOWISE_API_URL)
│   │
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── AppError.js               # erro base com statusCode + code
│   │   │   ├── ValidationError.js
│   │   │   ├── NotFoundError.js
│   │   │   └── ForbiddenError.js
│   │   ├── http/
│   │   │   ├── response.js               # helpers ok()/created()/noContent()
│   │   │   └── asyncHandler.js           # wrapper try/catch para controllers
│   │   ├── auth/
│   │   │   ├── jwt.js                    # sign/verify
│   │   │   └── password.js               # bcrypt hash/compare (compat com hashes $2y$ atuais)
│   │   ├── pagination.js                 # parse de page/pageSize + montagem do meta
│   │   ├── permissoes.js                 # catálogo de permissões (ex-permissoes_helper)
│   │   └── storage/
│   │       ├── localStorage.js           # disco (dev)
│   │       └── s3Storage.js              # objeto (prod) — opcional
│   │
│   ├── routes/
│   │   └── index.js                      # junta todas as *.routes.js sob /api/v1
│   │
│   └── database/
│       ├── prisma/
│       │   └── schema.prisma             # mapeia as tabelas tabela_* (@@map)
│       ├── seeds/
│       │   └── seed.js                   # usuário admin inicial, checklists padrão
│       └── migrations/                   # geradas pelo Prisma/Sequelize
│
├── public/
│   └── uploads/
│       └── os/                           # fotos das OS + *_thumb (dev)
│
├── tests/
│   ├── setup.js
│   ├── helpers/
│   │   └── db.js                         # transação + rollback por teste (como a suíte CI atual)
│   └── fixtures/
│
├── .env.example                          # DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, FLOWISE_API_URL...
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── Dockerfile
└── package.json
```

### 2.1. Equivalências CodeIgniter → Node

| CodeIgniter 3 | Node.js (proposto) |
|---|---|
| `application/controllers/*Controller.php` | `src/modules/<modulo>/*.controller.js` |
| `application/models/*Model.php` | `src/modules/<modulo>/*.service.js` + `*.repository.js` |
| `application/config/routes.php` | `src/routes/index.js` + `*.routes.js` de cada módulo |
| `core/MY_Controller.php` (`Auth_Controller`, `paginar`) | `middlewares/auth.js`, `middlewares/authorize.js`, `shared/pagination.js` |
| `helpers/permissoes_helper.php` | `shared/permissoes.js` |
| `libraries/Form_validation` | `middlewares/validate.js` + schemas Zod (`*.schema.js`) |
| `libraries/Upload` + `Image_lib` | `config/upload.js` (multer) + `sharp` para thumbnail |
| `libraries/Session` + `flashdata` | JWT + respostas JSON (o React exibe toasts) |
| `CI_Unit_test` (`controllers/testes/*`) | `*.test.js` + `tests/helpers/db.js` (transação/rollback) |
| `.env` (parse_ini_file) | `config/env.js` (dotenv + validação) |

---

## 3. Front-end — `frontend/`

Stack sugerida: **React 18 · Vite · React Router · TanStack Query (cache/estado
servidor) · Axios · React Hook Form + Zod · Bootstrap 5 (mantém o design atual) ·
Recharts (gráficos do dashboard) · Vitest + Testing Library**.

Organização **por feature**, espelhando os módulos da API.

```
frontend/
├── index.html
├── vite.config.js
├── .env.example                 # VITE_API_URL
├── .eslintrc.json
├── .prettierrc
├── Dockerfile
├── package.json
│
├── public/
│   └── logo-eletrotech.png
│
└── src/
    ├── main.jsx                 # bootstrap React + providers
    ├── App.jsx                  # define as rotas
    │
    ├── app/
    │   ├── router.jsx           # rotas públicas x privadas
    │   ├── queryClient.js       # config do TanStack Query
    │   └── providers.jsx        # AuthProvider, QueryClientProvider, ToastProvider
    │
    ├── api/
    │   ├── httpClient.js        # instância Axios (baseURL, interceptors de token e 401)
    │   └── endpoints.js         # constantes das rotas da API
    │
    ├── auth/
    │   ├── AuthContext.jsx      # usuário logado, isAdmin, permissoes[]
    │   ├── useAuth.js
    │   ├── ProtectedRoute.jsx   # exige login
    │   └── PermissionRoute.jsx  # exige permissão/admin (espelha exigirPermissao)
    │
    ├── components/              # UI genérica e reaproveitável
    │   ├── layout/
    │   │   ├── AppLayout.jsx
    │   │   ├── Sidebar.jsx      # itens filtrados por permissão
    │   │   ├── Header.jsx
    │   │   └── Footer.jsx
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Modal.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── Pagination.jsx
    │   │   ├── FormField.jsx
    │   │   ├── FileInput.jsx
    │   │   └── Toast.jsx
    │   └── feedback/
    │       ├── EmptyState.jsx
    │       ├── ErrorState.jsx
    │       └── LoadingSpinner.jsx
    │
    ├── features/               # uma pasta por módulo de negócio
    │   ├── auth/
    │   │   ├── pages/LoginPage.jsx
    │   │   ├── api.js           # login, logout, me
    │   │   └── schema.js
    │   │
    │   ├── dashboard/
    │   │   ├── pages/DashboardPage.jsx
    │   │   ├── components/  (CardsIndicadores, GraficoOsPorMes, GraficoMovimentacao, MetaProgress...)
    │   │   ├── hooks/useDashboard.js
    │   │   └── api.js
    │   │
    │   ├── usuarios/
    │   │   ├── pages/  (UsuariosListPage, UsuarioFormPage)
    │   │   ├── components/  (UsuarioForm, PermissoesCheckboxes)
    │   │   ├── hooks/  (useUsuarios, useUsuarioMutations)
    │   │   ├── api.js
    │   │   └── schema.js
    │   │
    │   ├── eletricistas/
    │   │   ├── pages/  (EletricistasListPage, EletricistaFormPage, HistoricoOsPage)
    │   │   ├── components/  (EletricistaForm, DemissaoModal)
    │   │   ├── hooks/
    │   │   ├── api.js
    │   │   └── schema.js
    │   │
    │   ├── produtos/
    │   │   ├── pages/  (ProdutosListPage)
    │   │   ├── components/  (ProdutoForm, EntradaEstoqueModal, ZerarEstoqueModal)
    │   │   ├── hooks/
    │   │   ├── api.js
    │   │   └── schema.js
    │   │
    │   ├── metas/
    │   │   ├── pages/  (MetasListPage)
    │   │   ├── components/  (MetaForm, FiltrosMetas)
    │   │   ├── hooks/
    │   │   ├── api.js
    │   │   └── schema.js
    │   │
    │   ├── checklist/
    │   │   ├── pages/  (ChecklistListPage, ChecklistFormPage, PendenciasPage, ChecklistRelatorioPage)
    │   │   ├── components/  (ChecklistForm, PerguntasEditor, SelecionarChecklist, ResolverPendenciaModal)
    │   │   ├── hooks/
    │   │   ├── api.js           # checklists + pendencias
    │   │   └── schema.js
    │   │
    │   ├── ordens-servico/
    │   │   ├── pages/  (OrdensServicoListPage, OsDetalhePage)
    │   │   ├── components/  (SolicitarOsModal, AbrirOsForm, FecharOsForm, ChecklistRespostas, MateriaisPicker, ComentariosOs, UploadFoto)
    │   │   ├── hooks/  (useOrdensServico, useOsMutations)
    │   │   ├── api.js
    │   │   └── schema.js
    │   │
    │   └── baixas/
    │       ├── pages/  (MovimentacoesPage, MovimentacaoRelatorioPage, LancamentosPage, LancamentoRelatorioPage)
    │       ├── components/  (FiltrosMovimentacao, TotaisMovimentacao, RascunhoBaixa, ItensBaixaTable, AbrirBaixaForm)
    │       ├── hooks/
    │       ├── api.js           # movimentacoes + lancamentos
    │       └── schema.js
    │
    ├── chat/
    │   ├── ChatWidget.jsx       # bolha de chat presente no layout
    │   ├── useChat.js
    │   └── api.js
    │
    ├── hooks/                   # hooks genéricos (usePagination, useDebounce, useToast...)
    ├── lib/
    │   ├── formatters.js        # moeda, data, CPF, "OS #00001"
    │   └── validators.js        # CPF, mês YYYY-MM
    ├── styles/
    │   ├── index.css
    │   └── bootstrap-overrides.scss   # herda card.css/login.css/sidebar.css etc. atuais
    ├── constants/
    │   └── permissoes.js
    └── test/
        ├── setup.js
        └── utils.jsx           # render com providers
```

### 3.1. Convenções do front-end

- **Uma `feature/` por módulo**: cada pasta é autocontida (páginas, componentes,
  hooks, chamadas de API e schemas de validação daquele domínio).
- **`api.js` por feature**: nenhum componente chama Axios direto; sempre via a
  camada de `api.js` + hooks do TanStack Query.
- **Rotas protegidas**: `ProtectedRoute` (autenticado) e `PermissionRoute`
  (permissão específica ou `isAdmin`), reproduzindo `exigirPermissao` /
  `exigirAdmin` e o escopo por `eletricistaId` nas OS.
- **Sidebar dinâmica**: itens renderizados a partir de `permissoes[]` do usuário
  (igual ao menu atual gerado por `permissoes_disponiveis()`).
- **Feedback**: `flashdata` some; erros e sucessos viram *toasts* a partir do
  envelope de resposta da API.
- **CSS**: os arquivos atuais em `assets/css/` (`card.css`, `login.css`,
  `sidebar.css`, `header.css`, `footer.css`, `form.css`, `button.css`) migram
  para `src/styles/` como overrides do Bootstrap 5, preservando a identidade
  visual.

---

## 4. Banco de dados — `db/`

```
db/
├── legacy/
│   └── banco-eletrotech.sql       # dump atual (não usado em runtime, só referência)
├── migrations/                    # migrações versionadas (Prisma/Sequelize/Knex)
│   ├── 0001_init.sql              # cria todas as tabelas tabela_*
│   └── ...
└── seeds/
    └── 0001_dados_iniciais.sql    # admin inicial, checklists padrão
```

Recomendações:
- **Fase 1**: manter os nomes `tabela_*` e as colunas atuais; mapear para
  `camelCase` só na camada de ORM (`@@map` / `@map`).
- Corrigir no processo de migração os dados inconsistentes do dump (datas como
  `0026-05-10`, `2006-03-15`).
- Padronizar `senha` para `bcrypt` — os hashes atuais `$2y$` são compatíveis com
  a lib `bcryptjs` do Node.

---

## 5. Ambiente e execução

```
docker-compose.yml
├── db        → mysql:8
├── backend   → node (porta 3000, /api/v1)
└── frontend  → vite dev server (porta 5173) com proxy /api → backend
```

Variáveis de ambiente (`backend/.env`):

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor HTTP |
| `DATABASE_URL` | String de conexão MySQL (ou `DB_HOST`/`DB_USER`/`DB_PASS`/`DB_NAME`) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Assinatura do access token |
| `REFRESH_TOKEN_SECRET` / `REFRESH_TOKEN_EXPIRES_IN` | Refresh token |
| `UPLOAD_DIR` | Diretório de upload das fotos de OS |
| `FLOWISE_API_URL` | Endpoint do assistente de IA (nunca exposto ao front) |
| `CORS_ORIGIN` | Origem do front-end (ex.: `http://localhost:5173`) |

Front-end (`frontend/.env`):

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | Base da API (ex.: `http://localhost:3000/api/v1`) |

---

## 6. Ordem sugerida de migração por módulo

1. **Infra + Auth** (login, JWT, middlewares de permissão, layout + sidebar).
2. **Produtos** e **Eletricistas** (CRUDs simples, exercitam o padrão completo).
3. **Metas** e **Checklist** (config).
4. **Dashboard** (só leitura/agregação).
5. **Ordens de Serviço** (fluxo mais complexo: estoque atômico, checklist, upload).
6. **Baixas** (movimentações + fluxo de rascunho dos lançamentos).
7. **Usuários** (admin) e **Chat** (proxy Flowise).
8. **Testes** acompanhando cada módulo (portar os cenários de `controllers/testes/`).
