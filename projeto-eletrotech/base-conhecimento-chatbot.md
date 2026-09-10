# Base de Conhecimento — EletroTech Soluções Elétricas Integradas

> Documento de referência do sistema interno EletroTech, usado para alimentar o
> assistente de IA (chatbot) do sistema. Descreve **o estado atual** da aplicação:
> módulos, funcionalidades, regras de negócio, níveis de acesso e modelo de dados.
> Substitui e amplia o "Desafio Técnico" original (que cobria apenas a primeira fase).

---

## 1. Sobre a EletroTech

A EletroTech Soluções Elétricas Integradas é uma empresa especializada em soluções
completas para instalações elétricas, manutenção, monitoramento e distribuição de
energia, atuando desde projetos residenciais até sistemas comerciais, industriais e
prediais. O compromisso da empresa é garantir segurança elétrica, eficiência
operacional e inovação.

O **sistema interno EletroTech** é um back-office que centraliza o controle de estoque
de materiais elétricos, ordens de serviço, metas e desempenho das equipes técnicas,
além da gestão de usuários e eletricistas.

## 2. Visão geral do sistema

O sistema é uma aplicação web de gestão (back-office) composta pelos seguintes módulos:

- **Login e controle de acesso** — autenticação e níveis de permissão.
- **Dashboard (Menu)** — página inicial do administrador com indicadores e gráficos.
- **Usuários** — gestão de contas de acesso e permissões (exclusivo de administrador).
- **Eletricistas** — cadastro dos funcionários técnicos (com histórico preservado).
- **Produtos** — catálogo e estoque de materiais elétricos.
- **Metas** — objetivos mensais de desempenho por eletricista.
- **Checklist** — perguntas de verificação para abertura e fechamento de OS.
- **Ordens de Serviço (OS)** — registro das operações elétricas em campo.
- **Baixas / Movimentações** — histórico de entradas e saídas de estoque e relatórios.
- **Assistente de IA (Chatbot)** — ajuda contextual dentro do sistema.

## 3. Login e níveis de acesso

### 3.1. Tela de Login
A tela de login é o ponto de entrada e a primeira página exibida. Somente usuários
cadastrados acessam o sistema; o acesso direto a qualquer página interna sem login é
bloqueado e redireciona para o login.

- **Login unificado:** o identificador informado pode ser o **nome de usuário** OU o
  **CPF** do eletricista vinculado à conta. A senha é sempre verificada por hash.
- **Campos vazios** ou **credenciais inválidas** exibem mensagem de erro.
- **Proteção contra força bruta (rate limiting):** após **5 tentativas** falhadas de
  login, o acesso é bloqueado por **60 segundos**.
- **Eletricista demitido** (com data de demissão preenchida) não consegue acessar,
  mesmo que a conta ainda exista — a mensagem orienta a falar com o administrador.
- O botão **Sair** encerra a sessão e retorna ao login.

### 3.2. Perfis de acesso
Existem três perfis:

1. **Administrador (`is_admin = 1`)** — superusuário. Enxerga todos os módulos, e é o
   único que pode gerenciar usuários e permissões. Ao logar, cai no **Dashboard (home)**.
2. **Usuário comum (não-admin)** — vê apenas os módulos cujas **permissões** o
   administrador liberou. Ao logar, é direcionado ao **primeiro módulo liberado**. Se
   não tiver nenhuma permissão, não consegue entrar e é orientado a falar com o admin.
3. **Eletricista (usuário vinculado a um eletricista)** — usuário comum cuja conta está
   associada a um cadastro de eletricista. Além das permissões, sofre restrições
   específicas nas Ordens de Serviço (ver seção 9.4).

### 3.3. Permissões concedíveis
O administrador concede permissões por módulo. As permissões disponíveis são:

- **Dashboard** (`menu`)
- **Ordens de Serviço** (`ordemServico`)
- **Checklist** (`checklist`)
- **Produtos** (`produtos`)
- **Baixas** (`baixas`)
- **Metas** (`metas`)
- **Eletricistas** (`eletricistas`)

O módulo **Usuários** não é uma permissão concedível: gerenciar usuários e permissões é
**exclusivo de administradores** (impede que um não-admin libere acesso de admin para si
mesmo). As permissões são resolvidas a partir do banco a cada requisição, então qualquer
mudança feita pelo admin passa a valer no acesso seguinte do usuário.

## 4. Dashboard (Menu)

