# Acesso do supervisor

O administrador cria o login em **Supervisores → Novo Supervisor**, depois abre
**Associar eletricistas** e seleciona os profissionais ativos da equipe.
Cada eletricista possui um supervisor responsável. Uma transferência exige marcar
a opção correspondente no formulário e revoga o acesso do supervisor anterior.
Também é possível continuar criando o perfil pela tela Usuários.

O supervisor usa o mesmo login do sistema e recebe Dashboard, Minha equipe,
Ordens de Serviço, Metas e Checklists. O marcador `perfil_supervisor` continua
na tabela de permissões; não aparece como módulo na interface.

## Pode fazer

- Acompanhar exclusivamente os eletricistas associados, seus indicadores e OS.
- Solicitar OS apenas para um eletricista ativo da equipe.
- Abrir, fechar e bloquear OS da equipe, registrando motivo quando bloquear.
- Ajustar descrição, local e valor do serviço antes do fechamento.
- Consultar detalhes, comentários, fotos e histórico das OS autorizadas.
- Definir metas mensais e anuais por eletricista, em quantidade de OS,
  faturamento ou ambas, acompanhando os respectivos realizados.
- Criar e selecionar modelos compartilhados de checklist da empresa.
- Revisar pendências da própria equipe e registrar autorização ou negativa.

## Restrições

Sem acesso a Usuários, Supervisores, cadastro administrativo de Eletricistas,
Produtos, Movimentações e Baixas manuais. Materiais necessários à execução estão
disponíveis dentro da própria OS. Supervisor sem equipe recebe listas vazias.

A restrição vale na API, inclusive por ID, para relatórios, fotos, opções de
atribuição e tokens já emitidos. O vínculo é consultado no banco; não é copiado
para o JWT. A transferência leva consigo o acesso ao histórico operacional do
eletricista. No desligamento, ele é removido da equipe; a reativação requer nova
associação pelo administrador.

Uma negativa mantém a OS bloqueada. A gestão pode revisar novamente a pendência
após a correção. Fechamento de OS bloqueada é recusado; a decisão e seu autor
ficam no histórico. OS fechadas preservam seus dados, permitindo somente novos
comentários/fotos anexados como registros adicionais.

Aplique primeiro a migração descrita em [backend/README.md](backend/README.md).
Detalhes das regras: [docs/operacao-e-permissoes.md](docs/operacao-e-permissoes.md).
