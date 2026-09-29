# Guia de Backend para IA — EletroTech

## Objetivo

Este documento serve como contexto operacional para uma IA que vai auxiliar na construção do backend do sistema EletroTech em Node.js + Express, com base no frontend já implementado em React.

A ideia é alinhar o backend às rotas, payloads, permissões e modelos de negócio que o frontend já espera consumir, evitando retrabalho e mantendo compatibilidade com a lógica atual do sistema legado em PHP/CodeIgniter.

---

## 1. Visão geral do projeto

O projeto atual possui duas partes bem distintas:

- Frontend React em `src/` com páginas, componentes, contexto de autenticação e módulos de API.
- Legacy em PHP/CodeIgniter com controllers e modelos, documentado em `docs/definicao-de-endpoints.md` e `docs/estrutura-de-pastas.md`.

O backend novo deve seguir a lógica do sistema já existente, mas em arquitetura REST/JSON com Express.

### Stack alvo sugerida

- Node.js 20+
- Express
- MySQL 8
- Prisma ou Sequelize
- JWT
- Zod para validação
- Multer para upload
- bcrypt para senhas
- Jest/Vitest para testes

---

## 2. Contexto do frontend já construído

A aplicação React não foi montada sobre dados mockados. Ela faz chamadas HTTP reais por módulo, em arquivos de `src/api/`.

### Arquivos principais de API

- `src/api/auth.js`
- `src/api/usuarios.js`
- `src/api/eletricistas.js`
- `src/api/produtos.js`
- `src/api/metas.js`
- `src/api/checklist.js`
- `src/api/ordensServico.js`
- `src/api/baixas.js`
- `src/api/lancamentos.js`
- `src/api/menu.js`
- `src/api/chat.js`
- `src/api/client.js`

### Convenção atual do frontend

O frontend envia dados em formato `application/x-www-form-urlencoded` e usa `URLSearchParams`, como pode ser visto em `src/api/client.js`.

Isso indica que o backend legado aceita campos em forma de formulário; o backend novo pode e deve usar JSON, mas para facilitar migração pode ser útil oferecer compatibilidade com o formato antigo em fases iniciais.

---

## 3. Estrutura documental relevante

### 3.1. `docs/definicao-de-endpoints.md`

Este documento descreve os endpoints pensados para a migração e já é a base mais importante para a implementação.

Ele define:

- prefixo `/api/v1`
- autenticação por JWT
- autorização por permissões
- envelope padrão de resposta
- módulos: auth, usuarios, eletricistas, produtos, metas, checklist, ordens de serviço, baixas, lançamentos, dashboard e chat

### 3.2. `docs/estrutura-de-pastas.md`

Este documento define a arquitetura sugerida para o backend em Node:

- `src/modules/<modulo>/`
- `routes/`
- `middlewares/`
- `config/`
- `shared/`
- `database/`

É a melhor referência para organizar a implementação da API.

---

## 4. Módulos e contratos esperados pelo frontend

Abaixo está o mapa real de uso do frontend, que a IA deve seguir ao criar o backend.

### 4.1. Autenticação

Arquivo: `src/api/auth.js`

Endpoints esperados:

- `POST /auth/entrar` com `{ nome, senha }`
- `GET /auth/sair`
- `GET /home`

Observações:

- O frontend usa o objeto `usuario` com campos como `nome`, `is_admin`, `permissoes`, `destino`, `rotuloDestino`.
- O `AuthContext` em `src/context/AuthContext.jsx` espera dados do usuário em formato simplificado.
- O backend moderno pode retornar um payload mais robusto, mas deve manter compatibilidade com os campos que o frontend já usa.

### 4.2. Usuários

Arquivo: `src/api/usuarios.js`

Endpoints esperados:

- `GET /usuarios`
- `POST /usuarios/criar` com `{ usuario, senha, is_admin, permissoes[], eletricista_id }`
- `POST /usuarios/editar` com `{ id, usuario, is_admin, permissoes[], senha }`
- `GET /usuarios/excluir/{id}`

Regras importantes:

- Usuário admin deve poder gerenciar permissões.
- Existe vínculo opcional com eletricista.
- Deve existir proteção para último administrador.

### 4.3. Eletricistas

Arquivo: `src/api/eletricistas.js`

Endpoints esperados:

- `GET /eletricistas`
- `POST /eletricistas/cadastrar` com `{ nome, cpf, data_contratacao, senha }`
- `POST /eletricistas/editar` com `{ id, nome, senha }`
- `GET /eletricistas/demitir/{id}`
- `GET /eletricistas/reativar/{id}`
- `GET /eletricistas/historico_os/{id}`

Regras importantes:

- CPF deve ser único.
- Ao cadastrar eletricista, normalmente também deve criar usuário de acesso.
- Demissão e reativação são ações de negócio e devem atualizar o status do eletricista.

### 4.4. Produtos

Arquivo: `src/api/produtos.js`

Endpoints esperados:

