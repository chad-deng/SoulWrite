import { createTRPCRouter } from '@/server/api/trpc'

export const appRouter = createTRPCRouter({
  // Placeholder routers — will be created in later tasks
  // example: exampleRouter,
})

export type AppRouter = typeof appRouter
