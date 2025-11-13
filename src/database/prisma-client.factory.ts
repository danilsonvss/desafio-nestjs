/**
 * Factory function to create Prisma Client instance
 * Handles dynamic import to avoid Jest parsing issues
 */
export async function createPrismaClient() {
  const { PrismaClient } = await import('../../generated/prisma/client.js');
  return new PrismaClient();
}
