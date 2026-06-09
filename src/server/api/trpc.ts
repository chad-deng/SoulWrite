import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'

import { prisma } from '@/server/db'

interface Session {
  user?: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

interface CreateContextOptions {
  session: Session | null
}

export async function createContextInner(opts: CreateContextOptions) {
  return {
    session: opts.session,
    prisma,
  }
}

export async function createContext() {
  // Placeholder session until NextAuth is fully configured in Task 4
  const session: Session | null = null

  return createContextInner({
    session,
  })
}

type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      session: {
        ...ctx.session,
        user: ctx.session.user,
      },
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
