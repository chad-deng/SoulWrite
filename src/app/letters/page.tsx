'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { LetterCard } from '@/components/LetterCard'
import { trpc } from '@/trpc/provider'

export default function LettersPage() {
  const { data: session, status } = useSession()
  const { data: letters = [], isLoading, refetch: refetchLetters } = trpc.letter.list.useQuery(undefined, {
    enabled: !!session,
  })

  const deliverLetter = trpc.letter.deliver.useMutation({
    onSuccess: () => {
      refetchLetters()
    },
  })

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Your Letters</h1>

      {isLoading ? (
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
            <LetterCard
              key={letter.id}
              letter={letter}
              onDeliver={() => deliverLetter.mutate({ id: letter.id })}
              isDelivering={deliverLetter.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
