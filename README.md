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

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
