# Camadas de rotas do EletroTech

```text
App.jsx / RotaProtegida
  → página React
  → src/api/<recurso>.js
  → Axios: token, cookie, renovação e envelope
  → /api/v1 (proxy Vite em desenvolvimento)
  → app.js / routes/index.js
  → modules/<recurso>/*.routes.js
  → requireAuth + papel/permissão
  → service / shared/scope.js
  → query() ou transaction()
  → MySQL
```

A interface filtra menus e ações. A segurança definitiva está no backend, que
recarrega o usuário e consulta o vínculo de equipe. Acesso direto a URLs,
relatórios, fotos ou IDs não amplia o escopo. O JWT não armazena uma lista de
profissionais que possa ficar desatualizada após uma transferência.

## Interface

`/home` é a apresentação inicial; `/menu` é o dashboard. `/supervisores` é
exclusiva do admin; `/equipe` mostra a equipe do supervisor. `/usuarios`,
`/eletricistas`, `/produtos`, `/metas`, `/ordem-servico`, `/checklist`,
`/consulta-checklist`, `/baixas` e `/lancamentos` preservam os módulos existentes.

`AuthContext` valida a sessão na abertura e no foco da janela. O cliente HTTP
renova um token expirado uma vez, compartilha a renovação entre requisições
simultâneas e preserva `response.meta` para paginação.

## Backend

- `modules/auth`: login, cookie de renovação e logout.
- `modules/supervisores`: contas e equipes administradas pelo admin.
- `modules/metas`: metas e cálculo de realizados por período.
- `modules/checklist`: modelos, pendências, relatórios e decisões.
- `modules/ordens-servico`: estados, materiais, eventos e arquivos protegidos.
- `modules/baixas`: consultas de movimentação e lançamentos manuais.
- `modules/api.routes.js`: agregação e cadastros já existentes.
- `services/dashboard.service.js` / `repository/dashboard.repository.js`:
  indicadores e gráficos no mesmo escopo.

`shared/validation.js` valida números, datas e períodos. `shared/scope.js`
centraliza as restrições por eletricista/supervisor. Alterações de estoque,
associações e decisões usam transações. As OS e os produtos são bloqueados na
transação antes da mudança de estado; a finalização de baixa exige rascunho próprio.

## Banco e documentação

`database/schema.sql` inicializa tabelas sem dados pessoais. `db:migrate`
aplica alterações aditivas e versionadas. O schema real continua MySQL, sem ORM
ou troca de stack. A modularização entregue está descrita acima; a proposta
histórica mais ampla permanece em `guia-backend-para-ia.md`.

Os contratos atuais estão em `definicao-de-endpoints.md`, e as regras de negócio
em `operacao-e-permissoes.md`.
