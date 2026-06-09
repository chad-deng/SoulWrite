import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const futureLetterRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(10).max(10000),
        deliverAt: z.string().datetime(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deliverAt = new Date(input.deliverAt)
      const now = new Date()

      if (deliverAt <= now) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'deliverAt must be in the future',
        })
      }

      const letter = await ctx.prisma.futureLetter.create({
        data: {
          userId: ctx.session.user.id,
          content: input.content,
          deliverAt,
        },
      })

      return letter
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const letters = await ctx.prisma.futureLetter.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        deliverAt: 'asc',
      },
    })

    return letters
  }),

  getDeliverable: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date()

    const letters = await ctx.prisma.futureLetter.findMany({
      where: {
        userId: ctx.session.user.id,
        isDelivered: false,
        deliverAt: {
          lte: now,
        },
      },
      orderBy: {
        deliverAt: 'asc',
      },
    })

    return letters
  }),

  markDelivered: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const letter = await ctx.prisma.futureLetter.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!letter) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Future letter not found' })
      }
      return ctx.prisma.futureLetter.update({
        where: { id: input.id },
        data: { isDelivered: true },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const letter = await ctx.prisma.futureLetter.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!letter) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Future letter not found' })
      }
      return ctx.prisma.futureLetter.delete({
        where: { id: input.id },
      })
    }),
})
