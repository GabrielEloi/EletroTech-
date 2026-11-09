# Operação e permissões do EletroTech

## Decisões confirmadas

Cada instalação atende uma empresa em banco próprio. O administrador cria
supervisores e associa eletricistas ativos a eles. O supervisor acompanha apenas
os associados, pode solicitar, abrir, fechar e bloquear OS dessa equipe e define
metas mensais e anuais de quantidade de OS e/ou faturamento.

Foi adotado um responsável por eletricista. O vínculo é atual, não uma cópia
histórica na OS: transferir o eletricista transfere ao novo supervisor a consulta
às suas OS e metas anteriores. Não há isolamento por múltiplas empresas dentro
da mesma base. Checklists são modelos compartilhados da empresa.

## Matriz de acesso

| Recurso ou ação | Admin | Supervisor | Eletricista |
| --- | --- | --- | --- |
| Dashboard | Geral | Equipe atual | Pessoal |
| Usuários e permissões | Gerencia | Bloqueado | Bloqueado |
| Supervisores e associações | Gerencia | Bloqueado | Bloqueado |
| Cadastro/contratação/desligamento de eletricistas | Gerencia | Bloqueado | Bloqueado |
| Minha equipe | Consulta geral pela API | Somente associados ativos | Bloqueado |
| Consultar OS, detalhes, fotos e histórico | Todas | Somente associados | Somente próprias |
| Solicitar OS | Eletricistas ativos | Associados ativos | Bloqueado |
| Abrir e fechar OS | Todas, respeitando estado | Somente associados | Somente próprias |
| Bloquear OS | Sim, com motivo | Associados, com motivo | Bloqueado |
| Revisar bloqueio | Sim, com observação | Associados, com observação | Bloqueado |
| Modelos de checklist | Gerencia | Gerencia | Responde dentro da OS |
| Metas | Gerencia e consulta | Gerencia e consulta associados | Consulta próprias |
| Produtos e estoque | Gerencia | Acesso apenas a materiais dentro da OS | Acesso apenas a materiais dentro da OS |
| Baixas e movimentações manuais | Gerencia | Bloqueado | Bloqueado |

O perfil legado **Padrão** continua disponível com permissões por módulo. Não
recebe papel de supervisor nem equipe. Gestão de OS, metas e checklists exige
admin/supervisor. Cadastros e consultas de módulos delegados mantêm o controle
por permissão existente. Sem nenhum módulo, o login é recusado.

## Cadastro e manutenção das equipes

1. Admin cadastra os eletricistas com CPF e senha. O acesso pessoal é criado na
   mesma transação, sem senha padrão baseada em CPF.
2. Em Supervisores, cria nome de usuário e senha e salva a conta.
3. Abre Associar eletricistas. São oferecidos somente os ativos, com identificação
   do supervisor atual, quando houver.
4. Seleciona a equipe. Para mover pessoas de outro supervisor, marca a autorização
   de transferência. O salvamento é transacional.
5. Desmarcar remove o vínculo. Desligar o eletricista também o remove da equipe e
   revoga suas sessões; reativar não recompõe o vínculo automaticamente.

Supervisor sem equipe vê listas e indicadores vazios. Não há retorno automático
a consultas globais. Usuários antigos recebem acesso somente após associação.
A mudança de perfil de supervisor para outro papel remove seus vínculos.

`shared/scope.js` aplica o mesmo filtro em OS, metas, dashboard e equipe. As
consultas por ID e as transações revalidam o responsável. A API nunca confia em
IDs de eletricistas enviados pelo cliente para ampliar o acesso. Filtros de
outro profissional são ignorados no perfil pessoal ou retornam lista vazia no
perfil de supervisão. Ações por ID fora do escopo retornam 403.

## Estados das ordens de serviço

| Estado atual | Ação | Próximo estado |
| --- | --- | --- |
| Solicitada | Abrir com checklist válido | Aberta |
| Solicitada | Abrir com resposta bloqueadora | Bloqueada, pendência de início |
| Solicitada ou aberta | Gestão bloqueia com motivo | Bloqueada, origem manual |
| Aberta sem pendências | Fechar com checklist válido | Fechada |
| Aberta sem pendências | Fechar com resposta bloqueadora e justificativa | Bloqueada, pendência de fim |
| Bloqueada | Gestão autoriza pendência de início | Aberta |
| Bloqueada | Gestão autoriza pendência de fim | Fechada na data da decisão |
| Bloqueada por ação manual | Gestão autoriza | Estado anterior ao bloqueio |
| Bloqueada | Gestão nega | Permanece bloqueada |

A negativa pode ser revista após a correção das condições, com nova observação.
O histórico mantém as duas decisões, seus autores e datas. Não há liberação por
fechamento direto. A autorização não ignora outras pendências ainda abertas.

