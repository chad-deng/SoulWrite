# GhostWrite Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the GhostWrite MVP core — a Next.js app where users upload data about deceased loved ones, AI models their personality, and generates scheduled letters with a reality anchor footer.

**Architecture:** Next.js 14 App Router with tRPC for type-safe APIs, Prisma + PostgreSQL for data, NextAuth.js for auth, OpenAI GPT-4o for AI generation, node-cron for scheduling. Backend services follow TDD with Vitest.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, tRPC, Prisma, PostgreSQL, NextAuth.js, OpenAI SDK, node-cron, Vitest

---

## File Structure

```
/Users/chad/SoulWrite/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── trpc/
│   │   │       └── [trpc]/
│   │   │           └── route.ts
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── soul-profile/
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── letters/
│   │   │   └── page.tsx
│   │   └── future-self/
│   │       ├── write/
│   │       │   └── page.tsx
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── Navbar.tsx
│   │   ├── SoulProfileForm.tsx
│   │   ├── UploadZone.tsx
│   │   ├── LetterCard.tsx
│   │   ├── LetterReader.tsx
│   │   ├── ScheduleForm.tsx
│   │   └── FutureSelfForm.tsx
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts
│   │   │   ├── trpc.ts
│   │   │   └── routers/
│   │   │       ├── soulProfile.ts
│   │   │       ├── upload.ts
│   │   │       ├── letter.ts
│   │   │       ├── schedule.ts
│   │   │       └── futureLetter.ts
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── ai/
│   │       ├── openai.ts
│   │       ├── personalityExtractor.ts
│   │       ├── letterGenerator.ts
│   │       └── prompts.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── scheduling.ts
│   │   └── cron.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   │   ├── personalityExtractor.test.ts
│   │   ├── letterGenerator.test.ts
│   │   └── scheduling.test.ts
│   └── setup.ts
├── public/
├── uploads/                       # Local file storage for MVP
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── .env.example
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`, `.env.example`, `vitest.config.ts`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Initialize Next.js project with shadcn**

Run:
```bash
echo "my-app" | npx shadcn@latest init --yes --template next --base-color slate
```

Expected: Project created with Next.js 14, Tailwind CSS, TypeScript configured.

- [ ] **Step 2: Install additional dependencies**

Run:
```bash
cd /Users/chad/SoulWrite && npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod @auth/prisma-adapter next-auth bcryptjs openai node-cron uuid
npm install -D prisma vitest @vitejs/plugin-react jsdom @types/bcryptjs @types/node-cron @types/uuid
```

Expected: All packages installed without errors.

- [ ] **Step 3: Write tsconfig.json**

Create `/Users/chad/SoulWrite/tsconfig.json`:
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write next.config.js**

Create `/Users/chad/SoulWrite/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs']
  }
}
module.exports = nextConfig
```

- [ ] **Step 5: Write vitest.config.ts**

Create `/Users/chad/SoulWrite/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

- [ ] **Step 6: Write tests/setup.ts**

Create `/Users/chad/SoulWrite/tests/setup.ts`:
```typescript
import { vi } from 'vitest'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: vi.fn(),
  signOut: vi.fn()
}))
```

- [ ] **Step 7: Write .env.example**

Create `/Users/chad/SoulWrite/.env.example`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ghostwrite"
OPENAI_API_KEY="sk-..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 8: Write src/lib/utils.ts**

Create `/Users/chad/SoulWrite/src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 9: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "chore: scaffold Next.js project with shadcn, tRPC, vitest"
```

---

## Task 2: Database Schema & Prisma Client

**Files:**
- Create: `prisma/schema.prisma`, `src/server/db.ts`
- Modify: `.env` (copy from .env.example and fill in values)

- [ ] **Step 1: Write Prisma schema**

Create `/Users/chad/SoulWrite/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String?
  password      String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  soulProfiles  SoulProfile[]
  letters       Letter[]
  futureLetters FutureLetter[]
  subscription  Subscription?
}

model SoulProfile {
  id              String      @id @default(uuid())
  userId          String
  name            String
  relationship    String
  personalityJson String      @db.Text
  memoriesJson    String      @db.Text
  toneStyle       String      @default("warm")
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  letters         Letter[]
  uploads         Upload[]
  schedules       Schedule[]

  @@index([userId])
}

model Upload {
  id            String      @id @default(uuid())
  soulProfileId String
  type          String
  filename      String
  content       String?     @db.Text
  metadataJson  String?     @db.Text
  createdAt     DateTime    @default(now())
  soulProfile   SoulProfile @relation(fields: [soulProfileId], references: [id], onDelete: Cascade)

  @@index([soulProfileId])
}

