# Camadas de Rotas — EletroTech

Este documento descreve o caminho percorrido por uma requisição no EletroTech,
desde a tela React até o banco MySQL. Ele complementa
`definicao-de-endpoints.md`, que é a referência dos contratos HTTP.

## Visão geral

```text
Página React
  → módulo src/api
  → Axios (token + envelope)
  → proxy do Vite em desenvolvimento (/api)
  → Express (/api/v1)
  → autenticação e autorização
  → handler do recurso
  → MySQL
  → envelope { data, meta? }
  → Axios simplifica a resposta
  → estado da página React
```

Em desenvolvimento, o Vite atende o front-end e encaminha as chamadas iniciadas
por `/api` ao backend Node. Isso elimina dependência de CORS entre a porta do
front-end e a do backend.

## 1. Camada de rotas do front-end

As rotas de interface ficam em `src/App.jsx` e levam às páginas em
`src/pages/`. As páginas protegidas usam `RotaProtegida` e a informação mantida
por `AuthContext`.

| Rota de tela | Página | Objetivo |
|---|---|---|
| `/login` | `LoginPage` | Autenticação do usuário |
| `/home` | `MenuPage` | Dashboard |
| `/usuarios` | `UsuariosPage` | Gestão de usuários |
| `/eletricistas` | `EletricistasPage` | Gestão de eletricistas |
| `/produtos` | `ProdutosPage` | Produtos e estoque |
| `/metas` | `MetasPage` | Metas mensais |
| `/checklist` | `ChecklistPage` | Configuração de checklists |
| `/ordemServico` | `OrdemServicoPage` | Ciclo de ordens de serviço |
| `/baixas` | `BaixasPage` | Consulta de movimentações |
| `/lancamentos` | `LancamentosPage` | Lançamentos de baixa |

O controle de acesso visual é feito por `AuthContext.pode(chave)`. A interface
não é a camada de segurança definitiva: o backend também valida o token e a
permissão em cada rota protegida.

## 2. Camada de cliente HTTP

Os arquivos em `src/api/` representam um recurso da API por vez. Por exemplo,
`src/api/produtos.js` reúne as operações de produtos e
`src/api/ordensServico.js` reúne o ciclo de vida da OS.

`src/api/client.js` centraliza os comportamentos transversais:

- URL base: `VITE_API_URL`, definida como `/api/v1` no desenvolvimento;
- inclusão automática de `Authorization: Bearer <token>` após o login;
- suporte provisório a formulários URL-encoded usados pelo front-end legado;
- remoção do envelope de resposta `{ data }`, preservando o consumo simples
  das páginas via `res.data`.

O token recebido no login é guardado dentro de `eletrotech_usuario` no
`localStorage` pelo `AuthContext`.

## 3. Proxy de desenvolvimento

O arquivo `vite.config.js` contém o proxy abaixo:

```text
Browser → http://127.0.0.1:5175/api/v1/...
Vite    → http://127.0.0.1:3100/api/v1/...
```

Assim, o browser enxerga uma única origem durante o desenvolvimento. Em
produção, o proxy deve ser substituído por um reverse proxy (Nginx, Caddy ou
equivalente) ou por uma variável `VITE_API_URL` apontando à API publicada.

## 4. Entrada de rotas do backend

O backend Express começa em `backend/src/server.js`, cria a aplicação em
`backend/src/app.js` e registra o agregador em `backend/src/routes/index.js`.

```text
server.js
  → app.js
    → GET /health
    → routes/index.js
      → /api/v1
        → modules/api.routes.js
```

`GET /health` não depende do banco e serve para verificar se o processo Node
está disponível. As rotas de negócio usam o prefixo obrigatório `/api/v1`.

## 5. Middlewares de segurança

As funções em `backend/src/middlewares/auth.js` executam antes dos handlers:

| Middleware | Responsabilidade |
|---|---|
| `requireAuth` | Lê e valida o JWT Bearer; disponibiliza o usuário em `req.user` |
| `requireAdmin` | Exige administrador |
| `requirePermission(chave)` | Exige a permissão do módulo ou administrador |

O JWT é emitido em `POST /api/v1/auth/login` após a senha bcrypt ser validada
contra `tabela_usuarios`. A senha nunca é devolvida pela API.

## 6. Recursos e rotas REST

| Recurso | Prefixo | Proteção principal |
|---|---|---|
| Autenticação | `/auth` | Pública no login; JWT nas demais |
| Usuários | `/usuarios` | Administrador |
| Eletricistas | `/eletricistas` | `eletricistas` |
| Produtos | `/produtos` | `produtos` |
| Metas | `/metas` | `metas` |
| Checklists | `/checklists` | `checklist` |
| Ordens de serviço | `/ordens-servico` | `ordemServico` |
| Movimentações | `/movimentacoes` | `baixas` |
| Baixas | `/baixas` | `baixas` |
| Lançamentos | `/lancamentos` | Administrador |
| Dashboard | `/dashboard` | JWT, com escopo por perfil |
| Chat | `/chat` | JWT |

As definições de método, parâmetros, payloads e códigos de status de cada
recurso estão detalhadas em `definicao-de-endpoints.md`.

## 7. Lógica de domínio e banco

No estágio atual da migração, os handlers estão concentrados em
`backend/src/modules/api.routes.js`; eles fazem as validações, aplicam as
regras de negócio e chamam a camada de banco em
`backend/src/config/database.js`.

```text
Handler da rota
  → query() ou transaction()
  → pool mysql2/promise
  → banco MySQL eletrotech
```

Operações que precisam manter consistência usam `transaction()`, em especial:

- cadastro de produto com estoque inicial e movimentação de entrada;
- reposição ou baixa manual de estoque;
- abertura de OS, consumo de materiais e movimentações de saída;
- fechamento de OS e respostas de checklist;
- finalização de baixa e aplicação de itens ao estoque.

## 8. Formato de resposta e erros

O contrato REST usa o envelope abaixo:

```json
{
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 42 }
}
```

Erros têm formato:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Você não possui esta permissão."
  }
}
```

Os status mais comuns são `401` para token ausente ou inválido, `403` para
permissão insuficiente, `404` para recurso inexistente, `409` para conflito de
estado ou estoque e `422` para dados inválidos.

## 9. Exemplo completo: login

```text
LoginPage
  → authApi.login(nome, senha)
  → POST /api/v1/auth/login
  → valida tabela_usuarios com bcrypt
  → gera JWT com permissões
  → AuthContext salva usuário + accessToken
  → navigate('/home')
  → MenuPage chama GET /api/v1/dashboard com Bearer token
```

## 10. Exemplo completo: abertura de ordem de serviço

```text
OrdemServicoPage
  → abrirOrdemServico(dados)
  → POST /api/v1/ordens-servico/:id/abertura
  → requireAuth + requirePermission('ordemServico')
  → confirma dono da OS ou administrador
  → valida checklist de início e disponibilidade de estoque
  → transação MySQL: materiais + baixa do estoque + movimentações + status
  → resposta da OS atualizada
```

## Convenções para novas rotas

1. Criar primeiro o contrato em `definicao-de-endpoints.md`.
2. Criar a função no módulo correspondente em `src/api/`.
3. Proteger o endpoint com `requireAuth`, `requireAdmin` ou
   `requirePermission`.
4. Validar IDs, datas e números antes de consultar o banco.
5. Usar transação quando a operação afetar mais de uma tabela ou o estoque.
6. Manter o envelope de sucesso e o formato de erro.
7. Atualizar este documento se a camada ou o fluxo de roteamento mudar.
