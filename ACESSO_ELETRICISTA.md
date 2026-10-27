# Acesso de eletricista — EletroTech

## O projeto e o escopo desta alteração

O EletroTech gerencia a operação de uma empresa de serviços elétricos: usuários,
eletricistas, metas mensais, ordens de serviço, checklists e estoque. A gestão
atribui uma OS a um eletricista; ele registra materiais, responde aos checklists
e acompanha a execução até o fechamento.

Esta implementação atende à versão React da raiz (`src/`) e à API Express/MySQL
em `backend/`. A pasta `projeto-eletrotech/eletrotech-ci/` contém a versão PHP
anterior e não recebeu estas alterações. Algumas instruções antigas dos READMEs
se referem ao PHP ou a etapas anteriores da migração; para esta entrega, use o
procedimento abaixo.

A cópia do projeto foi baixada do repositório informado e modificada localmente.

## Comportamento entregue

| Perfil | Acesso |
| --- | --- |
| Eletricista | Dashboard pessoal, suas ordens de serviço e suas metas |
| Administrador | Acesso geral e gestão dos cadastros |
| Usuário padrão sem vínculo com eletricista | Módulos já autorizados pela gestão |

O eletricista usa a mesma tela de login, com CPF e senha, e entra diretamente
no dashboard pessoal. O vínculo `tabela_usuarios.eletricista_id` identifica o
perfil; não há uma nova tela de cadastro público nem uma nova coluna de perfil.

As três permissões são fixas: `menu`, `ordemServico` e `metas`. Isso também vale
para contas antigas que estavam sem permissões ou tinham acessos adicionais.
Contas vinculadas a eletricistas não podem ser promovidas a administrador.

O eletricista pode consultar, abrir, fechar e comentar suas próprias OS,
respeitando os checklists e as regras existentes de estoque. A solicitação de
novas OS continua a cargo do administrador. Em Metas, o eletricista apenas
consulta e filtra por mês; criação, edição e exclusão ficam com a gestão.

A API ignora filtros de outro eletricista nas consultas pessoais. Detalhes e
ações sobre uma OS de outro responsável retornam HTTP 403. O dashboard filtra
contagens, metas, materiais utilizados e gráficos pelo mesmo vínculo. As opções
da OS não expõem a lista dos outros eletricistas. Os materiais e checklists
necessários à execução continuam disponíveis dentro da própria tela de OS.

## Como liberar o acesso

1. Entre como administrador e abra **Eletricistas**.
2. Para um novo cadastro, informe CPF, nome, contratação e senha de acesso.
   O cadastro cria a conta e suas três permissões na mesma transação.
3. Para um eletricista antigo sem login, edite o cadastro e informe uma senha.
   Isso cria a conta vinculada usando o CPF como login. Se a conta já existe,
   a edição atualiza a senha sem criar outra conta.
4. Acesse a tela normal de login com esse CPF e a senha definida.
5. Atribua OS e metas ao eletricista usando as telas de gestão existentes.

Não é necessário executar migração SQL: são usadas as tabelas e colunas já
existentes. O banco precisa conter a conta de administrador que você já usa.
Eletricistas desligados não conseguem entrar nem continuar usando um token
anterior. A reativação mantém o fluxo de gestão existente.

## O que mudou e por quê

Comentários foram adicionados nos pontos que implementam as regras do perfil.