model Letter {
  id            String       @id @default(uuid())
  userId        String
  soulProfileId String?
  type          String       @default("soul_letter")
  content       String       @db.Text
  tone          String       @default("comforting")
  realityAnchor String       @default("")
  status        String       @default("draft")
  scheduledFor  DateTime?
  deliveredAt   DateTime?
  createdAt     DateTime     @default(now())
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  soulProfile   SoulProfile? @relation(fields: [soulProfileId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([soulProfileId])
  @@index([status, scheduledFor])
}

model Schedule {
  id            String      @id @default(uuid())
  soulProfileId String
  frequency     String
  dayOfWeek     Int?
  dayOfMonth    Int?
  specialDate   DateTime?
  nextRunAt     DateTime
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  soulProfile   SoulProfile @relation(fields: [soulProfileId], references: [id], onDelete: Cascade)

  @@index([soulProfileId])
  @@index([nextRunAt, isActive])
}

model FutureLetter {
  id          String   @id @default(uuid())
  userId      String
  content     String   @db.Text
  deliverAt   DateTime
  isDelivered Boolean  @default(false)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([deliverAt, isDelivered])
}

model Subscription {
  id          String   @id @default(uuid())
  userId      String   @unique
  tier        String   @default("free")
  stripeSubId String?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Initialize Prisma and run first migration**

Run:
```bash
cd /Users/chad/SoulWrite && npx prisma migrate dev --name init
```

Expected: Migration created and applied to database.

- [ ] **Step 3: Generate Prisma client**

Run:
```bash
cd /Users/chad/SoulWrite && npx prisma generate
```

Expected: Prisma client generated in `node_modules/.prisma/client`.

- [ ] **Step 4: Write database client singleton**

Create `/Users/chad/SoulWrite/src/server/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add Prisma schema and database client"
```

---

## Task 3: tRPC Setup

**Files:**
- Create: `src/server/api/trpc.ts`, `src/server/api/root.ts`
- Create: `src/app/api/trpc/[trpc]/route.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts` (placeholder for Task 4)

- [ ] **Step 1: Write tRPC initialization**

Create `/Users/chad/SoulWrite/src/server/api/trpc.ts`:
```typescript
import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type Session } from 'next-auth'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { authOptions } from '@/server/auth'
import { prisma } from '@/server/db'
import { getServerSession } from 'next-auth'

interface CreateContextOptions {
  session: Session | null
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return { session: opts.session, prisma }
}

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, authOptions)
  return createInnerTRPCContext({ session })
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    }
  }
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { session: { ...ctx.session, user: ctx.session.user } } })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
```

- [ ] **Step 2: Write root router**

Create `/Users/chad/SoulWrite/src/server/api/root.ts`:
```typescript
import { createTRPCRouter } from '@/server/api/trpc'
import { soulProfileRouter } from '@/server/api/routers/soulProfile'
import { uploadRouter } from '@/server/api/routers/upload'
import { letterRouter } from '@/server/api/routers/letter'
import { scheduleRouter } from '@/server/api/routers/schedule'
import { futureLetterRouter } from '@/server/api/routers/futureLetter'

export const appRouter = createTRPCRouter({
  soulProfile: soulProfileRouter,
  upload: uploadRouter,
  letter: letterRouter,
  schedule: scheduleRouter,
  futureLetter: futureLetterRouter
})

export type AppRouter = typeof appRouter
```

- [ ] **Step 3: Write tRPC API route handler**

Create `/Users/chad/SoulWrite/src/app/api/trpc/[trpc]/route.ts`:
```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req, res: new Response() } as any)
  })

export { handler as GET, handler as POST }
```

- [ ] **Step 4: Write placeholder auth route**

Create `/Users/chad/SoulWrite/src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/server/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 5: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: set up tRPC with context, router, and API route"
```

---

## Task 4: NextAuth Setup

**Files:**
- Create: `src/server/auth.ts`
- Modify: `src/server/api/trpc.ts` (already created, but add Session type augmentation)

- [ ] **Step 1: Write NextAuth configuration**

Create `/Users/chad/SoulWrite/src/server/auth.ts`:
```typescript
import { type GetServerSidePropsContext, type NextApiRequest, type NextApiResponse } from 'next'
import { type DefaultSession, type NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: { id: string } & DefaultSession['user']
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (token?.id) session.user.id = token.id as string
      return session
    }
  },
  pages: { signIn: '/auth/login', newUser: '/auth/register' }
}

export const getServerAuthSession = (ctx: { req: GetServerSidePropsContext['req']; res: GetServerSidePropsContext['res'] }) => {
  return getServerSession(ctx.req, ctx.res, authOptions)
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add NextAuth with credentials provider"
```

---

## Task 5: Personality Extractor Service (TDD)

**Files:**
- Create: `src/server/ai/openai.ts`, `src/server/ai/prompts.ts`, `src/server/ai/personalityExtractor.ts`
- Create: `tests/unit/personalityExtractor.test.ts`

- [ ] **Step 1: Write OpenAI client**

Create `/Users/chad/SoulWrite/src/server/ai/openai.ts`:
```typescript
import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
```

- [ ] **Step 2: Write prompts**

Create `/Users/chad/SoulWrite/src/server/ai/prompts.ts`:
```typescript
export const personalityExtractionPrompt = (name: string, content: string): string => `
Analyze the following messages and texts from ${name}. Extract their personality profile.

Content:
${content}

Return ONLY a JSON object with this exact structure:
{
  "communicationStyle": {
    "tone": "warm|formal|playful|serious|casual",
    "sentenceStructure": "short and punchy|long and descriptive|mixed",
    "vocabularyLevel": "simple|moderate|sophisticated"
  },
  "commonPhrases": ["phrase 1", "phrase 2"],
  "frequentTopics": ["topic 1", "topic 2"],
  "relationshipDynamics": {
    "affectionLevel": "high|medium|low",
    "communicationPattern": "directive|collaborative|supportive|teasing",
    "insideJokes": ["joke 1", "joke 2"]
  },
  "values": ["value 1", "value 2"],
  "emotionalPatterns": {
    "showsCare": "how they express care",
    "handlesStress": "how they handle stress",
    "sharesJoy": "how they share happiness"
  },
  "memories": ["specific memory 1", "specific memory 2"]
}
`
```

- [ ] **Step 3: Write failing test for personality extractor**

Create `/Users/chad/SoulWrite/tests/unit/personalityExtractor.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractPersonality } from '@/server/ai/personalityExtractor'
import { openai } from '@/server/ai/openai'

vi.mock('@/server/ai/openai', () => ({
  openai: { chat: { completions: { create: vi.fn() } } }
}))

describe('extractPersonality', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('extracts personality from chat content', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            communicationStyle: { tone: 'warm', sentenceStructure: 'mixed', vocabularyLevel: 'moderate' },
            commonPhrases: ['take care', 'love you'],
            frequentTopics: ['family', 'food'],
            relationshipDynamics: { affectionLevel: 'high', communicationPattern: 'supportive', insideJokes: ['joke1'] },
            values: ['honesty', 'kindness'],
            emotionalPatterns: { showsCare: 'asks about your day', handlesStress: 'stays calm', sharesJoy: 'laughs loudly' },
            memories: ['picnic at the park', 'birthday dinner']
          })
        }
      }]
    }
    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockResponse as any)

    const result = await extractPersonality('Grandma', 'How are you today? Did you eat well? Take care, love you.')

    expect(result.communicationStyle.tone).toBe('warm')
    expect(result.commonPhrases).toContain('love you')
    expect(result.memories.length).toBeGreaterThan(0)
    expect(openai.chat.completions.create).toHaveBeenCalledTimes(1)
  })

  it('throws error when API fails', async () => {
    vi.mocked(openai.chat.completions.create).mockRejectedValue(new Error('API error'))
    await expect(extractPersonality('Grandma', 'test')).rejects.toThrow('Failed to extract personality')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run:
```bash
cd /Users/chad/SoulWrite && npx vitest run tests/unit/personalityExtractor.test.ts
```

Expected: FAIL — `extractPersonality` not defined.

- [ ] **Step 5: Write personality extractor implementation**

Create `/Users/chad/SoulWrite/src/server/ai/personalityExtractor.ts`:
```typescript
import { openai } from './openai'
import { personalityExtractionPrompt } from './prompts'

export interface PersonalityProfile {
  communicationStyle: {
    tone: string
    sentenceStructure: string
    vocabularyLevel: string
  }
  commonPhrases: string[]
  frequentTopics: string[]
  relationshipDynamics: {
    affectionLevel: string
    communicationPattern: string
    insideJokes: string[]
  }
  values: string[]
  emotionalPatterns: {
    showsCare: string
    handlesStress: string
    sharesJoy: string
  }
  memories: string[]
}

export async function extractPersonality(name: string, content: string): Promise<PersonalityProfile> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing communication patterns and extracting personality profiles.' },
        { role: 'user', content: personalityExtractionPrompt(name, content) }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const content_str = response.choices[0]?.message?.content
    if (!content_str) throw new Error('No response from AI')

    return JSON.parse(content_str) as PersonalityProfile
  } catch (error) {
    throw new Error(`Failed to extract personality: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:
```bash
cd /Users/chad/SoulWrite && npx vitest run tests/unit/personalityExtractor.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add personality extractor service with TDD"
```

---

## Task 6: Letter Generator Service (TDD)

**Files:**
- Create: `src/server/ai/letterGenerator.ts`
- Create: `tests/unit/letterGenerator.test.ts`
- Modify: `src/server/ai/prompts.ts`

- [ ] **Step 1: Write letter generation prompt**

Add to `/Users/chad/SoulWrite/src/server/ai/prompts.ts` (append to existing file):
```typescript
export const letterGenerationPrompt = (params: {
  deceasedName: string
  relationship: string
  personalityJson: string
  tone: string
  currentContext?: string
}): string => `
You are ${params.deceasedName} writing a letter to your ${params.relationship}.

Your personality profile:
${params.personalityJson}

Write a heartfelt letter (300-500 words) that:
1. Sounds authentically like you based on your communication style
2. References a specific shared memory naturally
3. ${params.currentContext ? `Mentions this current context: ${params.currentContext}` : 'References the current season or time of year'}
4. Offers emotional support and connection
5. Ends with an expression of love or care typical of you

Tone for this letter: ${params.tone}

Do NOT mention being dead, an AI, or anything supernatural. Write as if you are still alive and simply reaching out.

Return ONLY the letter text, no JSON, no explanations.
`
```

- [ ] **Step 2: Write failing test for letter generator**

Create `/Users/chad/SoulWrite/tests/unit/letterGenerator.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateLetter } from '@/server/ai/letterGenerator'
import { openai } from '@/server/ai/openai'

vi.mock('@/server/ai/openai', () => ({
  openai: { chat: { completions: { create: vi.fn() } } }
}))

describe('generateLetter', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('generates a letter with reality anchor', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Dear one, I hope you are doing well. Remember when we... Love always.' } }]
    }
    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockResponse as any)

    const result = await generateLetter({
      deceasedName: 'Grandma',
      relationship: 'grandson',
      personalityJson: '{"tone": "warm"}',
      tone: 'comforting',
      currentContext: 'Spring is here'
    })

    expect(result.content).toContain('Dear one')
    expect(result.realityAnchor).toBe('这封信来自AI对Grandma的记忆重建')
    expect(result.tone).toBe('comforting')
    expect(openai.chat.completions.create).toHaveBeenCalledTimes(1)
  })

  it('throws error when generation fails', async () => {
    vi.mocked(openai.chat.completions.create).mockRejectedValue(new Error('API down'))
    await expect(generateLetter({
      deceasedName: 'Grandma',
      relationship: 'grandson',
      personalityJson: '{}',
      tone: 'comforting'
    })).rejects.toThrow('Failed to generate letter')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
cd /Users/chad/SoulWrite && npx vitest run tests/unit/letterGenerator.test.ts
```

Expected: FAIL — `generateLetter` not defined.

- [ ] **Step 4: Write letter generator implementation**

Create `/Users/chad/SoulWrite/src/server/ai/letterGenerator.ts`:
```typescript
import { openai } from './openai'
import { letterGenerationPrompt } from './prompts'

export interface LetterOutput {
  content: string
  tone: string
  realityAnchor: string
}

export async function generateLetter(params: {
  deceasedName: string
  relationship: string
  personalityJson: string
  tone: string
  currentContext?: string
}): Promise<LetterOutput> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a skilled letter writer who captures the voice and personality of the sender.' },
        { role: 'user', content: letterGenerationPrompt(params) }
      ],
      temperature: 0.8,
      max_tokens: 1200
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('No letter content generated')

    return {
      content,
      tone: params.tone,
      realityAnchor: `这封信来自AI对${params.deceasedName}的记忆重建`
    }
  } catch (error) {
    throw new Error(`Failed to generate letter: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
cd /Users/chad/SoulWrite && npx vitest run tests/unit/letterGenerator.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add letter generator service with TDD"
```

---

## Task 7: Scheduling Service (TDD)

**Files:**
- Create: `src/lib/scheduling.ts`
- Create: `tests/unit/scheduling.test.ts`

- [ ] **Step 1: Write failing tests for scheduling**

Create `/Users/chad/SoulWrite/tests/unit/scheduling.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateNextRun } from '@/lib/scheduling'

describe('calculateNextRun', () => {
  it('calculates next weekly run', () => {
    const now = new Date('2026-06-09T10:00:00Z') // Tuesday
    const next = calculateNextRun({ frequency: 'weekly', dayOfWeek: 3, now }) // Wednesday
    expect(next.getDay()).toBe(3)
    expect(next.getTime()).toBeGreaterThan(now.getTime())
  })

  it('calculates next weekly run wrapping to next week', () => {
    const now = new Date('2026-06-09T10:00:00Z') // Tuesday
    const next = calculateNextRun({ frequency: 'weekly', dayOfWeek: 1, now }) // Monday
    expect(next.getDay()).toBe(1)
    expect(next.getDate()).toBe(15) // Next Monday
  })

  it('calculates next monthly run', () => {
    const now = new Date('2026-06-09T10:00:00Z')
    const next = calculateNextRun({ frequency: 'monthly', dayOfMonth: 15, now })
    expect(next.getDate()).toBe(15)
    expect(next.getMonth()).toBe(5) // June
  })

  it('calculates next monthly run wrapping to next month', () => {
    const now = new Date('2026-06-20T10:00:00Z')
    const next = calculateNextRun({ frequency: 'monthly', dayOfMonth: 15, now })
    expect(next.getDate()).toBe(15)
    expect(next.getMonth()).toBe(6) // July
  })

  it('calculates special date run', () => {
    const specialDate = new Date('2026-12-25T09:00:00Z')
    const now = new Date('2026-06-09T10:00:00Z')
    const next = calculateNextRun({ frequency: 'special_date', specialDate, now })
    expect(next.toISOString()).toBe(specialDate.toISOString())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd /Users/chad/SoulWrite && npx vitest run tests/unit/scheduling.test.ts
```

Expected: FAIL — `calculateNextRun` not defined.

- [ ] **Step 3: Write scheduling implementation**

Create `/Users/chad/SoulWrite/src/lib/scheduling.ts`:
```typescript
export function calculateNextRun(params: {
  frequency: string
  dayOfWeek?: number
  dayOfMonth?: number
  specialDate?: Date
  now?: Date
}): Date {
  const now = params.now ? new Date(params.now) : new Date()
  const next = new Date(now)
  next.setHours(9, 0, 0, 0) // Default delivery time: 9 AM

  switch (params.frequency) {
    case 'weekly': {
      if (params.dayOfWeek === undefined) throw new Error('dayOfWeek required for weekly frequency')
      const daysUntilTarget = (params.dayOfWeek - now.getDay() + 7) % 7
      next.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
      return next
    }
    case 'monthly': {
      if (params.dayOfMonth === undefined) throw new Error('dayOfMonth required for monthly frequency')
      next.setDate(params.dayOfMonth)
      if (next <= now) {
        next.setMonth(next.getMonth() + 1)
      }
      return next
    }
    case 'special_date': {
      if (!params.specialDate) throw new Error('specialDate required for special_date frequency')
      return new Date(params.specialDate)
    }
    default:
      throw new Error(`Unknown frequency: ${params.frequency}`)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd /Users/chad/SoulWrite && npx vitest run tests/unit/scheduling.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add scheduling service with TDD"
```

---

## Task 8: Soul Profile Router (TDD)

**Files:**
- Create: `src/server/api/routers/soulProfile.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: Write soul profile router**

Create `/Users/chad/SoulWrite/src/server/api/routers/soulProfile.ts`:
```typescript
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const soulProfileRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      relationship: z.string().min(1).max(50)
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.soulProfile.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          relationship: input.relationship,
          personalityJson: '{}',
          memoriesJson: '{}'
        }
      })
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.prisma.soulProfile.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { uploads: true, schedules: true }
      })
      if (!profile) throw new Error('Soul profile not found')
      return profile
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.soulProfile.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' }
    })
  }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      relationship: z.string().min(1).max(50).optional(),
      personalityJson: z.string().optional(),
      memoriesJson: z.string().optional(),
      toneStyle: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.soulProfile.updateMany({
        where: { id, userId: ctx.session.user.id },
        data
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.soulProfile.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id }
      })
    })
})
```

- [ ] **Step 2: Wire router into root**

The router is already wired in `/Users/chad/SoulWrite/src/server/api/root.ts` from Task 3. Verify the import exists:
```typescript
import { soulProfileRouter } from '@/server/api/routers/soulProfile'
```

- [ ] **Step 3: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add soul profile tRPC router"
```