- `GET /produtos`
- `POST /produtos/cadastrar` com `{ nome_produto, vlr_unitario, qtd_estoque }`
- `POST /produtos/editar` com `{ id, nome_produto, vlr_unitario }`
- `GET /produtos/ZerarEstoque/{id}`
- `POST /produtos/aumentarQtdEstoque/{id}` com `{ qtd_estoque }`

Regras importantes:

- Estoque deve ser capaz de aumentar e zerar.
- `vlr_unitario` deve ser numérico.
- Alterações de estoque devem registrar movimentação, se o sistema legado exigir histórico.

### 4.5. Metas

Arquivo: `src/api/metas.js`

Endpoints esperados:

- `GET /metas?filtro_eletricista=&filtro_mes=`
- `POST /metas/cadastrar` com `{ eletricista_meta, mes_meta, vlr_meta }`
- `POST /metas/editar` com `{ id, vlr_meta }`
- `GET /metas/excluir/{id}`

Regras importantes:

- Meta por eletricista e mês.
- Filtros por eletricista e mês devem ser suportados.

### 4.6. Checklist

Arquivo: `src/api/checklist.js`

Endpoints esperados:

- `GET /checklist?tipo=&titulo=`
- `POST /checklist/cadastrar` com `{ titulo, tipo, pergunta[], tipo_resposta[], bloqueia_abertura[] }`
- `POST /checklist/selecionar` com `{ id_checklist, tipo }`
- `GET /checklist/perguntas/{id}`
- `GET /checklist/excluir/{id}`

Regras importantes:

- Checklist possui perguntas e pode ter tipo `inicio` ou `fim`.
- Deve existir conceito de checklist selecionado padrão por tipo.

### 4.7. Ordens de Serviço

Arquivo: `src/api/ordensServico.js`

Endpoints esperados:

- `GET /ordemServico`
- `POST /ordemServico/solicitar` com `{ eletricista_os, data_os }`
- `POST /ordemServico/abrir` com `{ id_os, id_produto[], qtd_utilizada[], checklist_resposta[] }`
- `POST /ordemServico/fechar` com `{ id_os, checklist_resposta[], motivos }`
- `GET /ordemServico/detalhes/{idOs}`
- `POST /ordemServico/adicionarComentario` com `{ id_os, comentario }`

Regras importantes:

- Fluxo de abertura/fechamento com checklist.
- Pode haver consumo de produtos em quantidade.
- Comentários e histórico são parte do processo.

### 4.8. Baixas

Arquivo: `src/api/baixas.js`

Endpoints esperados:

- `GET /baixas?consultar=1&tipo=&id_produto=&data_inicio=&data_fim=`
- `GET /baixas/detalhes/{id}`
- `POST /baixas/relatorio_misto` com `ids[]`

Regras importantes:

- Consultas por tipo, produto e período.
- Geração de relatórios e leitura de movimentações.

### 4.9. Lançamentos

Arquivo: `src/api/lancamentos.js`

Endpoints esperados:

- `GET /lancamentos`
- `POST /lancamentos/abrir` com `{ tipo, data_baixa, id_eletricista, observacao }`
- `POST /lancamentos/incluir_item` com `{ id_baixa, id_produto, quantidade, valor_unitario }`
- `POST /lancamentos/remover_item` com `{ id_baixa, id_item }`
- `POST /lancamentos/finalizar` com `{ id_baixa }`
- `POST /lancamentos/cancelar` com `{ id_baixa }`
- `GET /lancamentos/relatorio/{id}`

Regras importantes:

- Fluxo de rascunho/abertura/finalização/cancelamento.
- Deve haver consistência com produtos e baixa.

### 4.10. Dashboard / menu

Arquivo: `src/api/menu.js`

Possivelmente há dados do dashboard e painel do usuário.

A IA deve considerar:

- dados resumidos por usuário/admin
- permissões e acesso por módulo
- roteamento inicial `destino`

### 4.11. Chat

Arquivo: `src/api/chat.js`

Pode estar integrado com um bot ou fluxo externo; deve seguir a lógica de conversão do front para backend.

---

## 5. Permissões do sistema

Arquivo relevante: `src/constants/permissoes.js`

Permissões principais:

- `menu`
- `ordemServico`
- `checklist`
- `produtos`
- `baixas`
- `metas`
- `eletricistas`

O contexto do frontend faz isso em `src/context/AuthContext.jsx`:

- `ehAdmin`
- `permissoes`
- `pode(chave)`

A IA deve implementar middleware de autorização do tipo:

- `requireAuth`
- `requireAdmin`
- `requirePermissao('produtos')`

---

## 6. Regras de negócio que devem ser preservadas

### 6.1. Autenticação

- Usuário pode logar por nome de usuário ou CPF do eletricista, conforme documentação.
- Usuários com `data_demissao` preenchida não devem conseguir acesso.
- Usuário sem permissões liberadas deve receber erro de autorização.
- Admin recebe todas as permissões.

### 6.2. Usuários e permissões

- `is_admin` deve ser tratado como papel de administrador.
- Não pode remover o último administrador.
- Vincular um eletricista a um usuário deve ser único.

### 6.3. Eletricistas

