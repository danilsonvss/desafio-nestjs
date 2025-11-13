async function getPrismaClient() {
  try {
    // @ts-ignore - dynamic import path may not exist until generated
    const mod = await import('../generated/prisma');
    return new mod.PrismaClient();
  } catch {
    const mod = await import('@prisma/client');
    return new mod.PrismaClient();
  }
}

async function main(prisma: any) {
  console.log('Seeding database...');

  // Seed tax configs for BR and US
  await prisma.taxConfig.upsert({
    where: { country: 'BR' },
    update: {},
    create: {
      country: 'BR',
      rate: 0.20, // 20% tax rate
      fixedFee: 2.0, // R$ 2.00 fixed fee
    },
  });

  await prisma.taxConfig.upsert({
    where: { country: 'US' },
    update: {},
    create: {
      country: 'US',
      rate: 0.15, // 15% tax rate
      fixedFee: 1.5, // $1.50 fixed fee
    },
  });

  console.log('Tax configs seeded: BR, US');

  // Seed test users (producer, affiliate, coproducer, platform)
  const producer = await prisma.user.upsert({
    where: { email: 'producer@test.com' },
    update: {},
    create: {
      email: 'producer@test.com',
      name: 'Test Producer',
      role: 'PRODUCER',
      balance: {
        create: { amount: 0 },
      },
    },
  });

  const affiliate = await prisma.user.upsert({
    where: { email: 'affiliate@test.com' },
    update: {},
    create: {
      email: 'affiliate@test.com',
      name: 'Test Affiliate',
      role: 'AFFILIATE',
      balance: {
        create: { amount: 0 },
      },
    },
  });

  const coproducer = await prisma.user.upsert({
    where: { email: 'coproducer@test.com' },
    update: {},
    create: {
      email: 'coproducer@test.com',
      name: 'Test Coproducer',
      role: 'COPRODUCER',
      balance: {
        create: { amount: 0 },
      },
    },
  });

  const platform = await prisma.user.upsert({
    where: { email: 'platform@test.com' },
    update: {},
    create: {
      email: 'platform@test.com',
      name: 'Platform',
      role: 'PLATFORM',
      balance: {
        create: { amount: 0 },
      },
    },
  });

  console.log('Test users seeded:', {
    producer: producer.email,
    affiliate: affiliate.email,
    coproducer: coproducer.email,
    platform: platform.email,
  });
}

async function run() {
  const prisma = await getPrismaClient();
  try {
    await main(prisma);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