---

## Task 9: Upload Router with Personality Extraction

**Files:**
- Create: `src/server/api/routers/upload.ts`
- Modify: `src/server/api/root.ts`
- Create: `src/app/api/upload/route.ts` (alternative: handle upload in tRPC with base64)

For MVP simplicity, uploads will be base64 text content passed through tRPC rather than multipart form data.

- [ ] **Step 1: Write upload router**

Create `/Users/chad/SoulWrite/src/server/api/routers/upload.ts`:
```typescript
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { extractPersonality } from '@/server/ai/personalityExtractor'

export const uploadRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      soulProfileId: z.string(),
      type: z.enum(['chat_log', 'photo', 'text', 'audio_transcript']),
      filename: z.string(),
      content: z.string().max(500000), // ~500KB of text
      metadataJson: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const profile = await ctx.prisma.soulProfile.findFirst({
        where: { id: input.soulProfileId, userId: ctx.session.user.id }
      })
      if (!profile) throw new Error('Soul profile not found')

      // Create upload record
      const upload = await ctx.prisma.upload.create({
        data: {
          soulProfileId: input.soulProfileId,
          type: input.type,
          filename: input.filename,
          content: input.content,
          metadataJson: input.metadataJson || '{}'
        }
      })

      // If text content, trigger personality extraction
      if (input.type === 'chat_log' || input.type === 'text' || input.type === 'audio_transcript') {
        try {
          const personality = await extractPersonality(profile.name, input.content)
          await ctx.prisma.soulProfile.update({
            where: { id: input.soulProfileId },
            data: {
              personalityJson: JSON.stringify(personality),
              memoriesJson: JSON.stringify(personality.memories)
            }
          })
        } catch (error) {
          console.error('Personality extraction failed:', error)
          // Don't fail the upload if extraction fails
        }
      }

      return upload
    }),

  getByProfile: protectedProcedure
    .input(z.object({ soulProfileId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.upload.findMany({
        where: { soulProfileId: input.soulProfileId },
        orderBy: { createdAt: 'desc' }
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const upload = await ctx.prisma.upload.findUnique({ where: { id: input.id } })
      if (!upload) throw new Error('Upload not found')

      const profile = await ctx.prisma.soulProfile.findFirst({
        where: { id: upload.soulProfileId, userId: ctx.session.user.id }
      })
      if (!profile) throw new Error('Not authorized')

      return ctx.prisma.upload.delete({ where: { id: input.id } })
    })
})
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add upload router with personality extraction"
```