- CPF único.
- Cadastro do eletricista pode criar usuário de acesso com login = CPF.
- Demissão/reativação devem ser transacionais.

### 6.4. Produtos

- Variação de estoque deve impactar movimentação.
- Cadastro de produto inicial pode gerar entrada em estoque.
- Valor unitário deve ser tratado como decimal.

### 6.5. Metas

- Meta por mês e eletricista.
- Atualização deve permitir alterar apenas o valor da meta.

### 6.6. Checklist

- Checklist deve possuir perguntas e tipos.
- Quais checklist estão ativos por tipo devem ser selecionados.

### 6.7. Ordens de Serviço

- Fluxo de abrir/fechar OS.
- Checklist pode bloquear abertura/encerramento.
- Comentários devem ser persistidos.

### 6.8. Baixas e Lançamentos

- Fluxo de baixa em rascunho e finalização.
- Itens de lançamento devem ser consistentes com produto e quantidade.
- Geração de relatórios e exportação pode ficar em endpoints separados.

---

## 7. Estrutura recomendada para o backend

A arquitetura ideal, seguindo os documentos do projeto, é:

```text
backend/
  src/
    app.js
    server.js
    config/
    middlewares/
    modules/
      auth/
      usuarios/
      eletricistas/
      produtos/
      metas/
      checklist/
      ordens-servico/
      baixas/
      lancamentos/
      dashboard/
      chat/
    shared/
    routes/
    database/
```

### Padrão de módulo

Cada módulo deve ter:

- `*.routes.js`
- `*.controller.js`
- `*.service.js`
- `*.repository.js`
- `*.schema.js`
- `*.test.js`

### Padrão de resposta

A API deve usar um envelope consistente, tal como descrito em `docs/definicao-de-endpoints.md`:

```json
{
  "data": {
    "id": 1,
    "nome": "Produto A"
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      { "field": "cpf", "message": "CPF inválido" }
    ]
  }
}
```

---

## 8. Como a IA deve interpretar o frontend

A IA deve agir como se o frontend já estivesse definido e pronto para consumir uma API REST.

Sua tarefa principal é:

1.Implementar o backend com base nos endpoints já usados pelo React.
2.Manter compatibilidade com os nomes dos campos do frontend.
3.Respeitar a lógica de permissões e regras de negócio do sistema legado.
4.Seguir a arquitetura definida em `docs/estrutura-de-pastas.md`.
5.Criar testes para os módulos principais.

### Critério de compatibilidade

Se o frontend manda:

```js
toFormBody({ nome, senha })
```

o backend deve aceitar o mesmo payload em JSON ou converter no middleware de compatibilidade, e o contrato em API REST deve padronizar o JSON.

---

## 9. Checklist de implementação para a IA

### Backend mínimo

- [ ] Configuração do Express e do servidor HTTP
- [ ] Middlewares de autenticação, autorização e validação
- [ ] Estrutura por módulos
- [ ] Persistência com MySQL
- [ ] JWT e refresh token ou sessão compatível
- [ ] Rotas REST para auth, usuarios, eletricistas, produtos, metas, checklist, ordemServico, baixas, lancamentos, menu, chat
- [ ] Tratamento padronizado de erros
- [ ] Paginação e filtros
- [ ] Testes de fluxo principal

### Módulos críticos

- [ ] Login e controle de permissões
- [ ] Cadastro e edição de usuários
- [ ] Cadastro e demissão de eletricistas
- [ ] Gestão de produtos e estoque
- [ ] Fluxo de ordens de serviço
- [ ] Checklist e seleção padrão
- [ ] Baixas e lançamentos

---

## 10. Prompt pronto para IA

Use o texto abaixo como base para pedir ajuda à IA:

> Crie o backend em Node.js + Express para o sistema EletroTech usando o frontend React já construído como referência. A API deve seguir os endpoints e payloads usados em `src/api/*.js`, respeitando as regras de negócio do sistema legado em PHP/CodeIgniter. O backend deve usar arquitetura em módulos com `routes`, `controllers`, `services`, `repositories`, `schemas`, `middlewares`, e `database`. Precisamos suportar autenticação, autorização por permissões, usuários, eletricistas, produtos, metas, checklist, ordens de serviço, baixas, lançamentos, dashboard e chat. A API deve devolver JSON consistente e seguir a estrutura de documentação em `docs/definicao-de-endpoints.md` e `docs/estrutura-de-pastas.md`. Mantenha compatibilidade com os nomes dos campos usados no frontend, especialmente `nome`, `senha`, `is_admin`, `permissoes`, `eletricista_id`, `produto`, `qtd_estoque`, `vlr_unitario`, `tipo`, `mes`, `checklist_resposta`, `id_os`, etc.

---

## 11. Conclusão

O frontend React já define, de forma prática, o contrato funcional do backend. A IA deve usar esse contrato como fonte primária, e os documentos em `docs/` como guia de arquitetura e organização.

Ao seguir este arquivo, a implementação fica mais consistente, com menos risco de desalinhar nomes de campo, fluxos de negócio e regras de autenticação.
