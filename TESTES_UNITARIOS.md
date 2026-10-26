# Primeiros testes unitários

Foram escolhidas duas funções simples do controle de acesso. São somente quatro
testes, usando o Vitest que o projeto já possui.

| Função | O que os testes verificam |
| --- | --- |
| `normalizedUser` | Administrador recebe todos os módulos; eletricista recebe somente Dashboard, Ordens de Serviço e Metas, mesmo com permissões antigas. |
| `requirePermission` | Usuário com a permissão pode continuar; usuário sem a permissão recebe erro 403. |

O código fica em `backend/test/unit/access.unit.test.js`, com comentários
explicativos. Cada teste chama a função diretamente. Não é necessário configurar
um banco de dados nem iniciar o servidor. `vi.fn()` simula a função `next` do
Express para verificar se o acesso foi autorizado ou bloqueado.

Para executar apenas esses quatro testes, abra o terminal na raiz do projeto:

```sh
npm run test:unit --prefix backend
```

Se estiver dentro de `backend/`, use `npm run test:unit`.

As dependências da raiz e do backend devem estar instaladas (`npm ci` e
`npm ci --prefix backend`). Os testes anteriores continuam disponíveis pelo
comando `npm test --prefix backend`, que também inclui os novos testes unitários.

Não foi necessário alterar as funções do sistema nem adicionar dependências.

## Validação realizada

Os **quatro testes unitários passaram**. A suíte completa também foi validada:
**43 testes aprovados**, incluindo os testes de integração e de interface.
O build foi concluído e o lint terminou sem erros, mantendo os avisos do projeto.