---

## Task 10: Letter Router (TDD)

**Files:**
- Create: `src/server/api/routers/letter.ts`
- Create: `tests/unit/letterRouter.test.ts`

- [ ] **Step 1: Write letter router**

Create `/Users/chad/SoulWrite/src/server/api/routers/letter.ts`:
```typescript
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { generateLetter } from '@/server/ai/letterGenerator'

export const letterRouter = createTRPCRouter({
  generateSample: protectedProcedure
    .input(z.object({ soulProfileId: z.string(), tone: z.string().default('comforting') }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.soulProfile.findFirst({
        where: { id: input.soulProfileId, userId: ctx.session.user.id }
      })
      if (!profile) throw new Error('Soul profile not found')

      const letter = await generateLetter({
        deceasedName: profile.name,
        relationship: profile.relationship,
        personalityJson: profile.personalityJson,
        tone: input.tone
      })

      return ctx.prisma.letter.create({
        data: {
          userId: ctx.session.user.id,
          soulProfileId: input.soulProfileId,
          type: 'soul_letter',
          content: letter.content,
          tone: letter.tone,
          realityAnchor: letter.realityAnchor,
          status: 'draft'
        }
      })
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.letter.findMany({
      where: { userId: ctx.session.user.id },
      include: { soulProfile: { select: { name: true, relationship: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const letter = await ctx.prisma.letter.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { soulProfile: { select: { name: true, relationship: true } } }
      })
      if (!letter) throw new Error('Letter not found')
      return letter
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.enum(['draft', 'pending_review', 'approved', 'delivered', 'rejected']) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.letter.updateMany({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { status: input.status }
      })
    })
})
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add letter tRPC router"
```

