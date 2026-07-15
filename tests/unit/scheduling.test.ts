import { describe, test, expect } from 'vitest'
import { calculateNextRun, type CalculateNextRunParams } from '@/lib/scheduling'

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

    const expected = new Date('2026-12-25T09:00:00')
    expect(result.getTime()).toBe(expected.getTime())
  })

  test('when now is the same day as dayOfWeek, returns next week', () => {
    const now = new Date('2026-06-09T10:00:00') // Tuesday
    const result = calculateNextRun({
      frequency: 'weekly',
      dayOfWeek: 2, // Tuesday
      now,
    })

    expect(result.getDay()).toBe(2)
    const expected = new Date('2026-06-16T09:00:00')
    expect(result.getTime()).toBe(expected.getTime())
  })

  test('when now is the same day as dayOfMonth, returns next month', () => {
    const now = new Date('2026-06-15T10:00:00') // June 15
    const result = calculateNextRun({
      frequency: 'monthly',
      dayOfMonth: 15,
      now,
    })

    expect(result.getDate()).toBe(15)
    expect(result.getMonth()).toBe(6) // July is month 6 (0-indexed)
    const expected = new Date('2026-07-15T09:00:00')
    expect(result.getTime()).toBe(expected.getTime())
  })

  test('calculates next daily run as tomorrow at 9am', () => {
    const result = calculateNextRun({
      frequency: 'daily',
      now: new Date('2026-06-09T10:00:00'),
    })
    const expected = new Date('2026-06-10T09:00:00')
    expect(result.getTime()).toBe(expected.getTime())
  })

  test('throws on unknown frequency', () => {
    expect(() =>
      calculateNextRun({
        frequency: 'hourly' as unknown as CalculateNextRunParams['frequency'],
        now: new Date('2026-06-09T10:00:00'),
      })
    ).toThrow('Unknown frequency: hourly')
  })

  test('throws when dayOfWeek is missing for weekly', () => {
    expect(() =>
      calculateNextRun({
        frequency: 'weekly',
        now: new Date('2026-06-09T10:00:00'),
      })
    ).toThrow('dayOfWeek is required for weekly frequency')
  })

  test('throws when dayOfMonth is missing for monthly', () => {
    expect(() =>
      calculateNextRun({
        frequency: 'monthly',
        now: new Date('2026-06-09T10:00:00'),
      })
    ).toThrow('dayOfMonth is required for monthly frequency')
  })

  test('throws when specialDate is missing for special_date', () => {
    expect(() =>
      calculateNextRun({
        frequency: 'special_date',
        now: new Date('2026-06-09T10:00:00'),
      })
    ).toThrow('specialDate is required for special_date frequency')
  })

  test('throws when dayOfMonth is out of range', () => {
    expect(() =>
      calculateNextRun({
        frequency: 'monthly',
        dayOfMonth: 0,
        now: new Date('2026-06-09T10:00:00'),
      })
    ).toThrow('dayOfMonth must be between 1 and 31')

    expect(() =>
      calculateNextRun({
        frequency: 'monthly',
        dayOfMonth: 32,
        now: new Date('2026-06-09T10:00:00'),
      })
    ).toThrow('dayOfMonth must be between 1 and 31')
  })
})
