'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

interface NavbarProps {}

export function Navbar(_props: NavbarProps) {
  const { data: session } = useSession()

  return (
    <nav aria-label="Main" className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-slate-900">
          GhostWrite
        </Link>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/letters" className="text-sm text-slate-600 hover:text-slate-900">
                Letters
              </Link>
              <Link href="/future-self" className="text-sm text-slate-600 hover:text-slate-900">
                Future Self
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
