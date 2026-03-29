import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

// Check if we're in a build/SSG environment (no database available)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.VERCEL_ENV === 'preview' ||
                     typeof window !== 'undefined'

if (isBuildTime) {
  // Return a dummy client during build
  prisma = {
    keyword: { findMany: async () => [], count: async () => 0, create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    product: { findMany: async () => [], count: async () => 0, create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
    scannedPost: { findMany: async () => [], count: async () => 0, create: async () => ({}), findUnique: async () => null },
    generatedReply: { findMany: async () => [], count: async () => 0, create: async () => ({}), update: async () => ({}) },
    scanLog: { findMany: async () => [], count: async () => 0, create: async () => ({}), update: async () => ({}) },
  } as any
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  prisma = globalForPrisma.prisma
}

export default prisma
