# Acesso do supervisor

Implementado na versão React/Node do EletroTech, seguindo o controle de acesso
existente. O supervisor usa a mesma tela de login, com usuário e senha.

## Permissões

| Área | Supervisor |
| --- | --- |
| Dashboard | Consulta os indicadores da equipe |
| Ordens de Serviço | Consulta, solicita para eletricistas cadastrados e acompanha a execução |
| Metas | Consulta e gerencia as metas da equipe |
| Checklists | Cria modelos e perguntas e gerencia a seleção de checklists |
| Usuários | Acesso bloqueado |
| Eletricistas | Acesso ao cadastro bloqueado |
| Produtos e movimentações | Sem permissão de acesso aos módulos |

As ações de OS mantêm as validações existentes de estoque, status e checklist.
A restrição do eletricista aos próprios dados continua valendo.

## Como criar ou liberar uma conta

1. Entre como administrador e abra **Usuários**.
2. Crie um usuário ou edite uma conta padrão já existente.
3. Em **Perfil de acesso**, selecione **Supervisor** e salve.
4. A pessoa entra com o usuário e a senha dessa conta. Se já estava conectada,
   deve sair e entrar novamente para atualizar o menu exibido.

O administrador também pode escolher **Padrão** para remover o perfil. As
permissões são revalidadas na API a cada requisição, inclusive para tokens já
emitidos. Uma conta vinculada a eletricista continua com seu perfil próprio;
o último administrador não pode ser convertido em supervisor.

## Persistência e alterações

Não é necessária migração SQL. O perfil é identificado por uma entrada interna
`perfil_supervisor` na tabela `tabela_usuario_permissao` existente. Esse marcador
não aparece como um módulo na interface. Ao carregar o usuário, o sistema define
as permissões fixas `menu`, `ordemServico`, `metas` e `checklist`.

- `backend/src/shared/access.js`: identifica o supervisor e centraliza os módulos
  fixos e a autorização para gestão de OS.
- `backend/src/middlewares/auth.js`: autoriza administradores e supervisores a
  solicitar OS, mantendo a gestão de usuários exclusiva do administrador.
- `backend/src/modules/api.routes.js`: salva o perfil junto com as permissões,
  devolve o perfil efetivo na listagem de usuários, libera a gestão de OS ao
  supervisor e oferece `GET /metas/opcoes` com apenas ID e nome dos eletricistas
  ativos. As alterações de conta são salvas em transação.
- `src/pages/UsuariosPage.jsx`: oferece a seleção de perfil no cadastro e na
  edição e mostra a identificação de Supervisor na lista de usuários.
- `src/constants/permissoes.js` e `src/context/AuthContext.jsx`: aplicam os módulos
  fixos também ao menu e às rotas protegidas da interface.
- `src/pages/OrdemServicoPage.jsx`: disponibiliza a ação Solicitar OS ao supervisor.
- `src/api/metas.js` e `src/pages/MetasPage.jsx`: buscam as opções de atribuição
  pelo módulo de metas, sem liberar o cadastro de eletricistas.
- `src/api/usuarios.js`: envia JSON para preservar o perfil e listas vazias de
  permissões na edição das contas.

Os pontos de decisão têm comentários no código. Nenhuma dependência foi adicionada.

## Validação

Foram acrescentados sete cenários aos testes existentes: perfil do supervisor,
criação/edição/revogação do acesso, operações permitidas, cadastros bloqueados,
opções de atribuição, navegação e ações visíveis.

- Suíte completa: **50 testes aprovados**.
- Build: concluído.
- Lint: sem erros, com os avisos já presentes na estrutura do projeto.

```sh
npm test --prefix backend
npm run test:unit --prefix backend
npm run build
npm run lint
```

A suíte de integração usa o banco em memória descrito nos testes existentes.
O ambiente real continua usando MySQL e requer suas credenciais configuradas;
nenhum banco de produção foi acessado durante esta alteração.