Página inicial do administrador, com indicadores e gráficos de acompanhamento:

- **Totais:** número de eletricistas ativos, de produtos, de ordens de serviço e a soma
  do valor das metas cadastradas.
- **OS por eletricista** — quantidade de ordens por técnico.
- **OS por mês** — evolução mensal, com filtro por mês.
- **OS por status** — proporção entre ordens solicitadas, abertas e fechadas.
- **Movimentação financeira por mês** — valor de entradas e saídas de estoque por mês.

## 5. CRUD de Usuários (exclusivo de administrador)

Gerenciamento de contas de acesso em uma única tela (criar, listar, editar, excluir).

| Operação | Regras |
|---|---|
| **Criar** | Nome de usuário único + senha de **no mínimo 8 caracteres** (armazenada com hash). Pode marcar como administrador e definir permissões. **Não é possível vincular um eletricista por aqui** — contas de eletricista nascem na tela de Eletricistas (ver seção 6). |
| **Listar** | Exibe os usuários; a senha nunca é mostrada. |
| **Editar** | Altera nome, perfil de admin e permissões. A senha só é alterada se uma nova for informada (mínimo 8 caracteres) e é recriptografada. O vínculo com eletricista não é editável. |
| **Excluir** | Remove o usuário com confirmação. |

**Regras de proteção:**
- Não é permitido dois usuários com o mesmo nome.
- Um eletricista só pode estar vinculado a **um** usuário.
- Um usuário **sem permissão nenhuma não pode ser salvo** — sem nenhum acesso ele não
  conseguiria entrar no sistema. (Administrador é exceção: já tem acesso a tudo, e suas
  permissões individuais são zeradas por serem redundantes.)
- Uma **conta de eletricista não pode ser promovida a administrador**, e seu nome de
  usuário (o CPF) não pode ser renomeado.
- Não é possível **remover o acesso de admin do último administrador**, nem **excluir o
  último administrador**.
- O usuário **não pode excluir a própria conta**.
- A exclusão falha (com aviso) se o registro estiver vinculado a outras informações.

## 6. CRUD de Eletricistas (Funcionários)

Módulo crítico, pois eletricistas estão vinculados a Metas e Ordens de Serviço.

| Campo / Regra | Descrição |
|---|---|
| **CPF** | Único por registro; exige 11 dígitos numéricos. É também o **login** da conta. |
| **Nome** | Nome completo do eletricista (mínimo 3 caracteres). |
| **Data de contratação** | Início das atividades na empresa. |
| **Data de demissão** | NULL = ativo; preenchida = demitido. |
| **Senha de acesso** | Mínimo 8 caracteres; informada já no cadastro. |

**Conta de acesso criada junto com o cadastro:**
Cadastrar um eletricista **cria automaticamente o usuário de sistema dele**, na mesma
transação (se qualquer parte falhar, nada é gravado):
- O **login é o CPF** e a senha é a informada no cadastro.
- A conta nasce como **não-administrador**, com as permissões padrão de eletricista:
  **Dashboard** (`menu`) e **Ordens de Serviço** (`ordemServico`).
- O cadastro é recusado se o CPF já existir como eletricista **ou** já estiver em uso
  como login de outro usuário.
- A **senha pode ser redefinida pela própria tela de Eletricistas**, na edição.

**Regras de negócio:**
- **Exclusão proibida:** nenhum eletricista é apagado do banco — preserva-se o histórico.
- **Demitir / Reativar (soft delete):** demitir preenche a data de demissão; reativar
  (readmitir) limpa a data. Apenas eletricistas ativos podem receber metas e abrir OS.
- Na edição, apenas o **nome** e a **senha de acesso** são alteráveis (CPF e datas são
  gerenciados por cadastro/demissão/reativação).
- **Histórico visível:** a tela permite consultar o histórico de OS do eletricista,
  mostrando ID, data da OS, status e data de fechamento.

## 7. CRUD de Produtos (Materiais Elétricos)

Controle do estoque de materiais elétricos (cabos, disjuntores, tomadas, eletrodutos etc.).

| Campo / Regra | Descrição |
|---|---|
| **Nome do produto** | Nome/descrição do material (ex.: "Cabo Flexível 2,5mm²", "Disjuntor DIN 16A"). |
| **Valor unitário (R$)** | Preço unitário; aceita valores decimais. |
| **Quantidade em estoque** | Número inteiro; **nunca negativo**. |

