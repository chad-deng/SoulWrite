'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

import { trpc } from '@/trpc/provider'

export default function FutureSelfPage() {
  const { data: session, status } = useSession()
  const { data: letters = [], isLoading } = trpc.futureLetter.list.useQuery(undefined, {
    enabled: !!session,
  })

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Letters to Your Future Self</h1>
        <Link
          href="/future-self/write"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Write a Letter
        </Link>
      </div>

      {isLoading ? (
        <p className="text-slate-600">Loading...</p>
      ) : letters.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-slate-600">No letters written yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Write a letter to your future self and choose when to receive it.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map((letter) => (
            <div key={letter.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Delivery: {new Date(letter.deliverAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {letter.isDelivered ? 'Delivered' : 'Scheduled'}
                  </p>
                </div>
                <span className={`rounded px-2 py-1 text-xs ${
                  letter.isDelivered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {letter.isDelivered ? 'Delivered' : 'Pending'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700 line-clamp-2">{letter.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
