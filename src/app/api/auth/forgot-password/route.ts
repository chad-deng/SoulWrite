import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { sendPasswordResetEmail } from '@/server/delivery/email'

const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 3

function checkRateLimit(ip: string): boolean {
  const now = Date.now()

  const expired: string[] = []
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      expired.push(key)
    }
  }
  for (const key of expired) {
    rateLimitMap.delete(key)
  }

  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (record.count >= RATE_LIMIT_MAX) return false
  rateLimitMap.set(ip, { ...record, count: record.count + 1 })
  return true
}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const parseResult = forgotPasswordSchema.safeParse(await req.json())
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const { email } = parseResult.data

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    // Generate token and store hashed version
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    })

    // Build reset URL
    const origin = req.headers.get('origin') || `http://${req.headers.get('host')}`
    const resetUrl = `${origin}/auth/reset-password?token=${rawToken}`

    await sendPasswordResetEmail({ to: email, resetUrl })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[ForgotPassword] Error:', message)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
