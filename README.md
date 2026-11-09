# EletroTech

Gestão de serviços externos de energia, com uma empresa por instalação.
Frontend React/Vite e API Express/MySQL. O visual original preto e amarelo foi
preservado. Administrador, supervisor e eletricista usam a mesma tela de login.

## Documentação atual

- [Regras e permissões confirmadas](docs/operacao-e-permissoes.md)
- [Instalação e atualização do banco](backend/README.md)
- [Endpoints da API](docs/definicao-de-endpoints.md)
- [Caminho das requisições](docs/camadas-de-rotas.md)
- [Guia do supervisor](ACESSO_SUPERVISOR.md)
- [Guia do eletricista](ACESSO_ELETRICISTA.md)
- [Validação e testes](TESTES_UNITARIOS.md)

`docs/estrutura-de-pastas.md` e `docs/guia-backend-para-ia.md` são propostas da
migração anterior. A implementação atual e seus contratos estão nos documentos
acima. O Word em `docs` é um modelo acadêmico ainda parcialmente preenchido.

## Executar

Requisitos: Node.js 22.12+ (validado com Node 24.16), npm e MySQL 8.

```sh
npm ci
npm ci --prefix backend
cp .env.example .env
cp backend/.env.example backend/.env
```

Preencha as credenciais do banco e `JWT_SECRET` em `backend/.env`. Uma instalação
utiliza seu próprio banco; não há cadastro de várias empresas na mesma base.

Para banco já existente, aplique a migração aditiva:

```sh
npm run db:migrate --prefix backend
```

Para banco vazio, crie primeiro o database no MySQL e execute:

```sh
npm run db:init --prefix backend
npm run db:migrate --prefix backend
npm run db:admin --prefix backend
```

O último comando solicita nome e senha para criar um administrador, sem senha
padrão. O schema inicial não contém dados pessoais nem registros de exemplo.

Em terminais separados:

```sh
npm run dev --prefix backend
```

```sh
npm run dev
```

API padrão: `http://localhost:3001/api/v1`. O frontend aceita `/api/v1` pelo
proxy do Vite ou `VITE_API_URL` apontando à API. Mantenha a mesma porta em todas
as configurações; `VITE_API_PROXY_TARGET` permite ajustar o destino do proxy. Em produção, publique a API e o frontend na mesma origem por
reverse proxy e use HTTPS.

## Operação inicial

1. Admin cadastra os eletricistas e suas senhas.
2. Em **Supervisores**, cria os logins e associa os eletricistas ativos.
3. Define um checklist padrão de início e outro de fim, com perguntas.
4. Supervisor atribui OS à sua equipe e estabelece metas mensais e anuais.
5. Eletricista executa suas OS, registra materiais, checklists e fotos.
6. Supervisor acompanha **Minha equipe** e decide pendências de bloqueio.

Eletricistas sem supervisor continuam acessando seus próprios dados. Um
supervisor sem equipe não recebe os dados globais.

## Verificar

```sh
npm test --prefix backend
npm run build
npm run lint
```

A suíte principal usa SQLite em memória. A verificação opt-in `test:mysql` também
foi executada em MySQL 8.0.44, incluindo abertura concorrente de OS. A instalação
com os dados reais requer aplicar a migração e homologar sua configuração.
