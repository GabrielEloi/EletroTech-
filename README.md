# EletroTech — Frontend (React)

Este é o **frontend React** do sistema EletroTech, reconstruído a partir das telas PHP/CodeIgniter originais (`views/telas/*.php`).

## ⚠️ Importante — leia antes de rodar

O projeto original (`EletroTech--main`) é uma aplicação **PHP monolítica**: o backend (CodeIgniter 3) renderiza HTML diretamente, ele **não expõe uma API JSON**. Não existia, portanto, um "frontend" para simplesmente extrair — o que foi feito aqui foi **reconstruir todas as 17 telas em React**, com o mesmo visual (tema escuro preto/amarelo, tipografia, ícones) e já preparado para consumir uma API.

Isso significa duas coisas:

1. **Sem dados mockados**: nenhuma tela usa dados fictícios/hardcoded. Todas buscam dados reais via `axios`, chamando as rotas do backend CodeIgniter (ex.: `/index.php/produtos`, `/index.php/ordemServico`, etc. — ver `src/api/*.js`). Enquanto o backend não retornar JSON nesses endpoints, as telas vão mostrar "carregando" e depois um estado vazio/erro — isso é esperado e intencional, não é um bug.
2. **Passo pendente no backend**: para o app funcionar de ponta a ponta, os métodos dos controllers do CodeIgniter (`UsuariosController`, `ProdutosController`, `OrdensServicoController`, etc.) precisam devolver JSON (`$this->output->set_content_type('application/json')->set_output(json_encode($dados))`) em vez de `$this->load->view(...)`, mantendo a mesma lógica de negócio e nomes de campos já usados em `src/api/*.js` (documentados em comentário em cada função). Isso é trabalho de backend e foi propositalmente deixado de fora, já que você pediu só o front.

## Stack

- React 18 + Vite
- React Router DOM (rotas e proteção por permissão/login)
- Axios (requisições HTTP, com suporte a cookie de sessão do CodeIgniter via `withCredentials`)
- Bootstrap 5 + CSS original do projeto (copiado de `assets/css`)
- Chart.js / react-chartjs-2 (gráficos do dashboard)

## Como rodar

```bash
npm install
cp .env.example .env   # ajuste VITE_API_URL para a URL do seu backend PHP
npm run dev
```

Edite `.env`:
```
VITE_API_URL=http://localhost/eletrotech-ci/index.php
```

## Estrutura

```
src/
  api/            -> um arquivo por módulo do backend (auth, produtos, usuarios, ordensServico, ...)
  assets/css/     -> CSS original do EletroTech + tema global extraído das telas PHP
  components/     -> Navbar, Layout, Modal, Pagination, Chatbot, estados de loading/erro/vazio
  context/        -> AuthContext (login/permissões) e NotificacaoContext (toasts)
  pages/          -> uma página por tela do sistema
  constants/      -> lista de permissões do sistema (espelha permissoes_helper.php)
```

## Telas migradas (17 telas do PHP original)

| Tela original (PHP) | Página React |
|---|---|
| LoginView | `pages/LoginPage.jsx` |
| HomeView | `pages/HomePage.jsx` |
| MenuView + DashboardEletricista | `pages/MenuPage.jsx` (dashboard admin e do eletricista) |
| UsuariosView | `pages/UsuariosPage.jsx` |
| EletricistasView | `pages/EletricistasPage.jsx` |
| ProdutosView | `pages/ProdutosPage.jsx` |
| MetasView | `pages/MetasPage.jsx` |
| OrdemServicoView + Detalhes | `pages/OrdemServicoPage.jsx` + `components/ModalDetalhesOs.jsx` |
| ChecklistView | `pages/ChecklistPage.jsx` |
| ConsultaChecklistView | `pages/ConsultaChecklistPage.jsx` |
| BaixasView | `pages/BaixasPage.jsx` |
| LancamentosView | `pages/LancamentosPage.jsx` |
| BaixaDetalheView, BaixaRelatorioMistoView, LancamentoRelatorioView | Mantidas como **links diretos para o backend** (abrem em nova aba), pois são relatórios/documentos para impressão gerados server-side — não fazem sentido como estado de React |

## Permissões

O controle de acesso replica `permissoes_helper.php`: administradores veem tudo; demais usuários só veem os módulos liberados (`menu`, `ordemServico`, `checklist`, `produtos`, `baixas`, `metas`, `eletricistas`), guardados em `AuthContext`.
