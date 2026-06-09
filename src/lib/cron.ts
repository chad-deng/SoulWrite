import cron from 'node-cron'
import { prisma } from '@/server/db'
import { generateLetter } from '@/server/ai/letterGenerator'
import { calculateNextRun } from '@/lib/scheduling'

const validFrequencies = ['weekly', 'monthly', 'special_date'] as const
type Frequency = typeof validFrequencies[number]

function isValidFrequency(freq: string): freq is Frequency {
  return validFrequencies.includes(freq as Frequency)
}

let isStarted = false

export function startLetterCron(): void {
  if (isStarted) return
  isStarted = true

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
        if (!isValidFrequency(schedule.frequency)) {
          console.error(`[Cron] Invalid frequency for schedule ${schedule.id}: ${schedule.frequency}`)
          continue
        }

        try {
          // Calculate next run FIRST to avoid stuck schedules
          const nextRunAt = calculateNextRun({
            frequency: schedule.frequency,
            dayOfWeek: schedule.dayOfWeek ?? undefined,
            dayOfMonth: schedule.dayOfMonth ?? undefined,
            specialDate: schedule.specialDate ?? undefined
          })

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
              status: 'pending_review',
              scheduledFor: new Date()
            }
          })

          // Update schedule next run
          await prisma.schedule.update({
            where: { id: schedule.id },
            data: { nextRunAt }
          })

          console.log(`[Cron] Generated letter for profile ${schedule.soulProfileId}`)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.error(`[Cron] Failed to generate letter for schedule ${schedule.id}: ${message}`)
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
        try {
          await prisma.futureLetter.update({
            where: { id: futureLetter.id },
            data: { isDelivered: true }
          })
          console.log(`[Cron] Delivered future self letter ${futureLetter.id}`)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.error(`[Cron] Failed to deliver future letter ${futureLetter.id}: ${message}`)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[Cron] Error in letter delivery cron:', message)
    }
  })

  console.log('[Cron] Letter delivery cron started')
}
