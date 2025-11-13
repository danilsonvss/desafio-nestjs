# Regras de Negócio - Sistema de Pagamentos

## 1. Processamento de Vendas

### 1.1 Fluxo de Pagamento
```
Valor Bruto → (-) Taxas → Valor Líquido → (-) Comissões → Saldos
```

### 1.2 Cálculo de Taxas
- **Taxa variável**: Percentual baseado no país (`taxConfig.rate`)
- **Taxa fixa**: Valor fixo por transação (`taxConfig.fixedFee`)
- **Fórmula**: `taxAmount = (amount × rate) + fixedFee`
- **Valor líquido**: `netAmount = amount - taxAmount`

### 1.3 Distribuição de Comissões (baseado no valor líquido)

**A plataforma recebe:**
- **Taxa total** (tax amount) que foi deduzida do valor bruto
- **Comissão de 5%** sobre o valor líquido

**Outros participantes recebem % do valor líquido:**

| Participante | Percentual | Condição |
|-------------|-----------|----------|
| Plataforma  | Taxa + 5% comissão | Sempre aplicado |
| Afiliado    | 10%       | Se `affiliateId` informado |
| Coprodutor  | 15%       | Se `coproducerId` informado |
| Produtor    | Restante  | Recebe o que sobra após comissões |

**Exemplo BR com todos os participantes (R$ 500):**
```
Valor bruto: R$ 500,00
Taxa (20% + R$ 2): R$ 102,00
Valor líquido: R$ 398,00

Distribuição:
- Plataforma: R$ 102,00 (taxa) + R$ 19,90 (5% comissão) = R$ 121,90
- Restante para distribuir: R$ 378,10
  - Afiliado: R$ 37,81 (10%)
  - Coprodutor: R$ 56,72 (15%)
  - Produtor: R$ 283,57 (restante)

Total distribuído: R$ 121,90 + R$ 37,81 + R$ 56,72 + R$ 283,57 = R$ 500,00 ✓
```

### 1.4 Atomicidade das Transações
- Todo processamento ocorre em **transação de banco de dados**
- Garante que:
  - Transaction é criada
  - Commissions são registradas
  - Balances são atualizados
  - Se qualquer operação falhar, tudo é revertido

## 2. Sistema de Taxas

### 2.1 Configuração por País
- Cada país pode ter sua própria configuração
- Campos obrigatórios:
  - `country`: Código ISO do país (ex: BR, US)
  - `rate`: Taxa percentual (Decimal)
  - `fixedFee`: Taxa fixa opcional (Decimal, padrão: 0)

### 2.2 Países Pré-configurados
- **BR (Brasil)**: 
  - Rate: 0.20 (20%)
  - Fixed Fee: 2.00 (R$ 2,00)
- **US (Estados Unidos)**:
  - Rate: 0.15 (15%)
  - Fixed Fee: 1.50 (US$ 1,50)

### 2.3 Regras de Validação
- País deve existir na configuração antes do processamento
- Taxa não pode ser negativa
- Apenas usuários PLATFORM podem criar/editar configurações

## 3. Sistema de Saldos

### 3.1 Atualização de Saldos
- Cada usuário tem um único registro de saldo (`Balance`)
- Saldo é incrementado automaticamente ao processar venda
- Operação é atômica junto com a criação da transação

### 3.2 Rastreabilidade
- Cada atualização de saldo tem uma `Commission` correspondente
- Permite auditoria completa do fluxo de dinheiro
- Histórico de comissões disponível por usuário

## 4. Controle de Acesso (RBAC)

### 4.1 Papéis de Usuário
- **PRODUCER**: Vendedor principal do produto
- **AFFILIATE**: Divulgador que recebe comissão
- **COPRODUCER**: Parceiro na produção
- **PLATFORM**: Administrador da plataforma

### 4.2 Permissões por Papel

| Endpoint | PRODUCER | AFFILIATE | COPRODUCER | PLATFORM |
|----------|----------|-----------|------------|----------|
| POST /auth/register | ✅ | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| GET /auth/profile | ✅ | ✅ | ✅ | ✅ |
| GET /users | ❌ | ❌ | ❌ | ✅ |
| GET /users/:id | ❌ | ❌ | ❌ | ✅ |
| GET /balances | ❌ | ❌ | ❌ | ✅ |
| GET /balances/me | ✅ | ✅ | ✅ | ✅ |
| GET /balances/user/:id | ✅ | ✅ | ✅ | ✅ |
| POST /payments | ✅ | ✅ | ✅ | ✅ |
| GET /taxes | ✅ | ✅ | ✅ | ✅ |
| POST /taxes | ❌ | ❌ | ❌ | ✅ |
| PUT /taxes/:id | ❌ | ❌ | ❌ | ✅ |
| DELETE /taxes/:id | ❌ | ❌ | ❌ | ✅ |

## 5. Segurança

### 5.1 Autenticação
- JWT com expiração de 7 dias
- Senhas hasheadas com bcrypt (10 rounds)
- Token obrigatório para endpoints protegidos

### 5.2 Validação de Dados
- Todos os DTOs validados com class-validator
- Valores monetários sempre Decimal no banco
- Conversão para Number apenas na apresentação