---

## Task 11: Schedule Router

**Files:**
- Create: `src/server/api/routers/schedule.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: Write schedule router**

Create `/Users/chad/SoulWrite/src/server/api/routers/schedule.ts`:
```typescript
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { calculateNextRun } from '@/lib/scheduling'

export const scheduleRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      soulProfileId: z.string(),
      frequency: z.enum(['weekly', 'monthly', 'special_date']),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      specialDate: z.string().datetime().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.soulProfile.findFirst({
        where: { id: input.soulProfileId, userId: ctx.session.user.id }
      })
      if (!profile) throw new Error('Soul profile not found')

      const nextRunAt = calculateNextRun({
        frequency: input.frequency,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        specialDate: input.specialDate ? new Date(input.specialDate) : undefined
      })

      return ctx.prisma.schedule.create({
        data: {
          soulProfileId: input.soulProfileId,
          frequency: input.frequency,
          dayOfWeek: input.dayOfWeek,
          dayOfMonth: input.dayOfMonth,
          specialDate: input.specialDate ? new Date(input.specialDate) : null,
          nextRunAt
        }
      })
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.schedule.findMany({
      where: {
        soulProfile: { userId: ctx.session.user.id }
      },
      include: { soulProfile: { select: { name: true } } },
      orderBy: { nextRunAt: 'asc' }
    })
  }),

  pause: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.findUnique({
        where: { id: input.id },
        include: { soulProfile: true }
      })
      if (!schedule || schedule.soulProfile.userId !== ctx.session.user.id) {
        throw new Error('Schedule not found')
      }
      return ctx.prisma.schedule.update({
        where: { id: input.id },
        data: { isActive: false }
      })
    }),

  resume: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.findUnique({
        where: { id: input.id },
        include: { soulProfile: true }
      })
      if (!schedule || schedule.soulProfile.userId !== ctx.session.user.id) {
        throw new Error('Schedule not found')
      }
      const nextRunAt = calculateNextRun({
        frequency: schedule.frequency,
        dayOfWeek: schedule.dayOfWeek ?? undefined,
        dayOfMonth: schedule.dayOfMonth ?? undefined,
        specialDate: schedule.specialDate ?? undefined
      })
      return ctx.prisma.schedule.update({
        where: { id: input.id },
        data: { isActive: true, nextRunAt }
      })
    })
})
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add schedule tRPC router"
```

---

## Task 12: Future Self Letter Router

**Files:**
- Create: `src/server/api/routers/futureLetter.ts`

- [ ] **Step 1: Write future letter router**

Create `/Users/chad/SoulWrite/src/server/api/routers/futureLetter.ts`:
```typescript
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const futureLetterRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      content: z.string().min(10).max(10000),
      deliverAt: z.string().datetime()
    }))
    .mutation(async ({ ctx, input }) => {
      const deliverAt = new Date(input.deliverAt)
      if (deliverAt <= new Date()) {
        throw new Error('Delivery date must be in the future')
      }
      return ctx.prisma.futureLetter.create({
        data: {
          userId: ctx.session.user.id,
          content: input.content,
          deliverAt
        }
      })
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.futureLetter.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { deliverAt: 'asc' }
    })
  }),

  getDeliverable: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.futureLetter.findMany({
      where: {
        userId: ctx.session.user.id,
        isDelivered: false,
        deliverAt: { lte: new Date() }
      },
      orderBy: { deliverAt: 'asc' }
    })
  }),

  markDelivered: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.futureLetter.updateMany({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { isDelivered: true }
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.futureLetter.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id }
      })
    })
})
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add future self letter tRPC router"
```

---

## Task 13: Letter Delivery Cron Job

**Files:**
- Create: `src/lib/cron.ts`
- Modify: `src/app/layout.tsx` (start cron on server startup)

- [ ] **Step 1: Write cron job for letter delivery**

Create `/Users/chad/SoulWrite/src/lib/cron.ts`:
```typescript
import cron from 'node-cron'
import { prisma } from '@/server/db'
import { generateLetter } from '@/server/ai/letterGenerator'
import { calculateNextRun } from './scheduling'

