# Desafio NestJS - Payment API

API REST para processamento de pagamentos com simulação de gateway de cartão, cálculo de taxas, comissões e gestão de saldos.

## 🚀 Quick Start (Docker)

```bash
# 1. Clonar e configurar ambiente
git clone <repo-url>
cd desafio-nestjs
cp .env.example .env

# 2. Subir containers (Postgres + App)
docker compose up -d

# 3. Popular banco com dados iniciais
npm run db:setup:docker

# 4. Acessar aplicação
# App: http://localhost:3000
# Swagger: http://localhost:3000/api
```

## 📋 Pré-requisitos

- **Docker & Docker Compose** (recomendado)
- Ou: Node.js 20+ e PostgreSQL 16+ (desenvolvimento local)

## 🐳 Setup com Docker (Recomendado)

### 1. Configuração Inicial

```bash
# Copiar arquivo de ambiente
cp .env.example .env

# Construir imagens
docker compose build

# Iniciar serviços
docker compose up -d
```

### 2. Configurar Banco de Dados

```bash
# Rodar migrations e seeds (IMPORTANTE: executar após primeiro start)
npm run db:setup:docker

# Ou executar separadamente:
# npm run prisma:seed:docker
```

**O que o seed cria:**
- Tax configs para BR (20% + R$2) e US (15% + $1.50)
- Usuários de teste: producer, affiliate, coproducer, platform (senha: `password123`)

### 3. Verificar Logs

```bash
docker compose logs -f app
```

### URLs Disponíveis
- **API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api
- **Database:** `postgres://postgres:postgres@localhost:5432/desafio`

### Comandos Úteis

```bash
# Parar containers
docker compose down

# Reiniciar app
docker compose restart app

# Rodar testes e2e
npm run test:e2e:docker

# Acessar shell do container
docker compose exec app sh

# Ver logs
docker compose logs -f app
```

## 💻 Setup Local (Sem Docker)

### 1. Configurar Banco de Dados

Certifique-se de ter PostgreSQL 16+ rodando localmente.

```bash
# Copiar .env e ajustar DATABASE_URL se necessário
cp .env.example .env
# Editar .env com sua connection string do Postgres
```

### 2. Instalar Dependências e Configurar Banco

```bash
# Instalar dependências
npm install

# Gerar Prisma Client + Migrations + Seeds
npm run db:setup
```

### 3. Iniciar Servidor

```bash
npm run start:dev
```

Aplicação rodará em: http://localhost:3000

## 🧪 Testes

```bash
# testes unitários (40 testes)
npm run test

# testes e2e (24 testes)  
npm run test:e2e

# rodar testes e2e via Docker (recomendado)
npm run test:e2e:docker

# cobertura de testes
npm run test:cov

# modo watch
npm run test:watch
```

**Cobertura de Testes:**
- ✅ 40 testes unitários (14 test suites)
- ✅ 24 testes e2e (4 test suites)
- ✅ Total: 64 testes passando
- ✅ 61.68% de cobertura de código

---

## 📚 API Documentation

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

**Resposta do pagamento (exemplo BR - R$ 100):**
```json
{
  "transactionId": "uuid-da-transacao",
  "grossAmount": 100.00,
  "taxAmount": 22.00,
  "netAmount": 78.00,
  "commissions": [
    { "type": "PRODUCER", "amount": 74.10 },
    { "type": "PLATFORM", "amount": 25.90 }
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

**Como funcionam os cálculos:**
- **Taxas (BR):** 20% + R$ 2 fixo = R$ 22,00
- **Líquido:** R$ 100 - R$ 22 = R$ 78,00
- **Plataforma:** R$ 22 (taxa) + R$ 3,90 (5% comissão) = **R$ 25,90**
- **Produtor:** R$ 78 - R$ 3,90 = **R$ 74,10**
- Total distribuído: R$ 100,00 ✓

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

**Distribuição de valores em uma venda:**
1. Valor bruto → Deduz taxas → Valor líquido
2. Do valor líquido, calcula comissões (5%, 10%, 15%)
3. Plataforma recebe: **taxa completa + comissão de 5%**
4. Produtor recebe o restante após todas as comissões

**Exemplo completo (R$ 500 com todos participantes):**
- Bruto: R$ 500
- Taxa BR (20% + R$ 2): R$ 102
- Líquido: R$ 398
- Plataforma: R$ 102 (taxa) + R$ 19,90 (5%) = R$ 121,90
- Afiliado (10%): R$ 37,81
- Coprodutor (15%): R$ 56,72
- Produtor: R$ 283,57
- **Total:** R$ 500 ✓

Consulte `docs/business-rules.md` para documentação completa com mais exemplos e validações.

### Prisma Client

O projeto usa Prisma Client padrão (`@prisma/client`). Após qualquer alteração no schema:

```bash
# Local
npx prisma generate
npx prisma db push

# Docker
docker compose exec app npx prisma generate
docker compose exec app npx prisma db push
```

No Docker, o Prisma Client é gerado automaticamente no entrypoint.
