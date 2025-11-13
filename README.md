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
# unit tests (40 tests passing)
$ npm run test

# e2e tests (24 tests passing)
$ npm run test:e2e

# or run e2e tests via Docker
$ npm run test:e2e:docker

# unit tests with coverage
$ npm run test:cov

# watch mode
$ npm run test:watch
```

**Cobertura de Testes:**
- ✅ 40 testes unitários passando (14 test suites)
- ✅ 24 testes e2e passando (4 test suites)  
- ✅ 61.68% de cobertura de código
- ✅ Todos os endpoints e funcionalidades testados


## API Documentation

Quando a aplicação estiver rodando, acesse a documentação Swagger em:
- http://localhost:3000/api

## Endpoints Disponíveis

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login (retorna JWT token)
- `GET /auth/profile` - Obter perfil do usuário autenticado 🔒

### Usuários 🔒🛡️
- `GET /users` - Listar todos os usuários com saldos
- `GET /users/:id` - Obter detalhes do usuário com comissões recentes

### Saldos (Balances) 🔒
- `GET /balances` - Listar todos os saldos ordenados por valor 🛡️
- `GET /balances/me` - Obter saldo do usuário autenticado
- `GET /balances/user/:userId` - Obter saldo por ID do usuário

### Taxas (Taxes)
- `GET /taxes` - Listar todas as configurações de taxas (público)
- `GET /taxes/country/:country` - Obter taxa por código do país (público)
- `GET /taxes/:id` - Obter taxa por ID (público)
- `POST /taxes` - Criar configuração de taxa 🔒🛡️
- `PUT /taxes/:id` - Atualizar configuração de taxa 🔒🛡️
- `DELETE /taxes/:id` - Remover configuração de taxa 🔒🛡️

### Pagamentos 🔒
- `POST /payments` - Processar venda com simulação de cartão de crédito

**Campos obrigatórios para pagamento:**
```json
{
  "amount": 100.00,
  "country": "BR",
  "producerId": "uuid-do-produtor",
  "affiliateId": "uuid-do-afiliado (opcional)",
  "coproducerId": "uuid-do-coprodutor (opcional)",
  "cardNumber": "4111111111111111",
  "cardHolderName": "JOHN DOE",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cvv": "123",
  "installments": 1
}
```

**Cartões de teste aceitos:**
- Visa: `4111111111111111`
- Mastercard: `5555555555554444`
- Amex: `378282246310005`

**Validações implementadas:**
- ✅ Algoritmo de Luhn (validação do número do cartão)
- ✅ Data de expiração (cartão não pode estar vencido)
- ✅ CVV (3-4 dígitos)
- ✅ Parcelas (1-12)
- ✅ Detecção automática da bandeira do cartão

**Resposta do pagamento:**
```json
{
  "transactionId": "uuid-da-transacao",
  "grossAmount": 100.00,
  "taxAmount": 6.89,
  "netAmount": 93.11,
  "commissions": [
    { "type": "PRODUCER", "amount": 65.17 },
    { "type": "PLATFORM", "amount": 4.66 },
    { "type": "AFFILIATE", "amount": 9.31 },
    { "type": "COPRODUCER", "amount": 13.97 }
  ],
  "payment": {
    "approved": true,
    "authorizationCode": "ABC123",
    "cardBrand": "VISA",
    "last4Digits": "1111",
    "installments": 1
  }
}
```

**Legenda:**
- 🔒 = Requer autenticação (Bearer token)
- 🛡️ = Requer role PLATFORM (administrador)

### Usuários de Teste (senha: `password123`)
- `producer@test.com` - Produtor (role: PRODUCER)
- `affiliate@test.com` - Afiliado (role: AFFILIATE)
- `coproducer@test.com` - Coprodutor (role: COPRODUCER)
- `platform@test.com` - Plataforma (role: PLATFORM) - **Acesso administrativo**

## Notas Técnicas

### Simulação de Gateway de Pagamento
O sistema implementa um gateway de pagamento simulado que:
- **NÃO armazena** dados do cartão (número, CVV)
- Valida cartões usando o algoritmo de Luhn
- Detecta automaticamente a bandeira (Visa, Mastercard, Amex, Elo, Hipercard)
- Simula processamento com delay de 100ms
- Gera códigos de autorização mock
- Suporta múltiplas bandeiras de cartão brasileiro

**Segurança PCI/LGPD:**
- Dados sensíveis do cartão são validados mas **nunca persistidos**
- Apenas os últimos 4 dígitos são retornados na resposta
- Senhas de usuários são hasheadas com bcrypt (10 rounds)
- Valores monetários armazenados como Decimal no banco

### Regras de Negócio Implementadas
Consulte o arquivo `docs/business-rules.md` para documentação completa das regras de negócio, incluindo:
- Fluxo completo de processamento de vendas
- Cálculo de taxas por país
- Distribuição de comissões
- Validações e controles de acesso
- Exemplos práticos com valores reais

### Prisma Client
O projeto usa um output customizado para o Prisma Client em `generated/prisma/`. Após qualquer alteração no schema:

```bash
npx prisma generate
npx prisma db push
```

No Docker, isso é feito automaticamente no entrypoint.
