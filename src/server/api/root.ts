import { createTRPCRouter } from '@/server/api/trpc'
import { soulProfileRouter } from '@/server/api/routers/soulProfile'
import { uploadRouter } from '@/server/api/routers/upload'

export const appRouter = createTRPCRouter({
  soulProfile: soulProfileRouter,
  upload: uploadRouter,
})

export type AppRouter = typeof appRouter
