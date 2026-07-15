import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/server/db'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 5

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

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const parseResult = resetPasswordSchema.safeParse(await req.json())
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { token, password } = parseResult.data

    // Hash the incoming token to look up the stored hash
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Check expiry
    if (new Date() > resetToken.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    // Delete the used token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[ResetPassword] Error:', message)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
