'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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
        <Link href="/soul-profile/new">
          <Button>New Soul Profile</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-4 text-slate-600">No soul profiles yet.</p>
            <Link href="/soul-profile/new">
              <Button variant="link">Create your first profile</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/soul-profile/${profile.id}`}
            >
              <Card className="transition-colors hover:border-slate-400">
                <CardHeader className="pb-2">
                  <h3 className="font-semibold text-slate-900">{profile.name}</h3>
                  <p className="text-sm text-slate-600">{profile.relationship}</p>
                </CardHeader>
                <CardContent>
                  <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                    {profile.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