A OS pode ser programada para data futura, mas sua abertura só é aceita na data
programada ou depois. A solicitação pode informar descrição, local e valor do
serviço. A gestão pode ajustar esses campos antes do fechamento; o eletricista
não altera o valor. Materiais são opcionais e cada produto aparece uma vez.

A abertura bloqueia a OS e os produtos durante a transação, grava respostas,
consome estoque e registra movimentações. O consumo ocorre também na abertura
que gera pendência, preservando a regra do projeto anterior. Revisar ou bloquear
não repete o consumo nem estorna materiais automaticamente. Saldo insuficiente
cancela toda a operação, inclusive as respostas inseridas.

As perguntas selecionadas são obrigatórias. Perguntas de seleção aceitam apenas
`sim` ou `nao`. No checklist final, respostas que bloqueiam exigem justificativa.
A gestão seleciona um modelo por tipo (início/fim); modelos usados em respostas
não podem ser excluídos. Um modelo padrão precisa ser substituído antes de excluir.

Fechamento torna os dados do serviço imutáveis. Comentários e fotos posteriores
são registros adicionais, sem alterar dados, respostas ou eventos anteriores.
O histórico de eventos mostra usuário, ação, observação e data.

## Metas e faturamento

A meta pertence a um eletricista e a um período:

- Mensal: referência `YYYY-MM`.
- Anual: referência `YYYY`.
- Quantidade: número inteiro positivo de OS a cumprir.
- Faturamento: valor positivo em reais a realizar.
- Ambas: os dois objetivos informados na mesma meta.

É obrigatória pelo menos uma medida. Valor monetário zero significa ausência de
objetivo financeiro quando há meta de quantidade. Não se cria outra meta do mesmo
profissional, periodicidade e referência; edita-se a existente. Período e responsável
não são alterados pela edição. As metas existentes são preservadas como mensais.

Quantidade realizada é a contagem de OS com status fechado pela **data de
fechamento**, incluindo uma revisão de fim autorizada naquele período.
Faturamento realizado é a soma de `valor_servico` dessas mesmas OS. OS abertas,
solicitadas ou bloqueadas não contam como realizadas. Custo de materiais não é
faturamento. Essa medida representa valor operacional dos serviços concluídos,
sem conciliação de pagamentos ou emissão fiscal.

A comparação usa intervalo fechado no início e aberto no fim do período, evitando
sobreposição entre meses/anos. Metas mensais e anuais são independentes e não
são somadas entre si. O painel apresenta os dois acompanhamentos; os cartões de
meta financeira/quantidade usam apenas o mês de referência. Sem filtro, indicadores
de OS podem representar todo o histórico, enquanto a meta mensal se refere ao mês
atual e a anual ao ano atual. Rótulos de "metas atingidas" foram substituídos.

## Baixas, relatórios e datas

Cada admin tem um rascunho de entrada e um de saída, no máximo. Apenas o criador
pode incluir/remover itens, finalizar ou cancelar seu rascunho. Outro admin pode
consultar relatórios, mas não editar o rascunho por ID. Depois de finalizada ou
cancelada, a baixa não aceita novas alterações de itens.

Finalizar aplica estoque e movimentações em uma transação com locks. Cancelar
rascunho não movimenta estoque. Quantidades são inteiras positivas e valores não
são negativos. Totais de movimentações usam os mesmos filtros da listagem.

Relatórios usam chamadas autenticadas pelo cliente HTTP e são exibidos em modal.
Imprimir/Salvar PDF usa a impressão do navegador. Não há links para controllers
PHP nem envio do token em URL. Datas de calendário são formatadas sem conversão
de fuso, evitando o deslocamento de um dia. A data operacional usa America/Fortaleza.

## Arquivos e validação

- `backend/src/database`: schema inicial sem dados pessoais, migração versionada
  e comando para criar administrador.
- `backend/src/modules/supervisores`: gestão exclusiva do admin e consulta de equipe.
- `backend/src/shared/scope.js`: restrições por responsável e equipe.
- `backend/src/modules/ordens-servico`: estados, estoque, eventos e fotos.
- `backend/src/modules/checklist`: modelos, pendências, decisões e relatórios.
- `backend/src/modules/metas`: períodos, objetivos e realizados.
- `backend/src/modules/baixas`: movimentações e rascunhos protegidos.
- `backend/src/modules/auth`: login, limite de tentativas, renovação e logout.
- `src/pages/SupervisoresPage.jsx` e `EquipePage.jsx`: novas telas no tema existente.
- `src/components/Relatorio.jsx`, `ResumoMetas.jsx` e `FotoOs.jsx`: componentes reutilizados.

Não foram adicionadas dependências. As verificações incluem testes de API com
banco em memória, renderização dos controles por perfil, build e lint. A aplicação
real continua usando MySQL 8. Execute a migração e homologue no banco de destino;
os testes não simulam locks ou concorrência do MySQL.
