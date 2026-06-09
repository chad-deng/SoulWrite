import { describe, test, expect } from 'vitest'
import { calculateNextRun } from '@/lib/scheduling'

describe('calculateNextRun', () => {
  test('calculates next weekly run', () => {
    const now = new Date('2026-06-09T10:00:00') // Tuesday
    const result = calculateNextRun({
      frequency: 'weekly',
      dayOfWeek: 3, // Wednesday
      now,
    })

    expect(result.getDay()).toBe(3)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)

    const expected = new Date('2026-06-10T09:00:00')
    expect(result.getTime()).toBe(expected.getTime())
  })

  test('calculates next weekly run wrapping to next week', () => {
    const now = new Date('2026-06-09T10:00:00') // Tuesday
    const result = calculateNextRun({
      frequency: 'weekly',
      dayOfWeek: 1, // Monday
      now,
    })

    expect(result.getDay()).toBe(1)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)

    const expected = new Date('2026-06-15T09:00:00')
    expect(result.getTime()).toBe(expected.getTime())
  })

  test('calculates next monthly run', () => {
    const now = new Date('2026-06-09T10:00:00') // June 9
    const result = calculateNextRun({
      frequency: 'monthly',
      dayOfMonth: 15,
      now,
    })

    expect(result.getDate()).toBe(15)
    expect(result.getMonth()).toBe(5) // June is month 5 (0-indexed)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)

    const expected = new Date('2026-06-15T09:00:00')
    expect(result.getTime()).toBe(expected.getTime())
  })

  test('calculates next monthly run wrapping to next month', () => {
    const now = new Date('2026-06-20T10:00:00') // June 20
    const result = calculateNextRun({
      frequency: 'monthly',
      dayOfMonth: 15,
      now,
    })

    expect(result.getDate()).toBe(15)
    expect(result.getMonth()).toBe(6) // July is month 6 (0-indexed)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)

    const expected = new Date('2026-07-15T09:00:00')
    expect(result.getTime()).toBe(expected.getTime())
  })

  test('calculates special date run', () => {
    const now = new Date('2026-06-09T10:00:00')
    const specialDate = new Date('2026-12-25T00:00:00')
    const result = calculateNextRun({
      frequency: 'special_date',
      specialDate,
      now,
    })

    expect(result.getTime()).toBe(specialDate.getTime())
  })
})
