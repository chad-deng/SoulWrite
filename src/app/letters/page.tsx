'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LetterCard } from '@/components/LetterCard'

export default function LettersPage() {
  const { data: session, status } = useSession()
  const [letters, setLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    fetch('/api/trpc/letter.list')
      .then((r) => r.json())
      .then((data) => {
        setLetters(data.result?.data?.json || [])
        setLoading(false)
      })
  }, [session])

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Your Letters</h1>

      {loading ? (
        <p className="text-slate-600">Loading letters...</p>
      ) : letters.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-slate-600">No letters yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Create a soul profile to start receiving letters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {letters.map((letter) => (
            <LetterCard key={letter.id} letter={letter} />
          ))}
        </div>
      )}
    </div>
  )
}
