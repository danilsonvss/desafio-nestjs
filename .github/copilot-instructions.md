# Copilot Agent Instructions

These notes make AI coding agents productive in this NestJS + Prisma API. Keep answers specific to this repo and follow the examples and workflows below.

## Big Picture
- Purpose: REST API for a single product flow (see `docs/overview.md`, PT-BR) handling sales, taxes, commissions, payouts, and balances.
- Architecture: Standard NestJS modular layout. `AppModule` wires feature modules: `auth`, `users`, `taxes`, `affiliates`, `payments`, `balances`.
- Data layer: PostgreSQL via Prisma. Prisma schema in `prisma/schema.prisma`; Prisma Client output is customized to `generated/prisma`.
- Runtime: Node 20, ESM/NodeNext TS config, Docker dev stack with Postgres.

## Code Organization
- Entry: `src/main.ts` starts Nest and reads `process.env.PORT` (defaults to 3000).
- Modules:
  - `auth`, `users`: auth/user features (currently stubs).
  - `taxes`: place tax rules per-country and config-driven rates.
  - `affiliates`: affiliate/co-producer relationships and commissions.
  - `payments`: orchestrates sale → fees → commissions → balance updates.
  - `balances`: user balances, updated on each transaction.
- Tests: Unit in `src/**/*.spec.ts` (Jest), E2E in `test/**/*.e2e-spec.ts`.

## Persistence (Prisma)
- Schema: `prisma/schema.prisma` with datasource `DATABASE_URL`.
- Client output: `generator client { output = "../generated/prisma" }`.
  - Access via `PrismaService.db` (lazy loads client, prefers `generated/prisma`, falls back to `@prisma/client`).
  - Example: `const users = await this.prisma.db.user.findMany()` inside a service.
- Current models: `User`, `Balance`, `Transaction`, `Commission`, `TaxConfig` (see schema for fields and relations).

## Dev Workflows
- Local (Node):
  - Install: `npm install`
  - Dev: `npm run start:dev`
  - Build/Prod: `npm run build` / `npm run start:prod`
  - Tests: `npm run test` | `npm run test:e2e` | `npm run test:cov`
- Docker (recommended for DB):
  - `cp .env.example .env`
  - `docker compose up -d` (brings up Postgres and app with hot reload)
  - Prisma runs `generate`/`db push` on container start. For schema edits: `npx prisma generate && npx prisma db push` inside the app container.

## Conventions
- ESM TS config: `module: nodenext`; keep import paths compatible with NodeNext.
- ESLint + Prettier: see `eslint.config.mjs`. Prefer fixing reported issues rather than disabling rules.
- Controllers expose REST endpoints via decorators; Services hold business logic; Modules declare providers/controllers.
- Keep cross-module boundaries explicit: e.g., `PaymentsService` calls into `TaxesService` and updates `BalancesService`.

## Patterns and Examples
- Add a route to a module controller:
  - File: `src/payments/payments.controller.ts`
  - Example: `@Post()` handler that validates payload → calls `PaymentsService.processSale(dto)`.
- Use Prisma Client in a service:
  - Inject `PrismaService` and call `this.prisma.db` for queries. Wrap related operations in `this.prisma.db.$transaction([...])`.
- Balance updates:
  - Encapsulate atomic updates in a Prisma transaction to keep `Transaction` and `Balance` consistent.

## Integration Points
- Database URL: `DATABASE_URL` (.env). In Docker, points to service `db`.
- Ports: App on `3000` (mapped in `docker-compose.yml`).

## When In Doubt
- Align with the intent in `docs/overview.md` but only implement what’s needed by the current change.
- Prefer small, vertical slices: route → service → prisma → test.
- Update README if you change run/test flows.
