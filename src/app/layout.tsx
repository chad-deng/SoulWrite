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

if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  startLetterCron()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-slate-50">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
