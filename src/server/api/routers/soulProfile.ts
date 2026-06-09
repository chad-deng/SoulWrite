import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const soulProfileRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        relationship: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.soulProfile.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          relationship: input.relationship,
          personalityJson: '{}',
          memoriesJson: '{}',
          toneStyle: '',
        },
      })

      return profile
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.prisma.soulProfile.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          uploads: true,
          schedules: true,
        },
      })

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Soul profile not found',
        })
      }

      return profile
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await ctx.prisma.soulProfile.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return profiles
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        relationship: z.string().min(1).max(50).optional(),
        personalityJson: z.string().optional(),
        memoriesJson: z.string().optional(),
        toneStyle: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const result = await ctx.prisma.soulProfile.updateMany({
        where: {
          id,
          userId: ctx.session.user.id,
        },
        data,
      })

      if (result.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Soul profile not found or access denied',
        })
      }

      const updatedProfile = await ctx.prisma.soulProfile.findUnique({
        where: { id },
      })

      return updatedProfile
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.soulProfile.deleteMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      })

      if (result.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Soul profile not found or access denied',
        })
      }

      return { success: true }
    }),
})
