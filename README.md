## Instalação

```bash
$ npm install
```

## Database Setup

```bash
# Generate Prisma client, push schema, and seed initial data
$ npm run db:setup
```

This will:
- Generate Prisma Client
- Create database tables
- Seed tax configs for BR (20% + R$2) and US (15% + $1.50)
- Create test users (producer, affiliate, coproducer, platform)

## Rodar localmente Docker (Development)

```bash
# 1) Create your env file
cp .env.example .env

# 2) Build images
docker compose build

# 3) Start services (app + Postgres)
docker compose up -d

# 4) Follow logs
docker compose logs -f app
```

- App: http://localhost:3000
- Database: `postgres://postgres:postgres@localhost:5432/desafio`
- Hot reload is enabled via `npm run start:dev` inside the container.
- Database is automatically seeded on first start.

To stop everything:

```bash
docker compose down
```

## Local Development (without Docker)

```bash
# 1) Setup database URL in .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/desafio?schema=public"

# 2) Setup database
npm run db:setup

# 3) Start development server
npm run start:dev
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests (nota: requerem --experimental-vm-modules do Node.js)
# Recomenda-se executar testes e2e manualmente testando os endpoints HTTP
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

Quando a aplicação estiver rodando, acesse a documentação Swagger em:
- http://localhost:3000/api

## Endpoints Disponíveis

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login (retorna JWT token)
- `GET /auth/profile` - Obter perfil do usuário autenticado (requer Bearer token)

### Usuários 🔒
- `GET /users` - Listar todos os usuários com saldos
- `GET /users/:id` - Obter detalhes do usuário com comissões recentes

### Saldos (Balances) 🔒
- `GET /balances` - Listar todos os saldos ordenados por valor
- `GET /balances/me` - Obter saldo do usuário autenticado
- `GET /balances/user/:userId` - Obter saldo por ID do usuário

### Taxas (Taxes)
- `GET /taxes` - Listar todas as configurações de taxas (público)
- `GET /taxes/country/:country` - Obter taxa por código do país (público)
- `GET /taxes/:id` - Obter taxa por ID (público)
- `POST /taxes` - Criar configuração de taxa 🔒
- `PUT /taxes/:id` - Atualizar configuração de taxa 🔒
- `DELETE /taxes/:id` - Remover configuração de taxa 🔒

### Pagamentos
- `POST /payments` - Processar venda com cálculo de taxas e comissões

🔒 = Requer autenticação (Bearer token)

### Usuários de Teste (senha: `password123`)
- `producer@test.com` - Produtor
- `affiliate@test.com` - Afiliado
- `coproducer@test.com` - Coprodutor
- `platform@test.com` - Plataforma

## Notas Técnicas

### Prisma Client
O projeto usa um output customizado para o Prisma Client em `generated/prisma/`. Após qualquer alteração no schema:

```bash
npx prisma generate
npx prisma db push
```

No Docker, isso é feito automaticamente no entrypoint.
