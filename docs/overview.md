# Objetivo Geral

Desenvolver uma API RESTful que:

- Simule a existência de um único produto com um produtor, um coprodutor e afiliado já definidos, apenas para fins de teste do fluxo.
- Receba dados de vendas nacionais e internacionais;
- Calcule taxas e comissões conforme regras de negócio;
- Registre repasses para produtores, afiliados, coprodutores e plataforma;
- Atualize saldos individuais conforme cada transação.

## Funcionalidades

1. Cadastro e autenticação de usuário
    - Criação;
    - Perfis distintos: produtor(padrão), afiliado, coprodutor e plataforma.
2. Sistema de taxas
    - Taxas configuráveis via banco de dados;
3. Afiliação e coprodução
    - Configuração de percentuais de comissão entre:
    - Produtor;
    - Afiliado;
    - Coprodutor;
    - Plataforma (também pode reter comissão).
4. Sistema de balances
    - Tabela de saldo por usuário;
    - Toda transação atualiza os saldos conforme os repasses.
5. Pagamento de venda
- Rota POST /payment;
- Recebe valor, país, participantes;
- Simula aprovação imediata (não integrar adquirentes reais);
- Calcula taxas por país;
- Aplica comissões para cada participante;
- Atualiza transações e saldos.
6. Boas práticas de segurança (LGPD + PCI)
- Armazenamento seguro de dados sensíveis (hash/criptografia);
- Não persistir dados de cartão ou pessoais sem tratamento adequado;
- Controle de acesso conforme papel do usuário.

## Tecnologias Esperadas

- Node.js com TypeScript;
- NestJS;
- PostgreSQL;
- Prisma;
- Docker;
- Clean Code, SOLID, DRY, Testes unitários e de integração;
- Documentação Open API 3 com UI.

## Entrega

- Instruções para rodar o backend;
- Scripts de inicialização e migração de banco;
- Explicação das regras de negócio implementadas.

## Critérios de Avaliação

- Organização e clareza do código;
- Arquitetura e boas práticas;
- Segurança no armazenamento de dados;
- Correção nas regras de taxas e comissões;
- Uso eficiente do banco de dados;
- Clareza da documentação.