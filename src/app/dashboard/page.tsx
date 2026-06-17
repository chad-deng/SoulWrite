'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

import { trpc } from '@/trpc/provider'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { data: profiles = [], isLoading } = trpc.soulProfile.list.useQuery(undefined, {
    enabled: !!session,
  })

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/soul-profile/new"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New Soul Profile
        </Link>
      </div>

      {isLoading ? (
        <p className="text-slate-600">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="mb-4 text-slate-600">No soul profiles yet.</p>
          <Link
            href="/soul-profile/new"
            className="text-slate-900 underline"
          >
            Create your first profile
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/soul-profile/${profile.id}`}
              className="rounded-lg border bg-white p-6 hover:border-slate-400"
            >
              <h3 className="font-semibold text-slate-900">{profile.name}</h3>
              <p className="text-sm text-slate-600">{profile.relationship}</p>
              <p className="mt-2 text-xs text-slate-500">
                {profile.isActive ? 'Active' : 'Paused'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