| Arquivo | Alteração e motivo |
| --- | --- |
| `backend/src/shared/access.js` | Centraliza as permissões fixas, o perfil e o destino após login; aplica a regra às contas antigas. |
| `backend/src/middlewares/auth.js` | Recarrega o usuário do banco a cada requisição; alterações de vínculo, permissões e demissão valem mesmo com token antigo. Bloqueia ações de gestão para eletricistas. |
| `backend/src/modules/api.routes.js` | Cria permissões com o login; permite ativar cadastros antigos pela senha; impede promoção a administrador; filtra metas, OS e opções pelo usuário autenticado; nega alterações de metas nesse perfil. |
| `backend/src/services/dashboard.service.js` | Conecta o serviço existente à API atual, valida o mês e monta o dashboard pessoal. |
| `backend/src/repository/dashboard.repository.js` | Usa a conexão MySQL atual e filtra todos os indicadores; soma apenas as metas do próprio responsável. |
| `src/constants/permissoes.js` e `src/context/AuthContext.jsx` | Aplicam os três módulos fixos ao menu e às rotas protegidas; tratam corretamente `is_admin` numérico ou em string. |
| `src/App.jsx`, `src/pages/LoginPage.jsx` e `src/pages/HomePage.jsx` | Direcionam o eletricista ao dashboard e corrigem o link de acesso a ele. |
| `src/components/Layout.jsx` | Remove o assistente do perfil de eletricista, mantendo o acesso aos três módulos solicitados. A API também bloqueia o assistente nesse perfil. |
| `src/pages/MetasPage.jsx` | Oculta ações de gestão e filtro por equipe; não busca a lista de outros eletricistas ao carregar a tela pessoal. |
| `src/pages/UsuariosPage.jsx` | Exibe as permissões fixas na edição do usuário eletricista, sem permitir ampliá-las. |
| `src/pages/EletricistasPage.jsx` | Explica como definir a senha e liberar o acesso de cadastros antigos. |
| `src/api/ordensServico.js` e `src/pages/OrdemServicoPage.jsx` | Enviam checklists como JSON preservando os IDs das perguntas; usam paginação e status da API para consultar todas as OS pessoais. |
| `src/components/ModalDetalhesOs.jsx` | Lê os detalhes no formato que a API REST realmente retorna. |
| `backend/test/`, `backend/vitest.config.js` e `backend/package.json` | Adicionam testes de autorização, isolamento, login, operação de OS e interface. |

O visual e a organização das páginas existentes foram preservados. Não foram
adicionadas dependências aos manifests; os testes usam bibliotecas que já
constavam no projeto.

## Executar a versão React/Node

Use Node compatível com as versões de Vite do projeto e MySQL 8 configurado com
o schema que você já usa. Na pasta desta cópia:

```sh
npm ci
npm ci --prefix backend
cp .env.example .env
cp backend/.env.example backend/.env
```

Edite `backend/.env` com suas credenciais reais, `JWT_SECRET` e porta da API.
No `.env` da raiz, use a mesma porta, por exemplo:

```env
VITE_API_URL=http://localhost:3001/api/v1
```

Depois, execute em dois terminais, ambos a partir da raiz do projeto:

```sh
npm run dev --prefix backend
```

```sh
npm run dev
```

Abra o endereço informado pelo Vite. O backend não cria um administrador padrão;
use sua conta já cadastrada no banco. A cópia local não inclui credenciais nem
um banco MySQL novo preenchido automaticamente.

## Validação

```sh
npm test --prefix backend
npm run build
npm run lint
```

Resultado desta entrega: **43 testes aprovados**, build concluído e lint sem erros
(com avisos).

Os testes usam banco SQLite em memória exclusivamente no ambiente de teste,
executando as consultas de isolamento com adaptação das funções MySQL. A API
real continua usando MySQL. Foram cobertos login por CPF, permissões fixas,
cadastro e ativação de login antigo, token antigo, demissão, navegação reduzida,
metas próprias, bloqueio de escrita, OS próprias, detalhes e ações por ID,
paginação, abertura/fechamento/comentários, gráficos pessoais e acesso de gestão.

A execução completa com seu banco MySQL ainda precisa ser validada no ambiente
configurado; nenhum banco de produção foi acessado. O lint mantém avisos do
projeto sobre hooks/organização e o build informa o tamanho do bundle.

## Primeiros testes unitários

Foram adicionados quatro testes simples para `normalizedUser` e
`requirePermission`. Consulte [TESTES_UNITARIOS.md](TESTES_UNITARIOS.md).
Para executar somente esses testes, use `npm run test:unit --prefix backend`.

## Perfil de supervisor

A gestão agora também pode liberar o perfil Supervisor, com Dashboard, OS, Metas
e Checklists. Veja [ACESSO_SUPERVISOR.md](ACESSO_SUPERVISOR.md). O supervisor não
tem acesso à gestão de usuários ou eletricistas.
