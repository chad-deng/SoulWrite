import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SoulWrite - Letters from the heart',
  description: 'Continue receiving letters from your loved ones'
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
