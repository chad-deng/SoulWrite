import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { calculateNextRun } from '@/lib/scheduling'

export const scheduleRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        soulProfileId: z.string(),
        frequency: z.enum(['weekly', 'monthly', 'special_date']),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        specialDate: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.soulProfile.findFirst({
        where: {
          id: input.soulProfileId,
          userId: ctx.session.user.id,
        },
      })

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Soul profile not found',
        })
      }

      const nextRunAt = calculateNextRun({
        frequency: input.frequency,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        specialDate: input.specialDate ? new Date(input.specialDate) : undefined,
      })

      const schedule = await ctx.prisma.schedule.create({
        data: {
          soulProfileId: input.soulProfileId,
          frequency: input.frequency,
          dayOfWeek: input.dayOfWeek,
          dayOfMonth: input.dayOfMonth,
          specialDate: input.specialDate ? new Date(input.specialDate) : undefined,
          nextRunAt,
        },
      })

      return schedule
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const schedules = await ctx.prisma.schedule.findMany({
      where: {
        soulProfile: {
          userId: ctx.session.user.id,
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

    return schedules
  }),

  pause: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.id,
        },
        include: {
          soulProfile: true,
        },
      })

      if (!schedule || schedule.soulProfile.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        })
      }

      const updated = await ctx.prisma.schedule.update({
        where: {
          id: input.id,
        },
        data: {
          isActive: false,
        },
      })

      return updated
    }),

  resume: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.id,
        },
        include: {
          soulProfile: true,
        },
      })

      if (!schedule || schedule.soulProfile.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        })
      }

      const nextRunAt = calculateNextRun({
        frequency: schedule.frequency as 'weekly' | 'monthly' | 'special_date',
        dayOfWeek: schedule.dayOfWeek ?? undefined,
        dayOfMonth: schedule.dayOfMonth ?? undefined,
        specialDate: schedule.specialDate ?? undefined,
      })

      const updated = await ctx.prisma.schedule.update({
        where: {
          id: input.id,
        },
        data: {
          isActive: true,
          nextRunAt,
        },
      })

      return updated
    }),
})
