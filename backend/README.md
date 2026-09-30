# Backend EletroTech

API Express da migração do CodeIgniter para Node.js, organizada em torno dos
recursos descritos em `../docs/definicao-de-endpoints.md`.

## Executar

1. Importe o banco legado em MySQL 8 usando
   `../projeto-eletrotech/script-sql/script-criacao-banco.sql`.
2. Copie `.env.example` para `.env` e preencha as credenciais do MySQL.
3. Rode `npm install` e `npm run dev`.

A API atende em `http://localhost:3001/api/v1`; a verificação de saúde fica em
`GET /health`. O frontend Vite já usa essa URL por padrão.

## Autenticação

`POST /api/v1/auth/login` devolve um `accessToken`. Todas as rotas protegidas
aceitam `Authorization: Bearer <accessToken>`. O React guarda esse token junto
do usuário autenticado e o envia automaticamente.

## Cobertura atual

Os recursos de autenticação, usuários, eletricistas, produtos, metas,
checklists, ordens de serviço, movimentações, baixas, lançamentos, dashboard e
chat estão implementados. Operações que alteram estoque usam transação MySQL.
