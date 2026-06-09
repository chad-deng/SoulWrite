import { createTRPCRouter } from '@/server/api/trpc'
import { soulProfileRouter } from '@/server/api/routers/soulProfile'
import { uploadRouter } from '@/server/api/routers/upload'
import { letterRouter } from '@/server/api/routers/letter'

export const appRouter = createTRPCRouter({
  soulProfile: soulProfileRouter,
  upload: uploadRouter,
  letter: letterRouter,
})

export type AppRouter = typeof appRouter
