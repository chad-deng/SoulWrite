import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL not configured')
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

// Lazy-load PrismaClient to avoid instantiation during Next.js build
// when DATABASE_URL may not be available
function createLazyPrisma(): PrismaClient {
  let client: PrismaClient | undefined

  return new Proxy({} as PrismaClient, {
    get(_, prop) {
      if (!client) {
        client = globalForPrisma.prisma || createPrismaClient()
        if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = client
        }
      }
      const value = (client as unknown as Record<string, unknown>)[prop as string]
      if (typeof value === 'function') {
        return value.bind(client)
      }
      return value
    },
  })
}

export const prisma = createLazyPrisma()