**Regras de negócio:**
- **Exclusão proibida:** produtos não são apagados do banco.
- **"Excluir" = zerar estoque:** a ação de excluir define a quantidade como 0, mantendo
  o registro e o histórico.
- **Estoque nunca negativo:** o sistema jamais permite quantidade negativa.
- **Reposição / entrada de estoque:** é possível **aumentar a quantidade** de um produto
  (reposição), o que gera uma movimentação de entrada.
- Na edição comum, apenas **nome** e **valor unitário** são alterados; a quantidade é
  controlada pelas movimentações (entradas, saídas por OS e baixas).

## 8. CRUD de Metas

Objetivos mensais de desempenho financeiro atribuídos a eletricistas ativos. Cada meta
associa um eletricista, um mês de referência e um valor.

| Operação | Regras |
|---|---|
| **Criar** | Informar eletricista (ativo), mês de referência e valor da meta. |
| **Consultar** | Listar metas com filtro por eletricista e/ou por mês de referência. |
| **Editar** | Somente o **valor** da meta pode ser alterado após o cadastro. |
| **Excluir** | Permitida a exclusão completa de uma meta. |

**Regra de imutabilidade:** após o cadastro, **não** é permitido alterar o eletricista
vinculado nem o mês de referência — apenas o valor.

## 9. Ordens de Serviço (OS)

Uma OS representa uma operação elétrica realizada por um eletricista. Cada ordem envolve
um ou mais materiais, cujas quantidades são debitadas do estoque no momento da **abertura**
(feita pelo eletricista), e não no momento da solicitação.

### 9.1. Ciclo de vida (status) da OS
A OS passa por três status, em ordem:
- **Solicitada** — estado inicial. O **administrador** solicita o serviço e atribui um
  eletricista responsável. Ainda não há materiais nem baixa de estoque.
- **Aberta** — o **eletricista responsável** abriu a OS, informou os materiais e respondeu
  o checklist de início. É neste momento que o estoque é debitado.
- **Fechada** — após concluída, com data de fechamento preenchida.

### 9.2. Solicitação da OS (administrador)
Ao solicitar uma OS informa-se: **eletricista responsável** (deve estar ativo) e a **data
da operação** (opcional; se informada, no formato AAAA-MM-DD). A OS nasce com status
**Solicitada** e fica aguardando a abertura pelo eletricista.

Apenas o **administrador** pode solicitar novas ordens de serviço.

### 9.3. Abertura da OS (eletricista)
Partindo de uma OS **Solicitada**, o eletricista responsável (ou o administrador) informa
a **lista de materiais** com as quantidades utilizadas e responde o checklist de início.

Regras de abertura:
- Só é possível abrir uma OS que esteja com status **Solicitada** — uma OS já aberta ou
  fechada não pode ser reaberta (isso baixaria o estoque duas vezes).
- O eletricista só pode abrir **ordens atribuídas a ele**.
- O mesmo produto **não** pode ser adicionado mais de uma vez na mesma OS.
- A quantidade de cada material deve ser maior que zero.
- O **estoque é debitado automaticamente** de forma atômica (transação): se não houver
  estoque suficiente para algum material, a OS **continua Solicitada** e nada é alterado.
- Cada saída de material gera uma **movimentação de saída** vinculada à OS.
- É obrigatório existir um **checklist de início selecionado** (ver seção 10). Todas as
  perguntas devem ser respondidas: as do tipo **Sim/Não** aceitam só "Sim" ou "Não"; as do
  tipo **texto livre** aceitam qualquer resposta. Se a pergunta tem um **valor de bloqueio**
  configurado e a resposta bate com ele, a abertura da OS é **impedida**.
- Opcionalmente pode-se anexar uma **foto de abertura**, registrada no histórico da OS.

### 9.4. Fechamento da OS
Só é possível fechar uma OS que esteja **Aberta**. É obrigatório existir um **checklist de
fim selecionado**. Todas as perguntas devem ser respondidas. Se a pergunta tem um **valor
de bloqueio** configurado e a resposta bate com ele, o **fechamento é impedido** — a mesma
regra da abertura, valendo tanto para perguntas Sim/Não quanto para texto livre. Ao fechar,
a data de fechamento é registrada. Opcionalmente pode-se anexar uma **foto de fechamento**.

