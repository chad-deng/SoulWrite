import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { extractPersonality } from '@/server/ai/personalityExtractor'

const TEXT_EXTRACTION_TYPES = ['chat_log', 'text', 'audio_transcript'] as const

export const uploadRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        soulProfileId: z.string(),
        type: z.enum(['chat_log', 'photo', 'text', 'audio_transcript']),
        filename: z.string(),
        content: z.string().max(500000),
        metadataJson: z.string().refine((s) => {
          try { JSON.parse(s); return true } catch { return false }
        }, { message: 'Must be valid JSON' }).optional(),
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

      if (TEXT_EXTRACTION_TYPES.includes(input.type as (typeof TEXT_EXTRACTION_TYPES)[number])) {
        try {
          const extracted = await extractPersonality(profile.name, input.content)

          const existing = profile.personalityJson
            ? (JSON.parse(profile.personalityJson) as Record<string, unknown>)
            : {}

          const merged = {
            ...existing,
            ...extracted,
            commonPhrases: Array.from(
              new Set([
                ...((existing.commonPhrases as string[]) ?? []),
                ...(extracted.commonPhrases ?? []),
              ])
            ),
            frequentTopics: Array.from(
              new Set([
                ...((existing.frequentTopics as string[]) ?? []),
                ...(extracted.frequentTopics ?? []),
              ])
            ),
            values: Array.from(
              new Set([
                ...((existing.values as string[]) ?? []),
                ...(extracted.values ?? []),
              ])
            ),
            memories: Array.from(
              new Set([
                ...((existing.memories as string[]) ?? []),
                ...(extracted.memories ?? []),
              ])
            ),
          }

          await ctx.prisma.soulProfile.update({
            where: { id: input.soulProfileId },
            data: {
              personalityJson: JSON.stringify(merged),
              memoriesJson: JSON.stringify(merged.memories),
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

      const deleted = await ctx.prisma.upload.delete({
        where: { id: input.id },
      })

      return deleted
    }),
})
