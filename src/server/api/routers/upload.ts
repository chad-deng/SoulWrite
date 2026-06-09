import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { extractPersonality } from '@/server/ai/personalityExtractor'

const TEXT_EXTRACTION_TYPES: readonly string[] = ['chat_log', 'text', 'audio_transcript']

export const uploadRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        soulProfileId: z.string(),
        type: z.enum(['chat_log', 'photo', 'text', 'audio_transcript']),
        filename: z.string(),
        content: z.string().max(500000),
        metadataJson: z.string().optional(),
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

      const upload = await ctx.prisma.upload.create({
        data: {
          soulProfileId: input.soulProfileId,
          type: input.type,
          filename: input.filename,
          content: input.content,
          metadataJson: input.metadataJson ?? '{}',
        },
      })

      if (TEXT_EXTRACTION_TYPES.includes(input.type)) {
        try {
          const extracted = await extractPersonality(profile.name, input.content)
          await ctx.prisma.soulProfile.update({
            where: { id: input.soulProfileId },
            data: {
              personalityJson: JSON.stringify(extracted),
              memoriesJson: JSON.stringify(extracted.memories),
            },
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.error('Personality extraction failed:', message)
        }
      }

      return upload
    }),

  getByProfile: protectedProcedure
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

      const uploads = await ctx.prisma.upload.findMany({
        where: {
          soulProfileId: input.soulProfileId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return uploads
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const upload = await ctx.prisma.upload.findFirst({
        where: { id: input.id },
        include: { soulProfile: true },
      })

      if (!upload) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Upload not found',
        })
      }

      if (upload.soulProfile.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      await ctx.prisma.upload.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
