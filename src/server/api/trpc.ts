import { initTRPC, TRPCError } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/server/auth'
import { prisma } from '@/server/db'

interface Session {
  user: {
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

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const session = await getServerSession(authOptions)

  return createContextInner({
    session: session
      ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          },
        }
      : null,
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
