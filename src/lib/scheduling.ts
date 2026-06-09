interface CalculateNextRunParams {
  frequency: 'weekly' | 'monthly' | 'special_date'
  dayOfWeek?: number
  dayOfMonth?: number
  specialDate?: Date
  now?: Date
}

export function calculateNextRun(params: CalculateNextRunParams): Date {
  const { frequency, dayOfWeek, dayOfMonth, specialDate, now = new Date() } = params

  if (frequency === 'weekly') {
    if (dayOfWeek === undefined) {
      throw new Error('dayOfWeek is required for weekly frequency')
    }

    const result = new Date(now)
    result.setHours(9, 0, 0, 0)

    const currentDay = result.getDay()
    let daysUntilTarget = dayOfWeek - currentDay

    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7
    }

    result.setDate(result.getDate() + daysUntilTarget)
    return result
  }

  if (frequency === 'monthly') {
    if (dayOfMonth === undefined) {
      throw new Error('dayOfMonth is required for monthly frequency')
    }

    if (dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error('dayOfMonth must be between 1 and 31')
    }

    const result = new Date(now)
    result.setHours(9, 0, 0, 0)

    if (result.getDate() >= dayOfMonth) {
      result.setMonth(result.getMonth() + 1)
    }

    result.setDate(dayOfMonth)
    return result
  }

  if (frequency === 'special_date') {
    if (specialDate === undefined) {
      throw new Error('specialDate is required for special_date frequency')
    }

    const result = new Date(specialDate)
    result.setHours(9, 0, 0, 0)
    return result
  }

  throw new Error(`Unknown frequency: ${frequency}`)
}
