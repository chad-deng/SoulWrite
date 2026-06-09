import { createTRPCRouter } from '@/server/api/trpc'
import { soulProfileRouter } from '@/server/api/routers/soulProfile'

export const appRouter = createTRPCRouter({
  soulProfile: soulProfileRouter,
})

export type AppRouter = typeof appRouter
