'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

import { SoulProfileForm } from '@/components/SoulProfileForm'

export default function NewSoulProfilePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">New Soul Profile</h1>
      <SoulProfileForm />
    </div>
  )
}