### 5.3 Dados Sensíveis
- **NÃO armazenamos**:
  - Números de cartão
  - CVV
  - Dados completos de pagamento
- **Armazenamos com segurança**:
  - Senhas (hash bcrypt)
  - Valores de transações (apenas totais)
  - Saldos de usuários

## 6. Validações de Negócio

### 6.1 Processamento de Venda
✅ País deve existir na configuração de taxas
✅ Produtor deve existir e ter saldo
✅ Afiliado (se informado) deve existir
✅ Coprodutor (se informado) deve existir
✅ Valor deve ser positivo
✅ Plataforma deve ter usuário cadastrado

### 6.2 Consistência de Dados
✅ Transação só é salva se todos os saldos forem atualizados
✅ Comissões + taxas sempre somam exatamente o valor bruto
✅ Cada comissão tem um tipo correspondente ao papel do usuário
✅ Plataforma recebe taxa + comissão (nunca apenas comissão)

## 7. Fluxo Completo de Venda

```mermaid
graph TD
    A[POST /payments] --> B{País configurado?}
    B -->|Não| C[Erro: Tax config not found]
    B -->|Sim| D[Calcular taxas]
    D --> E[Calcular comissões]
    E --> F{Usuários existem?}
    F -->|Não| G[Erro: User not found]
    F -->|Sim| H[Iniciar transação DB]
    H --> I[Criar Transaction]
    I --> J[Criar Commissions]
    J --> K[Atualizar Balances]
    K --> L{Tudo OK?}
    L -->|Não| M[Rollback]
    L -->|Sim| N[Commit]
    N --> O[Retornar resultado]
```

## 8. Exemplos Práticos

### Cenário 1: Venda de R$ 100,00 no Brasil (apenas produtor)

**Entrada:**
```json
{
  "amount": 100.00,
  "country": "BR",
  "producerId": "uuid-producer"
}
```

**Processamento:**

1. **Taxas (Brasil: 20% + R$ 2)**
   - Taxa variável: 100 × 0.20 = R$ 20.00
   - Taxa fixa: R$ 2.00
   - Total taxas: R$ 22.00
   - Valor líquido: 100 - 22 = **R$ 78.00**

2. **Comissões**
   - Plataforma: R$ 22.00 (taxa) + R$ 3.90 (5% de 78) = **R$ 25.90**
   - Produtor: 78.00 - 3.90 = **R$ 74.10**
   - Total: 25.90 + 74.10 = **R$ 100.00** ✓

3. **Atualização de Saldos**
   - ✅ Balance do Produtor: +R$ 74.10
   - ✅ Balance da Plataforma: +R$ 25.90

**Saída:**
```json
{
  "transactionId": "uuid-transaction",
  "grossAmount": 100.00,
  "taxAmount": 22.00,
  "netAmount": 78.00,
  "commissions": [
    { "type": "PRODUCER", "amount": 74.10 },
    { "type": "PLATFORM", "amount": 25.90 }
  ]
}
```

---

### Cenário 2: Venda de R$ 500,00 com todos os participantes

**Entrada:**
```json
{
  "amount": 500.00,
  "country": "BR",
  "producerId": "uuid-producer",
  "affiliateId": "uuid-affiliate",
  "coproducerId": "uuid-coproducer"
}
```

**Processamento:**

1. **Taxas (Brasil: 20% + R$ 2)**
   - Taxa variável: 500 × 0.20 = R$ 100.00
   - Taxa fixa: R$ 2.00
   - Total taxas: R$ 102.00
   - Valor líquido: 500 - 102 = **R$ 398.00**

2. **Comissões (sobre R$ 398.00)**
   - Plataforma: R$ 102.00 (taxa) + R$ 19.90 (5%) = **R$ 121.90**
   - Restante: 398.00 - 19.90 = R$ 378.10
   - Afiliado (10%): R$ 37.81
   - Coprodutor (15%): R$ 56.72
   - Produtor (restante): 378.10 - 37.81 - 56.72 = **R$ 283.57**
   - Total: 121.90 + 37.81 + 56.72 + 283.57 = **R$ 500.00** ✓

3. **Atualização de Saldos**
   - ✅ Balance do Produtor: +R$ 283.57
   - ✅ Balance do Afiliado: +R$ 37.81
   - ✅ Balance do Coprodutor: +R$ 56.72
   - ✅ Balance da Plataforma: +R$ 121.90

**Saída:**
```json
{
  "transactionId": "uuid-transaction",
  "grossAmount": 500.00,
  "taxAmount": 102.00,
  "netAmount": 398.00,
  "commissions": [
    { "type": "PRODUCER", "amount": 283.57 },
    { "type": "PLATFORM", "amount": 121.90 },
    { "type": "AFFILIATE", "amount": 37.81 },
    { "type": "COPRODUCER", "amount": 56.72 }
  ]
}
```
}
```

## 9. Melhorias Futuras Sugeridas

- [ ] Comissões configuráveis por produto/usuário
- [ ] Histórico de transações por período
- [ ] Relatórios de comissões agregados
- [ ] Sistema de retirada de saldo
- [ ] Webhooks para notificações
- [ ] Rate limiting por usuário
- [ ] Logs estruturados de auditoria
