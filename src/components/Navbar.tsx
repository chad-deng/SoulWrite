'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav aria-label="Main" className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-slate-900">
          SoulWrite
        </Link>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/letters">
                <Button variant="ghost" size="sm">Letters</Button>
              </Link>
              <Link href="/future-self">
                <Button variant="ghost" size="sm">Future Self</Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">Settings</Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
