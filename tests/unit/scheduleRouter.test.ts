import { vi } from 'vitest'

vi.mock('@/server/db', () => ({
  prisma: {},
}))

vi.mock('@/server/auth', () => ({
  authOptions: {},
}))

import { describe, test, expect, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'

vi.mock('@/lib/scheduling', () => ({
  calculateNextRun: vi.fn(),
}))

import { calculateNextRun } from '@/lib/scheduling'
import { scheduleRouter } from '@/server/api/routers/schedule'

const mockedCalculateNextRun = vi.mocked(calculateNextRun)

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    soulProfile: {
      findFirst: vi.fn(),
      ...((overrides.soulProfile as Record<string, unknown>) || {}),
    },
    schedule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      ...((overrides.schedule as Record<string, unknown>) || {}),
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

describe('scheduleRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    test('creates schedule with correct nextRunAt', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-123',
        name: '父亲',
        relationship: '父子',
        personalityJson: '{}',
        memoriesJson: '[]',
        toneStyle: '温暖',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const nextRunDate = new Date('2026-06-15T09:00:00Z')
      const mockSchedule = {
        id: 'schedule-1',
        soulProfileId: 'profile-1',
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: null,
        specialDate: null,
        nextRunAt: nextRunDate,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const prisma = createMockPrisma()
      prisma.soulProfile.findFirst.mockResolvedValue(mockProfile)
      prisma.schedule.create.mockResolvedValue(mockSchedule)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      mockedCalculateNextRun.mockReturnValue(nextRunDate)

      const caller = scheduleRouter.createCaller(ctx)
      const result = await caller.create({
        soulProfileId: 'profile-1',
        frequency: 'weekly',
        dayOfWeek: 1,
      })

      expect(prisma.soulProfile.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'profile-1',
          userId: 'user-123',
        },
      })

      expect(mockedCalculateNextRun).toHaveBeenCalledWith({
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: undefined,
        specialDate: undefined,
      })

      expect(prisma.schedule.create).toHaveBeenCalledWith({
        data: {
          soulProfileId: 'profile-1',
          frequency: 'weekly',
          dayOfWeek: 1,
          dayOfMonth: undefined,
          specialDate: undefined,
          nextRunAt: nextRunDate,
        },
      })

      expect(result).toEqual(mockSchedule)
    })

    test('throws NOT_FOUND for invalid profile', async () => {
      const prisma = createMockPrisma()
      prisma.soulProfile.findFirst.mockResolvedValue(null)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = scheduleRouter.createCaller(ctx)

      await expect(
        caller.create({
          soulProfileId: 'nonexistent',
          frequency: 'weekly',
          dayOfWeek: 1,
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('list', () => {
    test('returns schedules for user\'s profiles', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          soulProfileId: 'profile-1',
          frequency: 'weekly',
          dayOfWeek: 1,
          dayOfMonth: null,
          specialDate: null,
          nextRunAt: new Date('2026-06-15T09:00:00Z'),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          soulProfile: {
            name: '父亲',
          },
        },
        {
          id: 'schedule-2',
          soulProfileId: 'profile-2',
          frequency: 'monthly',
          dayOfWeek: null,
          dayOfMonth: 15,
          specialDate: null,
          nextRunAt: new Date('2026-06-20T09:00:00Z'),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          soulProfile: {
            name: '母亲',
          },
        },
      ]

      const prisma = createMockPrisma()
      prisma.schedule.findMany.mockResolvedValue(mockSchedules)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = scheduleRouter.createCaller(ctx)
      const result = await caller.list()

      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
        where: {
          soulProfile: {
            userId: 'user-123',
          },
        },
        include: {
          soulProfile: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          nextRunAt: 'asc',
        },
      })

      expect(result).toEqual(mockSchedules)
    })
  })

  describe('pause', () => {
    test('deactivates schedule', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        soulProfileId: 'profile-1',
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: null,
        specialDate: null,
        nextRunAt: new Date('2026-06-15T09:00:00Z'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        soulProfile: {
          id: 'profile-1',
          userId: 'user-123',
          name: '父亲',
          relationship: '父子',
          personalityJson: '{}',
          memoriesJson: '[]',
          toneStyle: '温暖',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockUpdated = {
        ...mockSchedule,
        isActive: false,
        soulProfile: undefined,
      }

      const prisma = createMockPrisma()
      prisma.schedule.findUnique.mockResolvedValue(mockSchedule)
      prisma.schedule.update.mockResolvedValue(mockUpdated)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = scheduleRouter.createCaller(ctx)
      const result = await caller.pause({ id: 'schedule-1' })

      expect(prisma.schedule.update).toHaveBeenCalledWith({
        where: {
          id: 'schedule-1',
        },
        data: {
          isActive: false,
        },
      })

      expect(result.isActive).toBe(false)
    })

    test('throws NOT_FOUND for unauthorized', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        soulProfileId: 'profile-1',
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: null,
        specialDate: null,
        nextRunAt: new Date('2026-06-15T09:00:00Z'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        soulProfile: {
          id: 'profile-1',
          userId: 'other-user',
          name: '父亲',
          relationship: '父子',
          personalityJson: '{}',
          memoriesJson: '[]',
          toneStyle: '温暖',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const prisma = createMockPrisma()
      prisma.schedule.findFirst.mockResolvedValue(mockSchedule)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = scheduleRouter.createCaller(ctx)

      await expect(caller.pause({ id: 'schedule-1' })).rejects.toThrow(TRPCError)
    })
  })

  describe('resume', () => {
    test('reactivates schedule with recalculated nextRunAt', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        soulProfileId: 'profile-1',
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: null,
        specialDate: null,
        nextRunAt: new Date('2026-06-15T09:00:00Z'),
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        soulProfile: {
          id: 'profile-1',
          userId: 'user-123',
          name: '父亲',
          relationship: '父子',
          personalityJson: '{}',
          memoriesJson: '[]',
          toneStyle: '温暖',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const newNextRunAt = new Date('2026-06-22T09:00:00Z')
      const mockUpdated = {
        ...mockSchedule,
        isActive: true,
        nextRunAt: newNextRunAt,
        soulProfile: undefined,
      }

      const prisma = createMockPrisma()
      prisma.schedule.findUnique.mockResolvedValue(mockSchedule)
      prisma.schedule.update.mockResolvedValue(mockUpdated)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      mockedCalculateNextRun.mockReturnValue(newNextRunAt)

      const caller = scheduleRouter.createCaller(ctx)
      const result = await caller.resume({ id: 'schedule-1' })

      expect(mockedCalculateNextRun).toHaveBeenCalledWith({
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: undefined,
        specialDate: undefined,
      })

      expect(prisma.schedule.update).toHaveBeenCalledWith({
        where: {
          id: 'schedule-1',
        },
        data: {
          isActive: true,
          nextRunAt: newNextRunAt,
        },
      })

      expect(result.isActive).toBe(true)
      expect(result.nextRunAt).toEqual(newNextRunAt)
    })

    test('throws NOT_FOUND for unauthorized', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        soulProfileId: 'profile-1',
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: null,
        specialDate: null,
        nextRunAt: new Date('2026-06-15T09:00:00Z'),
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        soulProfile: {
          id: 'profile-1',
          userId: 'other-user',
          name: '父亲',
          relationship: '父子',
          personalityJson: '{}',
          memoriesJson: '[]',
          toneStyle: '温暖',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const prisma = createMockPrisma()
      prisma.schedule.findFirst.mockResolvedValue(mockSchedule)

      const ctx = createMockContext()
      ctx.prisma = prisma as unknown as typeof ctx.prisma

      const caller = scheduleRouter.createCaller(ctx)

      await expect(caller.resume({ id: 'schedule-1' })).rejects.toThrow(TRPCError)
    })
  })
})
