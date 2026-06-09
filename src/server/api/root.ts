import { createTRPCRouter } from '@/server/api/trpc'
import { soulProfileRouter } from '@/server/api/routers/soulProfile'
import { uploadRouter } from '@/server/api/routers/upload'
import { letterRouter } from '@/server/api/routers/letter'
import { scheduleRouter } from '@/server/api/routers/schedule'

export const appRouter = createTRPCRouter({
  soulProfile: soulProfileRouter,
  upload: uploadRouter,
  letter: letterRouter,
  schedule: scheduleRouter,
})

export type AppRouter = typeof appRouter
