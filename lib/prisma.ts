import { PrismaClient } from './generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Skip database connection during Docker build
const shouldSkip = process.env.SKIP_DATABASE === 'true'
export const prisma = shouldSkip ? undefined : (globalForPrisma.prisma ?? new PrismaClient())

if (process.env.NODE_ENV !== 'production' && !shouldSkip) globalForPrisma.prisma = prisma
