import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { generateLetter } from '@/server/ai/letterGenerator'
import { calculateNextRun } from '@/lib/scheduling'
import { deliverLetter } from '@/server/delivery'

const validFrequencies = ['daily', 'weekly', 'monthly', 'special_date'] as const
type Frequency = (typeof validFrequencies)[number]

function isValidFrequency(freq: string): freq is Frequency {
  return validFrequencies.includes(freq as Frequency)
}

interface DeliveryContactConfig {
  webhookUrl?: string
  webhookSecret?: string
}

function parseDeliveryContact(json: string | null | undefined): DeliveryContactConfig {
  if (!json) return {}
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    return {
      webhookUrl: typeof parsed.webhookUrl === 'string' ? parsed.webhookUrl : undefined,
      webhookSecret: typeof parsed.webhookSecret === 'string' ? parsed.webhookSecret : undefined,
    }
  } catch {
    return {}
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  // Process due schedules
  const dueSchedules = await prisma.schedule.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: new Date() },
    },
    include: { soulProfile: true },
  })

  for (const schedule of dueSchedules) {
    if (!isValidFrequency(schedule.frequency)) {
      results.push(`Skipped schedule ${schedule.id}: invalid frequency ${schedule.frequency}`)
      continue
    }

    try {
      const nextRunAt = calculateNextRun({
        frequency: schedule.frequency,
        dayOfWeek: schedule.dayOfWeek ?? undefined,
        dayOfMonth: schedule.dayOfMonth ?? undefined,
        specialDate: schedule.specialDate ?? undefined,
      })

      const letter = await generateLetter({
        deceasedName: schedule.soulProfile.name,
        relationship: schedule.soulProfile.relationship,
        personalityJson: schedule.soulProfile.personalityJson,
        tone: schedule.soulProfile.toneStyle,
      })

      const letterRecord = await prisma.letter.create({
        data: {
          userId: schedule.soulProfile.userId,
          soulProfileId: schedule.soulProfileId,
          type: 'soul_letter',
          content: letter.content,
          tone: letter.tone,
          realityAnchor: letter.realityAnchor,
          status: 'pending_review',
          scheduledFor: new Date(),
        },
      })

      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { nextRunAt },
      })

      // Auto-deliver the letter
      const user = await prisma.user.findUnique({
        where: { id: schedule.soulProfile.userId },
      })

      if (user) {
        const contactConfig = parseDeliveryContact(user.deliveryContactJson)
        try {
          await deliverLetter({
            channel: user.deliveryChannel,
            to: user.email,
            fromName: schedule.soulProfile.name,
            subject: `A letter from ${schedule.soulProfile.name}`,
            content: letter.content,
            realityAnchor: letter.realityAnchor,
            webhookUrl: contactConfig.webhookUrl,
            webhookSecret: contactConfig.webhookSecret,
          })

          await prisma.letter.update({
            where: { id: letterRecord.id },
            data: { status: 'delivered', deliveredAt: new Date() },
          })

          results.push(`Generated and delivered letter for profile ${schedule.soulProfileId}`)
        } catch (deliveryError) {
          const msg = deliveryError instanceof Error ? deliveryError.message : String(deliveryError)
          results.push(`Generated letter for profile ${schedule.soulProfileId} but delivery failed: ${msg}`)
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      results.push(`Failed schedule ${schedule.id}: ${msg}`)
    }
  }

  // Process deliverable future-self letters
  const deliverableFutureLetters = await prisma.futureLetter.findMany({
    where: {
      isDelivered: false,
      deliverAt: { lte: new Date() },
    },
    include: {
      user: {
        select: {
          email: true,
          deliveryChannel: true,
          deliveryContactJson: true,
        },
      },
    },
  })

  for (const futureLetter of deliverableFutureLetters) {
    try {
      const contactConfig = parseDeliveryContact(futureLetter.user.deliveryContactJson)

      await deliverLetter({
        channel: futureLetter.user.deliveryChannel,
        to: futureLetter.user.email,
        fromName: 'Your Past Self',
        subject: 'A letter from your past self',
        content: futureLetter.content,
        realityAnchor: 'Written by you, delivered as promised.',
        webhookUrl: contactConfig.webhookUrl,
        webhookSecret: contactConfig.webhookSecret,
      })

      await prisma.futureLetter.update({
        where: { id: futureLetter.id },
        data: { isDelivered: true },
      })

      results.push(`Delivered future self letter ${futureLetter.id}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      results.push(`Failed future letter ${futureLetter.id}: ${msg}`)
    }
  }

  return NextResponse.json({
    schedulesProcessed: dueSchedules.length,
    futureLettersProcessed: deliverableFutureLetters.length,
    results,
  })
}
