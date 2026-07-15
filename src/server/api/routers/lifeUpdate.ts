import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const lifeUpdateRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        soulProfileId: z.string(),
        content: z.string().min(1).max(5000),
        imageUrl: z.string().url().optional(),
        videoUrl: z.string().url().optional(),
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
          message: 'Soul profile not found or access denied',
        })
      }

      const update = await ctx.prisma.lifeUpdate.create({
        data: {
          soulProfileId: input.soulProfileId,
          content: input.content,
          imageUrl: input.imageUrl,
          videoUrl: input.videoUrl,
        },
      })

      return update
    }),

  list: protectedProcedure
    .input(z.object({ soulProfileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.prisma.soulProfile.findFirst({
        where: {
          id: input.soulProfileId,
          userId: ctx.session.user.id,
        },
      })

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Soul profile not found or access denied',
        })
      }

      const updates = await ctx.prisma.lifeUpdate.findMany({
        where: {
          soulProfileId: input.soulProfileId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      })

      return updates
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const update = await ctx.prisma.lifeUpdate.findFirst({
        where: { id: input.id },
        include: { soulProfile: true },
      })

      if (!update) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Life update not found',
        })
      }

      if (update.soulProfile.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      await ctx.prisma.lifeUpdate.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