> OS fechadas antes dessa regra podem ter um **motivo** registrado junto da resposta: na
> versão anterior, a resposta de bloqueio no fechamento pedia justificativa em vez de
> barrar a OS. Esses motivos continuam visíveis nos detalhes da OS.

### 9.5. Restrições do perfil eletricista
Quando o usuário é um eletricista (conta vinculada):
- Só **visualiza as próprias OS** (não vê as dos outros).
- **Não pode solicitar** novas ordens de serviço — isso é exclusivo do administrador.
- Pode **abrir e fechar** as OS atribuídas a ele.
- Só acessa detalhes/comentários das próprias ordens.

O administrador continua podendo fazer tudo: solicitar, abrir e fechar qualquer OS.

### 9.6. Imutabilidade e histórico
As ordens de serviço **não podem ser editadas nem excluídas** após o registro — elas
representam o histórico de operações. A listagem mostra todas as operações registradas,
com detalhamento dos materiais utilizados, respostas de checklist e comentários.

### 9.7. Comentários e fotos
Cada OS possui um histórico de **comentários** e **fotos**:
- É possível adicionar um comentário em texto, uma foto, ou ambos.
- Formatos de imagem aceitos: JPG, JPEG, PNG, GIF, WEBP (até 8 MB). O sistema gera uma
  miniatura para exibição leve no histórico.
- Fotos de abertura e de fechamento também entram nesse histórico.

## 10. Checklist

Módulo que define listas de verificação usadas na abertura e no fechamento das OS.

- Cada checklist tem um **título** e um **tipo**: **início** ou **fim**.
- Cada checklist contém uma ou mais **perguntas**. Cada pergunta tem um **tipo de resposta**:
  **Sim/Não** (radio) ou **texto livre** (text), e um campo opcional **"Bloqueia se"**.
- O campo **"Bloqueia se"** define qual resposta é considerada problemática (ex.: "Não").
  Se ficar **em branco, a pergunta nunca bloqueia** — serve só como registro. A comparação
  ignora acentos e maiúsculas, então "Não" e "nao" são equivalentes.
- Para cada tipo (início/fim) há um checklist marcado como **padrão (selecionado)**, que
  é o efetivamente aplicado nas OS. Ao cadastrar o primeiro checklist de um tipo, ele
  vira o padrão automaticamente; o administrador pode trocar o padrão a qualquer momento.
- É possível filtrar checklists por título e por tipo.
- Um checklist pode ser excluído, desde que não esteja em uso como padrão / com vínculos
  que impeçam a remoção.

**Papel na operação:**
- **Checklist de início** — respondido na abertura da OS; uma resposta que bate com o
  "Bloqueia se" da pergunta impede a abertura.
- **Checklist de fim** — respondido no fechamento; uma resposta que bate com o
  "Bloqueia se" impede o fechamento.

> Atenção ao cadastrar: uma pergunta com "Bloqueia se" **em branco nunca barra nada**,
> nem na abertura nem no fechamento. Para que uma resposta impeça a OS, o valor precisa
> estar preenchido (ex.: "Não").

## 11. Baixas / Movimentações de estoque

Registra e consulta todo o histórico de entradas e saídas do estoque.

**Tipos de movimentação:**
- **Entrada** — reposições de estoque (origem "Reposição de estoque", "Estoque inicial").
- **Saída** — consumo por OS (origem "OS #NNNNN", vinculada à ordem) ou **baixa manual**
  de estoque.

Cada movimentação guarda: produto, tipo (entrada/saída), quantidade, valor unitário,
data, origem e, quando aplicável, a OS vinculada.

**Funcionalidades:**
- **Consulta com filtros:** por tipo, produto e intervalo de datas, com totais de valor
  de entrada e de saída.
- **Detalhe da movimentação:** quando a movimentação vem de uma OS, o detalhe também
  mostra os materiais e as respostas de checklist daquela OS.
- **Relatório misto:** o usuário seleciona várias movimentações e gera um relatório
  consolidado, com o total de entradas e o total de saídas do conjunto selecionado.

## 12. Assistente de IA (Chatbot)

O sistema inclui um **assistente de IA** integrado à interface, disponível como um
componente de chat nas telas. Ele responde a dúvidas sobre o sistema e as regras de
negócio com base neste documento de conhecimento.

- Tecnicamente, a mensagem do usuário é enviada ao back-end, que faz proxy para a API do
  **Flowise** (RAG), e a resposta é devolvida ao chat.
