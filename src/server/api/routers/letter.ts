import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { generateLetter } from '@/server/ai/letterGenerator'
import { fetchWeather } from '@/server/ai/weather'
import { deliverLetter } from '@/server/delivery'

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
        include: {
          lifeUpdates: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      })

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Soul profile not found',
        })
      }

      const weather = profile.location
        ? await fetchWeather(profile.location)
        : null

      const letterOutput = await generateLetter({
        deceasedName: profile.name,
        relationship: profile.relationship,
        recipientNickname: profile.recipientNickname ?? undefined,
        personalityJson: profile.personalityJson,
        tone: input.tone,
        currentContext: profile.location ?? undefined,
        weather,
        recentUpdates: profile.lifeUpdates,
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
      const letter = await ctx.prisma.letter.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      })

      if (!letter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Letter not found',
        })
      }

      const updated = await ctx.prisma.letter.update({
        where: {
          id: input.id,
        },
        data: {
          status: input.status,
        },
      })

      return updated
    }),

  deliver: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const letter = await ctx.prisma.letter.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          soulProfile: {
            select: {
              name: true,
            },
          },
        },
      })

      if (!letter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Letter not found',
        })
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      try {
        await deliverLetter({
          channel: user.deliveryChannel,
          to: user.email,
          fromName: letter.soulProfile.name,
          subject: `A letter from ${letter.soulProfile.name}`,
          content: letter.content,
          realityAnchor: letter.realityAnchor,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to deliver letter: ${message}`,
        })
      }

      const updated = await ctx.prisma.letter.update({
        where: { id: input.id },
        data: { status: 'delivered' },
      })

      return updated
    }),
})