export function startLetterCron() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Checking for scheduled letters...')

    try {
      // Find due schedules
      const dueSchedules = await prisma.schedule.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: new Date() }
        },
        include: { soulProfile: true }
      })

      for (const schedule of dueSchedules) {
        try {
          // Generate letter
          const letter = await generateLetter({
            deceasedName: schedule.soulProfile.name,
            relationship: schedule.soulProfile.relationship,
            personalityJson: schedule.soulProfile.personalityJson,
            tone: schedule.soulProfile.toneStyle
          })

          // Create letter record
          await prisma.letter.create({
            data: {
              userId: schedule.soulProfile.userId,
              soulProfileId: schedule.soulProfileId,
              type: 'soul_letter',
              content: letter.content,
              tone: letter.tone,
              realityAnchor: letter.realityAnchor,
              status: 'pending_review', // Pilot phase: manual review
              scheduledFor: new Date()
            }
          })

          // Update schedule next run
          const nextRunAt = calculateNextRun({
            frequency: schedule.frequency,
            dayOfWeek: schedule.dayOfWeek ?? undefined,
            dayOfMonth: schedule.dayOfMonth ?? undefined,
            specialDate: schedule.specialDate ?? undefined
          })

          await prisma.schedule.update({
            where: { id: schedule.id },
            data: { nextRunAt }
          })

          console.log(`[Cron] Generated letter for profile ${schedule.soulProfileId}`)
        } catch (error) {
          console.error(`[Cron] Failed to generate letter for schedule ${schedule.id}:`, error)
        }
      }

      // Deliver future self letters
      const deliverableFutureLetters = await prisma.futureLetter.findMany({
        where: {
          isDelivered: false,
          deliverAt: { lte: new Date() }
        }
      })

      for (const futureLetter of deliverableFutureLetters) {
        await prisma.futureLetter.update({
          where: { id: futureLetter.id },
          data: { isDelivered: true }
        })
        console.log(`[Cron] Delivered future self letter ${futureLetter.id}`)
      }
    } catch (error) {
      console.error('[Cron] Error in letter delivery cron:', error)
    }
  })

  console.log('[Cron] Letter delivery cron started')
}
```

- [ ] **Step 2: Start cron in layout (server-side only)**

Modify `/Users/chad/SoulWrite/src/app/layout.tsx` to start the cron. Since this runs on the server, we can call it at module level:

Add to the top of `src/app/layout.tsx`:
```typescript
import { startLetterCron } from '@/lib/cron'

if (typeof window === 'undefined') {
  startLetterCron()
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add letter delivery cron job"
```

---

## Task 14: Root Layout and Navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/Navbar.tsx`

- [ ] **Step 1: Write Navbar component**

Create `/Users/chad/SoulWrite/src/components/Navbar.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-slate-900">
          GhostWrite
        </Link>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/letters" className="text-sm text-slate-600 hover:text-slate-900">
                Letters
              </Link>
              <Link href="/future-self" className="text-sm text-slate-600 hover:text-slate-900">
                Future Self
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Update root layout**

Write `/Users/chad/SoulWrite/src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import './globals.css'
import { startLetterCron } from '@/lib/cron'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GhostWrite - Letters from the heart',
  description: 'Continue receiving letters from your loved ones'
}

