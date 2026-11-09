# Backend EletroTech

API Express/MySQL 8, prefixo `/api/v1`. Uma empresa e um banco por instalação.
Os recursos de equipes, metas, checklists, OS, sessões e baixas estão separados
em módulos. Os cadastros legados permanecem em `src/modules/api.routes.js`.

## Configuração

Use Node.js 22.12+ e npm. Copie `.env.example` para `.env` dentro de `backend`.
Preencha `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`,
`JWT_SECRET`, `JWT_EXPIRES_IN` e `CORS_ORIGIN`. `DATABASE_URL` pode substituir as
credenciais separadas. Execute os comandos a partir da raiz com `--prefix backend`.

A porta padrão é 3001. O Vite encaminha `/api` para `127.0.0.1:3001`; se mudar a
porta, configure `VITE_API_PROXY_TARGET` no frontend ou ajuste `VITE_API_URL`. `CORS_ORIGIN` deve conter as origens do
frontend separadas por vírgula. Use o mesmo hostname no frontend e na API;
`localhost` e `127.0.0.1` não compartilham cookies.

`JWT_SECRET` deve ser uma chave própria da instalação, longa e aleatória. Para gerar:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

## Atualizar uma base existente

Faça backup do banco e configure a conexão correta antes de executar:

```sh
npm run db:migrate --prefix backend
```

A migração `001-equipes-metas` adiciona tabelas e colunas, preservando os registros
existentes. As metas antigas permanecem mensais e monetárias. OS antigas recebem
valor de serviço zero; o sistema não infere faturamento pelo custo de materiais.
Supervisores antigos iniciam sem equipe e precisam de associação pelo admin.
Bloqueios antigos sem pendência ganham uma pendência de início para revisão.
Nenhuma OS é liberada automaticamente.

A execução é versionada em `tabela_migracoes` e usa lock de migração. Os comandos
DDL são idempotentes para permitir retomar uma execução interrompida. MySQL faz
commit implícito de DDL: a migração não é uma única transação e não possui rollback
automático. Não há DROP, exclusão de metas ou correção automática de datas legadas.

## Instalação nova

Crie um database MySQL vazio e configure `DB_NAME`. Depois:

```sh
npm run db:init --prefix backend
npm run db:migrate --prefix backend
npm run db:admin --prefix backend
```

`db:init` executa somente `CREATE TABLE IF NOT EXISTS`, sem inserir registros
legados. `db:admin` solicita nome e senha, com entrada oculta no terminal, e não
substitui nem promove uma conta existente. Não existe usuário/senha padrão.

## Iniciar e validar

```sh
npm run dev --prefix backend
npm test --prefix backend
```

`GET /health` verifica o processo HTTP; não verifica conexão ou migrações do banco.
Não execute alterações de schema automaticamente ao iniciar o servidor.

## Sessão

Login devolve usuário e JWT. O React envia `Authorization: Bearer ...`. A sessão
pode ser renovada por cookie `eletrotech_refresh` HttpOnly, SameSite=Strict, com
validade de sete dias e rotação em cada renovação. Em `NODE_ENV=production`, o
cookie exige HTTPS. O access token dura `JWT_EXPIRES_IN` (padrão oito horas).

Permissões, desligamento e equipe são consultados no banco a cada operação.
Logout invalida todas as sessões da conta. Troca de senha também revoga tokens
e cookies anteriores. Login sem permissões é bloqueado. Há limite de cinco
falhas por usuário/IP a cada minuto, mantido no processo; em múltiplas réplicas,
use também um limitador compartilhado na infraestrutura.

## Fotos e assistente

Fotos JPG, PNG, GIF e WebP de até 8 MB são validadas e armazenadas em
`backend/storage/uploads/os`. O conteúdo é servido por endpoint autenticado com
verificação da OS; não há pasta pública de uploads. Faça backup e persista essa
pasta em instalações com volumes/containers. `OS_UPLOAD_DIR` permite outro
caminho absoluto de armazenamento.

O assistente é opcional e depende de `FLOWISE_API_URL`. Sem configuração, sua API
responde 503 com mensagem legível. Não há integração direta com a Enel ou outra
concessionária. O relatório é exibido no frontend e impresso pelo navegador,
inclusive pela opção Salvar como PDF.

## Limites da validação

Os testes automatizados usam banco SQLite em memória, com adaptação de funções
SQL, e não acessam o MySQL da empresa. Também foi executada a verificação opt-in `test:mysql`, com 52 verificações em
MySQL 8.0.44, incluindo uma abertura concorrente. A homologação da configuração
e dos dados reais continua a cargo da instalação. Consulte `../TESTES_UNITARIOS.md`.