- O objetivo do assistente é dar suporte e orientar a navegação e o uso do sistema.

## 13. Modelo de dados (tabelas)

Além das tabelas base, o sistema utiliza:

- **tabela_usuarios** — contas de acesso. Colunas: `id`, `usuario` (único), `senha`
  (hash), `is_admin` (0/1), `eletricista_id` (FK opcional → tabela_eletricistas).
- **tabela_usuario_permissao** — permissões por usuário. Colunas: `usuario_id`
  (FK → tabela_usuarios), `permissao` (chave do módulo).
- **tabela_eletricistas** — `id`, `cpf` (único), `nome`, `data_contratacao`,
  `data_demissao` (NULL = ativo).
- **tabela_produtos** — `id`, `nome_produto`, `vlr_unitario` DECIMAL(10,2),
  `qtd_estoque` (nunca negativo).
- **tabela_metas** — `id`, `eletricista_meta` (FK), `mes_meta`, `vlr_meta` DECIMAL(10,2).
- **tabela_ordens_servico** — `id`, `eletricista_os` (FK), `data_os`,
  `status` ('solicitada'|'aberta'|'fechada'), `data_fechamento` (NULL até o fechamento).
- **tabela_os_materiais** — `id`, `id_os` (FK), `id_produto` (FK), `qtd_utilizada`.
- **tabela_movimentacoes** — `id`, `id_produto` (FK), `tipo` ('entrada'|'saida'),
  `quantidade`, `valor_unitario`, `data_mov`, `origem`, `id_os` (FK opcional → OS).
- **tabela_os_comentarios** — `id`, `id_os` (FK), `comentario`, `foto`, `data_comentario`.
- **tabela_checklist** — `id`, `titulo`, `tipo` ('inicio'|'fim'), `selecionado` (0/1).
- **tabela_checklist_perguntas** — `id`, `id_checklist` (FK), `texto_pergunta`, `ordem`,
  `tipo_resposta` ('radio'|'text'), `bloqueia_abertura`.
- **tabela_os_checklist_respostas** — `id`, `id_os` (FK), `id_pergunta` (FK),
  `resposta`, `motivo_nao`.

Todas as tabelas usam chaves estrangeiras para garantir integridade referencial.
Operações que envolvem estoque (abertura de OS, baixas) usam transações para garantir
atomicidade — se algo falha, nada é gravado.

## 14. Tecnologias e arquitetura

- **Back-end:** PHP 8, sobre o framework **CodeIgniter 3** (padrão MVC:
  controllers, models, views), servido pelo Apache do MAMP.
- **Banco de dados:** MySQL, acessado via Query Builder do CodeIgniter (parametrizado,
  protegido contra SQL Injection).
- **Front-end:** HTML5, CSS3, JavaScript, **Bootstrap 5.3** e Font Awesome (via CDN).
  Tema escuro com destaque em amarelo (`#FBD814`).
- **Autenticação:** por sessão do CodeIgniter, com `password_hash` / `password_verify`.
- **Segurança:** rate limiting no login, controle de acesso por permissões resolvidas do
  banco a cada requisição, uploads validados por tipo e tamanho.
- **Paginação:** listagens paginadas (10 itens por página por padrão).
- **Integração de IA:** proxy via cURL para a API do Flowise (RAG).

## 15. Resumo das regras de negócio (imutáveis)

- Nenhum **eletricista** é apagado do banco (usa-se demissão/reativação).
- Nenhum **produto** é apagado; "excluir" zera o estoque.
- **Estoque** nunca fica negativo; débitos/baixas usam transações.
- **Ordens de serviço** são imutáveis após o registro (não editam nem excluem).
- Em **metas**, só o valor muda após o cadastro (eletricista e mês são fixos).
- **Eletricistas demitidos** não abrem novas OS nem acessam o sistema.
- A OS segue sempre a ordem **Solicitada → Aberta → Fechada**: só o admin solicita, e só
  o eletricista responsável (ou o admin) abre e fecha. Uma OS não pode ser reaberta.
- O **estoque só é baixado na abertura** da OS, nunca na solicitação.
- A abertura e o fechamento da OS são impedidos quando alguma resposta do checklist bate
  com o valor de bloqueio configurado na pergunta ("Bloqueia se").
- Gestão de **usuários e permissões** é exclusiva de administradores, e o sistema sempre
  mantém pelo menos um administrador.
