import { vi } from 'vitest'

vi.mock('@/server/db', () => ({
  prisma: {},
}))

import { describe, test, expect, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'

vi.mock('@/server/ai/letterGenerator', () => ({
  generateLetter: vi.fn(),
}))

vi.mock('@/server/auth', () => ({
  authOptions: {},
}))

import { generateLetter } from '@/server/ai/letterGenerator'
import { letterRouter } from '@/server/api/routers/letter'

const mockedGenerateLetter = vi.mocked(generateLetter)

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    soulProfile: {
      findFirst: vi.fn(),
      ...((overrides.soulProfile as Record<string, unknown>) || {}),
    },
    letter: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      ...((overrides.letter as Record<string, unknown>) || {}),
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
    prisma: createMockPrisma(prismaOverrides) as unknown as ReturnType<typeof createMockPrisma>,
  }
}

describe('letterRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateSample', () => {
    test('creates a draft letter', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-123',
        name: '父亲',
        relationship: '父子',
        personalityJson: '{"tone": "warm"}',
        memoriesJson: '[]',
        toneStyle: '温暖',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockLetterOutput = {
        content: 'test letter content',
        tone: 'comforting',
        realityAnchor: 'test anchor',
      }

      const mockCreatedLetter = {
        id: 'letter-1',
        userId: 'user-123',
        soulProfileId: 'profile-1',
        type: 'soul_letter',
        content: 'test letter content',
        tone: 'comforting',
        realityAnchor: 'test anchor',
        status: 'draft',
        scheduledFor: null,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const prisma = createMockPrisma()
      prisma.soulProfile.findFirst.mockResolvedValue(mockProfile)
      prisma.letter.create.mockResolvedValue(mockCreatedLetter)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      mockedGenerateLetter.mockResolvedValue(mockLetterOutput)

      const caller = letterRouter.createCaller(ctx)
      const result = await caller.generateSample({
        soulProfileId: 'profile-1',
        tone: 'comforting',
      })

      expect(prisma.soulProfile.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'profile-1',
          userId: 'user-123',
        },
      })

      expect(mockedGenerateLetter).toHaveBeenCalledWith({
        deceasedName: '父亲',
        relationship: '父子',
        personalityJson: '{"tone": "warm"}',
        tone: 'comforting',
      })

      expect(prisma.letter.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          soulProfileId: 'profile-1',
          type: 'soul_letter',
          content: 'test letter content',
          tone: 'comforting',
          realityAnchor: 'test anchor',
          status: 'draft',
        },
      })

      expect(result).toEqual(mockCreatedLetter)
    })

    test('throws NOT_FOUND when soulProfile not found', async () => {
      const prisma = createMockPrisma()
      prisma.soulProfile.findFirst.mockResolvedValue(null)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = letterRouter.createCaller(ctx)

      await expect(
        caller.generateSample({
          soulProfileId: 'nonexistent',
          tone: 'comforting',
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('list', () => {
    test('returns letters for user', async () => {
      const mockLetters = [
        {
          id: 'letter-1',
          userId: 'user-123',
          soulProfileId: 'profile-1',
          type: 'soul_letter',
          content: 'letter 1',
          tone: 'comforting',
          realityAnchor: 'anchor 1',
          status: 'draft',
          scheduledFor: null,
          deliveredAt: null,
          createdAt: new Date('2026-06-10T00:00:00Z'),
          updatedAt: new Date('2026-06-10T00:00:00Z'),
          soulProfile: {
            name: '父亲',
            relationship: '父子',
          },
        },
        {
          id: 'letter-2',
          userId: 'user-123',
          soulProfileId: 'profile-2',
          type: 'soul_letter',
          content: 'letter 2',
          tone: 'warm',
          realityAnchor: 'anchor 2',
          status: 'approved',
          scheduledFor: null,
          deliveredAt: null,
          createdAt: new Date('2026-06-09T00:00:00Z'),
          updatedAt: new Date('2026-06-09T00:00:00Z'),
          soulProfile: {
            name: '母亲',
            relationship: '母子',
          },
        },
      ]

      const prisma = createMockPrisma()
      prisma.letter.findMany.mockResolvedValue(mockLetters)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = letterRouter.createCaller(ctx)
      const result = await caller.list()

      expect(prisma.letter.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
        },
        include: {
          soulProfile: {
            select: {
              name: true,
              relationship: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      expect(result).toEqual(mockLetters)
    })
  })

  describe('getById', () => {
    test('returns letter by id for user', async () => {
      const mockLetter = {
        id: 'letter-1',
        userId: 'user-123',
        soulProfileId: 'profile-1',
        type: 'soul_letter',
        content: 'letter content',
        tone: 'comforting',
        realityAnchor: 'anchor',
        status: 'draft',
        scheduledFor: null,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        soulProfile: {
          name: '父亲',
          relationship: '父子',
        },
      }

      const prisma = createMockPrisma()
      prisma.letter.findFirst.mockResolvedValue(mockLetter)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = letterRouter.createCaller(ctx)
      const result = await caller.getById({ id: 'letter-1' })

      expect(prisma.letter.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'letter-1',
          userId: 'user-123',
        },
        include: {
          soulProfile: true,
        },
      })

      expect(result).toEqual(mockLetter)
    })

    test('throws NOT_FOUND when letter not found', async () => {
      const prisma = createMockPrisma()
      prisma.letter.findFirst.mockResolvedValue(null)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = letterRouter.createCaller(ctx)

      await expect(caller.getById({ id: 'nonexistent' })).rejects.toThrow(TRPCError)
    })
  })

  describe('updateStatus', () => {
    test('updates letter status for user', async () => {
      const mockLetter = {
        id: 'letter-1',
        userId: 'user-123',
        soulProfileId: 'profile-1',
        type: 'soul_letter',
        content: 'letter content',
        tone: 'comforting',
        realityAnchor: 'anchor',
        status: 'draft',
        scheduledFor: null,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUpdatedLetter = {
        ...mockLetter,
        status: 'approved',
      }

      const prisma = createMockPrisma()
      prisma.letter.findFirst.mockResolvedValue(mockLetter)
      prisma.letter.update.mockResolvedValue(mockUpdatedLetter)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = letterRouter.createCaller(ctx)
      const result = await caller.updateStatus({
        id: 'letter-1',
        status: 'approved',
      })

      expect(prisma.letter.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'letter-1',
          userId: 'user-123',
        },
      })

      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: {
          id: 'letter-1',
        },
        data: {
          status: 'approved',
        },
      })

      expect(result).toEqual(mockUpdatedLetter)
    })

    test('throws NOT_FOUND when letter not found', async () => {
      const prisma = createMockPrisma()
      prisma.letter.findFirst.mockResolvedValue(null)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = letterRouter.createCaller(ctx)

      await expect(
        caller.updateStatus({
          id: 'nonexistent',
          status: 'approved',
        })
      ).rejects.toThrow(TRPCError)
    })
  })
})