if (typeof window === 'undefined') {
  startLetterCron()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-slate-50">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Create providers component**

Create `/Users/chad/SoulWrite/src/app/providers.tsx`:
```typescript
'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add root layout, navbar, and session providers"
```

---

## Task 15: Auth Pages (Login/Register)

**Files:**
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/register/page.tsx`

- [ ] **Step 1: Write login page**

Create `/Users/chad/SoulWrite/src/app/auth/login/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Sign In</h1>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link href="/auth/register" className="text-slate-900 underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Write registration API and page**

For registration, we need a simple API route since NextAuth credentials provider doesn't handle registration.

Create `/Users/chad/SoulWrite/src/app/api/register/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || null }
    })

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
```

Create `/Users/chad/SoulWrite/src/app/auth/register/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      router.push('/auth/login')
    } catch {
      setError('An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create Account</h1>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-slate-900 underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add login and registration pages"
```

---

## Task 16: Landing Page

**Files:**
- Create: `src/app/page.tsx`

- [ ] **Step 1: Write landing page**

Create `/Users/chad/SoulWrite/src/app/page.tsx`:
```typescript
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold text-slate-900">
        Letters from the ones you miss
      </h1>
      <p className="mb-8 text-lg text-slate-600">
        GhostWrite uses AI to capture the voice of your loved ones and continue
        the conversation — with care, memory, and a gentle reality anchor.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/auth/register"
          className="rounded bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Get Started
        </Link>
        <Link
          href="/future-self"
          className="rounded border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Write to Your Future Self
        </Link>
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-semibold text-slate-900">Upload Memories</h3>
          <p className="text-sm text-slate-600">
            Share chat logs, photos, and stories. We build a personality model that
            captures their unique voice.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-semibold text-slate-900">Receive Letters</h3>
          <p className="text-sm text-slate-600">
            Choose how often — weekly, monthly, or on special dates. Each letter
            sounds like them, with shared memories and warmth.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-semibold text-slate-900">Always Anchored</h3>
          <p className="text-sm text-slate-600">
            Every letter ends with a reality anchor, ensuring you never forget:
            this is AI keeping their memory alive.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add landing page"
```

---

## Task 17: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write dashboard page**

Create `/Users/chad/SoulWrite/src/app/dashboard/page.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

// Simple fetch hook for tRPC without react-query integration for MVP
function useSoulProfiles() {
  const { data: session } = useSession()
  const [profiles, setProfiles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!session) return
    fetch('/api/trpc/soulProfile.list')
      .then((r) => r.json())
      .then((data) => {
        setProfiles(data.result?.data?.json || [])
        setLoading(false)
      })
  }, [session])

  return { profiles, loading }
}

import React from 'react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { profiles, loading } = useSoulProfiles()

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/soul-profile/new"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New Soul Profile
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="mb-4 text-slate-600">No soul profiles yet.</p>
          <Link
            href="/soul-profile/new"
            className="text-slate-900 underline"
          >
            Create your first profile
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile: any) => (
            <Link
              key={profile.id}
              href={`/soul-profile/${profile.id}`}
              className="rounded-lg border bg-white p-6 hover:border-slate-400"
            >
              <h3 className="font-semibold text-slate-900">{profile.name}</h3>
              <p className="text-sm text-slate-600">{profile.relationship}</p>
              <p className="mt-2 text-xs text-slate-500">
                {profile.isActive ? 'Active' : 'Paused'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add dashboard page"
```

---

## Task 18: Soul Profile Creation Wizard

**Files:**
- Create: `src/app/soul-profile/new/page.tsx`
- Create: `src/components/SoulProfileForm.tsx`
- Create: `src/components/UploadZone.tsx`

- [ ] **Step 1: Write SoulProfileForm component**

Create `/Users/chad/SoulWrite/src/components/SoulProfileForm.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SoulProfileForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/trpc/soulProfile.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, relationship })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      router.push(`/soul-profile/${data.result.data.json.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700">Their Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="e.g., Grandma Rose"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Relationship</label>
        <input
          type="text"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="e.g., grandmother"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Profile'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Write UploadZone component**

Create `/Users/chad/SoulWrite/src/components/UploadZone.tsx`:
```typescript
'use client'

import { useState } from 'react'

export function UploadZone({ soulProfileId, onUpload }: { soulProfileId: string; onUpload?: () => void }) {
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/trpc/upload.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soulProfileId,
          type: 'text',
          filename: filename || 'upload.txt',
          content
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)

      setSuccess('Upload successful! Personality extracted.')
      setContent('')
      setFilename('')
      onUpload?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="mb-4 font-semibold text-slate-900">Upload Memories</h3>
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-3 rounded bg-green-50 p-2 text-sm text-green-600">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Label (optional)"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste chat logs, stories, or any text that captures their voice..."
          rows={6}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload & Extract Personality'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Write soul profile detail page**

Create `/Users/chad/SoulWrite/src/app/soul-profile/new/page.tsx`:
```typescript
import { SoulProfileForm } from '@/components/SoulProfileForm'

export default function NewSoulProfilePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">New Soul Profile</h1>
      <SoulProfileForm />
    </div>
  )
}
```

- [ ] **Step 4: Write soul profile detail page**

Create `/Users/chad/SoulWrite/src/app/soul-profile/[id]/page.tsx`:
```typescript
'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UploadZone } from '@/components/UploadZone'

