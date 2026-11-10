# Validação automatizada

Execute a partir da raiz:

```sh
npm test --prefix backend
npm run test:unit --prefix backend
npm run build
npm run lint
```

## Cobertura

`backend/test/unit/access.unit.test.js` valida normalização de perfis e permissão
por módulo. `backend/test/frontend-access.test.jsx` valida menus e controles por
perfil com renderização React. `backend/test/access.test.js` usa Supertest e
SQLite em memória para exercitar as consultas e transações da aplicação.

Os cenários incluem:

- Login por CPF/usuário, perfis fixos e proteção do último admin.
- Cadastro e ativação de acessos, revogação por senha/desligamento/logout.
- Cookie de renovação, rotação e rejeição de reutilização de cookie antigo.
- Seção de supervisores exclusiva do admin, associação de ativos e transferência.
- Escopo de equipe em listas, detalhes, opções, metas, dashboard, gráficos,
  relatórios, comentários, fotos e ações de OS por ID.
- Supervisor sem equipe e revogação de acesso com token anterior à transferência.
- Bloqueio manual, restauração do estado anterior e revisão de checklist.
- Negativa que mantém bloqueio; fechamento sem contornar pendências.
- OS fechada imutável, decisões com autor e histórico preservado.
- Validação de respostas, materiais repetidos, quantidade, estoque e rollback.
- Metas mensais/anuais de OS e/ou faturamento, duplicidade e cálculo por fechamento.
- Rascunhos restritos ao criador e itens imutáveis após finalização.
- Valores de movimentações e aplicação dos mesmos filtros aos totais.

Fotos dos testes são gravadas em diretório temporário próprio e removidas ao
final de cada caso. Dados de exemplo existem apenas nas fixtures de teste,
sem mock ou seed obrigatório no ambiente real.

## Limitações

As funções MySQL de data e JSON são adaptadas no banco em memória. `FOR UPDATE`
é removido nessa adaptação. Portanto a suíte valida regras, isolamento lógico
e rollback, mas não comprova locks, concorrência real, DDL ou migração no MySQL.

Não há conexão ao banco da empresa durante esses testes. Após aplicar a migração,
homologue os fluxos em MySQL 8, incluindo duas aberturas simultâneas da mesma OS,
transferência durante uma operação, baixa simultânea do mesmo produto e proteção
do último admin com duas alterações concorrentes.

## Validação real no MySQL 8

`backend/test/mysql.integration.js` é uma verificação opt-in. Recebe um socket de
um servidor local de testes, cria uma base com nome aleatório, instala o schema,
executa os comandos db:init e db:migrate, repetindo a migração, insere somente fixtures sintéticas e testa a API.
A base criada é removida ao encerrar, inclusive em caso de falha. Não utiliza
`DB_NAME` nem importa registros da empresa. Exige permissão para criar databases.

```sh
MYSQL_TEST_SOCKET=/caminho/absoluto/mysql.sock npm run test:mysql --prefix backend
```

`MYSQL_TEST_USER` e `MYSQL_TEST_PASSWORD` configuram a conexão desse servidor de
teste; não use credenciais de produção. O parâmetro `-- --serve` mantém uma API
sintética em `127.0.0.1:3417` para revisão visual até Enter ou Ctrl+C; o bloco de limpeza
remove a base ao encerrar normalmente. Uma interrupção forçada do processo pode
exigir remover manualmente a base `eletrotech_qa_*` que ele acabou de criar.

Resultado validado nesta entrega: **90 testes automatizados aprovados**, além de
**52 verificações em MySQL 8.0.44**, incluindo schema, migração idempotente, chaves
estrangeiras, login, filtros por equipe, pendências, metas, rascunhos, renovação
de sessão e duas aberturas concorrentes da mesma OS. A concorrência resultou em
uma abertura 200, outra 409 e apenas uma baixa de estoque.

Build concluído e lint sem erros, com avisos de hooks/fast refresh. A revisão no
navegador cobriu os três perfis, equipe restrita, metas mensais/anuais e o
formulário anual em viewport de celular. O ambiente visual usou exclusivamente
a base sintética temporária. Não foi aplicada migração ao banco da empresa.
