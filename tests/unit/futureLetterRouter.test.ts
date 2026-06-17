import { vi } from 'vitest'

vi.mock('@/server/db', () => ({
  prisma: {},
}))

vi.mock('@/server/auth', () => ({
  authOptions: {},
}))

import { describe, test, expect, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'
import { PrismaClient } from '@prisma/client'

import { futureLetterRouter } from '@/server/api/routers/futureLetter'

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    futureLetter: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      ...((overrides.futureLetter as Record<string, unknown>) || {}),
    },
  }
}

function createMockContext(prismaOverrides: Record<string, unknown> = {}) {
  return {
    session: {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: '2099-01-01T00:00:00.000Z',
    },
    prisma: createMockPrisma(prismaOverrides) as unknown as PrismaClient,
  }
}

describe('futureLetterRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    test('creates future letter with future date', async () => {
      const deliverAt = new Date('2099-01-01T00:00:00Z')
      const mockLetter = {
        id: 'letter-1',
        userId: 'user-123',
        content: 'Hello future me',
        deliverAt,
        isDelivered: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const prisma = createMockPrisma()
      prisma.futureLetter.create.mockResolvedValue(mockLetter)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = futureLetterRouter.createCaller(ctx)
      const result = await caller.create({
        content: 'Hello future me',
        deliverAt: deliverAt.toISOString(),
      })

      expect(prisma.futureLetter.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          content: 'Hello future me',
          deliverAt,
        },
      })

      expect(result).toEqual(mockLetter)
    })

    test('throws BAD_REQUEST for past date', async () => {
      const prisma = createMockPrisma()

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = futureLetterRouter.createCaller(ctx)

      await expect(
        caller.create({
          content: 'Hello future me',
          deliverAt: '2020-01-01T00:00:00Z',
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    })
  })

  describe('list', () => {
    test('returns letters for user', async () => {
      const mockLetters = [
        {
          id: 'letter-1',
          userId: 'user-123',
          content: 'Letter 1',
          deliverAt: new Date('2099-01-01T00:00:00Z'),
          isDelivered: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'letter-2',
          userId: 'user-123',
          content: 'Letter 2',
          deliverAt: new Date('2099-06-01T00:00:00Z'),
          isDelivered: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const prisma = createMockPrisma()
      prisma.futureLetter.findMany.mockResolvedValue(mockLetters)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = futureLetterRouter.createCaller(ctx)
      const result = await caller.list()

      expect(prisma.futureLetter.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
        },
        orderBy: {
          deliverAt: 'asc',
        },
      })

      expect(result).toEqual(mockLetters)
    })
  })

  describe('getDeliverable', () => {
    test('returns only undelivered letters due now or earlier', async () => {
      const mockLetters = [
        {
          id: 'letter-1',
          userId: 'user-123',
          content: 'Due now',
          deliverAt: new Date('2020-01-01T00:00:00Z'),
          isDelivered: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const prisma = createMockPrisma()
      prisma.futureLetter.findMany.mockResolvedValue(mockLetters)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = futureLetterRouter.createCaller(ctx)
      const result = await caller.getDeliverable()

      expect(prisma.futureLetter.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isDelivered: false,
          deliverAt: {
            lte: expect.any(Date),
          },
        },
        orderBy: {
          deliverAt: 'asc',
        },
      })

      expect(result).toEqual(mockLetters)
    })
  })

  describe('markDelivered', () => {
    test('marks letter as delivered for user', async () => {
      const mockLetter = {
        id: 'letter-1',
        userId: 'user-123',
        content: 'Hello future me',
        deliverAt: new Date('2099-01-01T00:00:00Z'),
        isDelivered: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const updatedLetter = { ...mockLetter, isDelivered: true }

      const prisma = createMockPrisma()
      prisma.futureLetter.findFirst.mockResolvedValue(mockLetter)
      prisma.futureLetter.update.mockResolvedValue(updatedLetter)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = futureLetterRouter.createCaller(ctx)
      const result = await caller.markDelivered({ id: 'letter-1' })

      expect(prisma.futureLetter.findFirst).toHaveBeenCalledWith({
        where: { id: 'letter-1', userId: 'user-123' },
      })
      expect(prisma.futureLetter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { isDelivered: true },
      })
      expect(result).toEqual(updatedLetter)
    })

    test('throws NOT_FOUND when letter does not exist', async () => {
      const prisma = createMockPrisma()
      prisma.futureLetter.findFirst.mockResolvedValue(null)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = futureLetterRouter.createCaller(ctx)

      await expect(
        caller.markDelivered({ id: 'missing-letter' })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('delete', () => {
    test('deletes letter for user', async () => {
      const mockLetter = {
        id: 'letter-1',
        userId: 'user-123',
        content: 'Hello future me',
        deliverAt: new Date('2099-01-01T00:00:00Z'),
        isDelivered: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const prisma = createMockPrisma()
      prisma.futureLetter.findFirst.mockResolvedValue(mockLetter)
      prisma.futureLetter.delete.mockResolvedValue(mockLetter)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = futureLetterRouter.createCaller(ctx)
      const result = await caller.delete({ id: 'letter-1' })

      expect(prisma.futureLetter.findFirst).toHaveBeenCalledWith({
        where: { id: 'letter-1', userId: 'user-123' },
      })
      expect(prisma.futureLetter.delete).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
      })
      expect(result).toEqual(mockLetter)
    })

    test('throws NOT_FOUND when letter does not exist', async () => {
      const prisma = createMockPrisma()
      prisma.futureLetter.findFirst.mockResolvedValue(null)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = futureLetterRouter.createCaller(ctx)

      await expect(
        caller.delete({ id: 'missing-letter' })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })
})
