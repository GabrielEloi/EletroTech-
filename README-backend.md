# Backend EletroTech (Sprint 1)

## Como rodar

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Usuário padrão para teste

```text
nome: admin
senha: admin123
```

## Endpoint de login

```http
POST http://localhost:3001/auth/entrar
Content-Type: application/json

{
  "nome": "admin",
  "senha": "admin123"
}
```

Resposta esperada:

```json
{
  "id": 1,
  "nome": "admin",
  "cpf": "00000000000",
  "is_admin": true,
  "permissoes": ["menu", "ordemServico", "checklist", "produtos", "baixas", "metas", "eletricistas"],
  "destino": "/home",
  "rotuloDestino": "Dashboard"
}
```

## Observações

- Este backend usa SQLite/H2-style em desenvolvimento com `better-sqlite3` para facilitar a Sprint 1.
- A estrutura está pronta para evoluir para PostgreSQL mais tarde, mantendo separação por módulos e configuração centralizada.
