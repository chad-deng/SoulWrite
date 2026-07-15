export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build') {
    import('@/lib/cron').then(({ startLetterCron }) => startLetterCron())
  }
}
