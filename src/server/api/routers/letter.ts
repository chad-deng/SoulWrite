import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { generateLetter } from '@/server/ai/letterGenerator'

export const letterRouter = createTRPCRouter({
  generateSample: protectedProcedure
    .input(
      z.object({
        soulProfileId: z.string(),
        tone: z.string().default('comforting'),
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

      const letterOutput = await generateLetter({
        deceasedName: profile.name,
        relationship: profile.relationship,
        personalityJson: profile.personalityJson,
        tone: input.tone,
      })

      const letter = await ctx.prisma.letter.create({
        data: {
          userId: ctx.session.user.id,
          soulProfileId: input.soulProfileId,
          type: 'soul_letter',
          content: letterOutput.content,
          tone: letterOutput.tone,
          realityAnchor: letterOutput.realityAnchor,
          status: 'draft',
        },
      })

      return letter
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const letters = await ctx.prisma.letter.findMany({
      where: {
        userId: ctx.session.user.id,
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

    return letters
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const letter = await ctx.prisma.letter.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          soulProfile: true,
        },
      })

      if (!letter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Letter not found',
        })
      }

      return letter
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['draft', 'pending_review', 'approved', 'delivered', 'rejected']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.letter.updateMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          status: input.status,
        },
      })

      return { count: result.count }
    }),
})
