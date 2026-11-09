# Acesso do eletricista

O administrador cadastra o eletricista com nome, CPF, contratação e senha. O
cadastro cria o login vinculado, usando CPF como usuário. Para cadastro antigo
sem conta, informar uma senha na edição libera o acesso. Senhas têm mínimo de
oito caracteres e máximo de 72 bytes.

O eletricista entra na mesma tela de login com CPF e senha e acessa Dashboard,
Ordens de Serviço e Metas. Os módulos são fixos, mesmo em contas antigas com
permissões adicionais. Uma conta vinculada não pode ser promovida a admin ou
supervisor.

## Operação

- Consulta somente suas OS, detalhes, materiais, respostas, fotos e histórico.
- Abre uma OS atribuída, na data programada ou depois, respondendo ao checklist
  de início e informando materiais quando houver consumo.
- Fecha uma OS aberta e sem bloqueios, respondendo ao checklist de fim e
  justificando respostas que impedem o fechamento.
- Pode anexar fotos opcionais na abertura, fechamento e comentários.
- Acompanha suas metas mensais e anuais de OS e/ou faturamento, sem alterá-las.

Não solicita novas OS, não bloqueia/desbloqueia ordens e não decide pendências.
Essas ações pertencem à gestão. Também não acessa usuários, supervisores,
equipe, cadastros, estoque ou baixas manuais. As fotos são obtidas pela API
com a mesma autorização da OS, nunca por endereço público.

Respostas bloqueadoras registram uma pendência e mantêm a OS bloqueada até a
revisão da gestão. Não é possível usar o fechamento para contornar esse estado.
O consumo de estoque ocorre uma única vez na abertura, inclusive quando o
checklist gera bloqueio, mantendo o comportamento documentado do projeto.

Desligamento bloqueia login, tokens e renovação de sessão. A reativação preserva
os registros pessoais, mas a associação a supervisor deve ser refeita pelo admin.

A atualização exige a migração aditiva. Execução e configuração estão em
[backend/README.md](backend/README.md). Regras completas em
[docs/operacao-e-permissoes.md](docs/operacao-e-permissoes.md).