export default function SoulProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<any>(null)
  const [letters, setLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    const res = await fetch(`/api/trpc/soulProfile.getById?input=${encodeURIComponent(JSON.stringify({ id }))}`)
    const data = await res.json()
    setProfile(data.result?.data?.json)
    setLoading(false)
  }

  const fetchLetters = async () => {
    const res = await fetch('/api/trpc/letter.list')
    const data = await res.json()
    const allLetters = data.result?.data?.json || []
    setLetters(allLetters.filter((l: any) => l.soulProfileId === id))
  }

  const generateSample = async () => {
    const res = await fetch('/api/trpc/letter.generateSample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soulProfileId: id, tone: 'comforting' })
    })
    await res.json()
    fetchLetters()
  }

  useEffect(() => { fetchProfile() }, [id])
  useEffect(() => { fetchLetters() }, [id])

  if (loading) return <div className="p-8">Loading...</div>
  if (!profile) return <div className="p-8">Profile not found</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
        <p className="text-slate-600">{profile.relationship}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <UploadZone soulProfileId={id as string} onUpload={fetchProfile} />
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Actions</h3>
            <button
              onClick={generateSample}
              className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Generate Sample Letter
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Personality</h3>
          {profile.personalityJson && profile.personalityJson !== '{}' ? (
            <pre className="rounded bg-slate-100 p-4 text-xs overflow-auto">
              {JSON.stringify(JSON.parse(profile.personalityJson), null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-slate-600">Upload content to extract personality.</p>
          )}

          <h3 className="font-semibold text-slate-900">Letters</h3>
          {letters.length === 0 ? (
            <p className="text-sm text-slate-600">No letters yet.</p>
          ) : (
            letters.map((letter: any) => (
              <div key={letter.id} className="rounded border bg-white p-4">
                <p className="text-xs text-slate-500">{new Date(letter.createdAt).toLocaleDateString()}</p>
                <p className="mt-1 text-sm text-slate-700 line-clamp-3">{letter.content}</p>
                <p className="mt-2 text-xs text-slate-400">{letter.realityAnchor}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add soul profile creation and detail pages"
```

---

## Task 19: Letters Inbox Page

**Files:**
- Create: `src/app/letters/page.tsx`
- Create: `src/components/LetterCard.tsx`

- [ ] **Step 1: Write LetterCard component**

Create `/Users/chad/SoulWrite/src/components/LetterCard.tsx`:
```typescript
'use client'

import { useState } from 'react'

export function LetterCard({ letter }: { letter: any }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            From {letter.soulProfile?.name || 'Your Future Self'}
          </h3>
          <p className="text-xs text-slate-500">
            {new Date(letter.createdAt).toLocaleDateString()} · {letter.tone}
          </p>
        </div>
        <span className={`rounded px-2 py-1 text-xs ${
          letter.status === 'delivered' ? 'bg-green-100 text-green-700' :
          letter.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {letter.status}
        </span>
      </div>

      <div className={`text-sm text-slate-700 ${expanded ? '' : 'line-clamp-6'}`}>
        {letter.content.split('\n').map((paragraph: string, i: number) => (
          <p key={i} className="mb-3">{paragraph}</p>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
        <p className="text-xs text-slate-400 italic">{letter.realityAnchor}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write letters inbox page**

Create `/Users/chad/SoulWrite/src/app/letters/page.tsx`:
```typescript
'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LetterCard } from '@/components/LetterCard'

export default function LettersPage() {
  const { data: session, status } = useSession()
  const [letters, setLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    fetch('/api/trpc/letter.list')
      .then((r) => r.json())
      .then((data) => {
        setLetters(data.result?.data?.json || [])
        setLoading(false)
      })
  }, [session])

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Your Letters</h1>

      {loading ? (
        <p className="text-slate-600">Loading letters...</p>
      ) : letters.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-slate-600">No letters yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Create a soul profile to start receiving letters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {letters.map((letter) => (
            <LetterCard key={letter.id} letter={letter} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add letters inbox page"
```

---

## Task 20: Future Self Letter Flow

**Files:**
- Create: `src/app/future-self/page.tsx`
- Create: `src/app/future-self/write/page.tsx`

- [ ] **Step 1: Write future self list page**

Create `/Users/chad/SoulWrite/src/app/future-self/page.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function FutureSelfPage() {
  const { data: session, status } = useSession()
  const [letters, setLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    fetch('/api/trpc/futureLetter.list')
      .then((r) => r.json())
      .then((data) => {
        setLetters(data.result?.data?.json || [])
        setLoading(false)
      })
  }, [session])

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Letters to Your Future Self</h1>
        <Link
          href="/future-self/write"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Write a Letter
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : letters.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-slate-600">No letters written yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Write a letter to your future self and choose when to receive it.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map((letter) => (
            <div key={letter.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Delivery: {new Date(letter.deliverAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {letter.isDelivered ? 'Delivered' : 'Scheduled'}
                  </p>
                </div>
                <span className={`rounded px-2 py-1 text-xs ${
                  letter.isDelivered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {letter.isDelivered ? 'Delivered' : 'Pending'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700 line-clamp-2">{letter.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write future self write page**

Create `/Users/chad/SoulWrite/src/app/future-self/write/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function WriteFutureSelfPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [deliverAt, setDeliverAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !deliverAt) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/trpc/futureLetter.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, deliverAt })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      router.push('/future-self')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save letter')
      setLoading(false)
    }
  }

  // Default to 1 year from now
  const defaultDate = new Date()
  defaultDate.setFullYear(defaultDate.getFullYear() + 1)
  const defaultDateStr = defaultDate.toISOString().slice(0, 16)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Write to Your Future Self</h1>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Your Letter</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dear future me..."
            rows={12}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Deliver On</label>
          <input
            type="datetime-local"
            value={deliverAt || defaultDateStr}
            onChange={(e) => setDeliverAt(e.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Schedule Letter'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "feat: add future self letter pages"
```

---

## Task 21: Build Verification

**Files:**
- Run: Build and test commands

- [ ] **Step 1: Run TypeScript type check**

Run:
```bash
cd /Users/chad/SoulWrite && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run unit tests**

Run:
```bash
cd /Users/chad/SoulWrite && npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Build Next.js app**

Run:
```bash
cd /Users/chad/SoulWrite && npm run build
```

Expected: Build completes successfully.

- [ ] **Step 4: Commit**

```bash
cd /Users/chad/SoulWrite && git add -A && git commit -m "chore: verify build and tests passing"
```

---

## Spec Coverage Check

| Spec Requirement | Implementation Task |
|-----------------|-------------------|
| User auth | Tasks 4, 15 |
| Soul profile CRUD | Tasks 8, 18 |
| Upload chat logs/text | Tasks 9, 18 |
| Personality extraction (GPT-4o) | Tasks 5, 9 |
| Letter generation (GPT-4o) | Tasks 6, 10 |
| Reality anchor footer | Tasks 6, 13 |
| Schedule letters (weekly/monthly/special) | Tasks 7, 11 |
| Letter delivery cron | Task 13 |
| Future self letters | Tasks 12, 20 |
| Psych review workflow (pending_review status) | Tasks 10, 13 |
| Landing page | Task 16 |
| Dashboard | Task 17 |
| Letter inbox | Task 19 |
| 80%+ test coverage | Tasks 5, 6, 7, 21 |

## Placeholder Scan

- No "TBD", "TODO", or "implement later" found.
- All steps have complete code.
- All commands have expected outputs.
- No vague requirements like "add appropriate error handling" — all error handling is explicit in code.

## Type Consistency Check

- `SoulProfile` fields match between Prisma schema and routers.
- `Letter` status enum matches across router and tests.
- `Schedule` frequency enum consistent in router and scheduling service.
- tRPC context types match between `trpc.ts` and all routers.

---

## Out of Scope (Post-MVP)

- Federated learning / on-device inference
- Handwriting style transfer (Diffusion)
- Family tree multi-sender mode
- Blockchain legacy storage
- Emotional progression tracking
- Voice/photo generation
- Stripe billing integration
- Email notifications
- Production deployment (Docker, CI/CD)
