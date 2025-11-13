#!/bin/bash

echo "=== Teste de Pagamento com Cartão de Crédito ==="
echo ""

# Login
echo "1. Fazendo login como produtor..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "producer@test.com", "password": "password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erro ao fazer login"
  exit 1
fi

echo "✅ Login realizado com sucesso"
echo ""

# Get user IDs
echo "2. Buscando IDs dos usuários..."
USERS=$(curl -s http://localhost:3000/users -H "Authorization: Bearer $TOKEN")
echo "✅ Usuários obtidos"
echo ""

# Processar pagamento
echo "3. Processando pagamento com cartão Visa..."
PAYMENT=$(curl -s -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 100,
    "country": "BR",
    "producerId": "0388d4c5-bfcb-4c95-9e3f-7e6ce35e1a28",
    "cardNumber": "4111111111111111",
    "cardHolderName": "JOHN DOE",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "installments": 1
  }')

echo "$PAYMENT" | python3 -m json.tool

echo ""
echo "=== Teste Completo ==="
