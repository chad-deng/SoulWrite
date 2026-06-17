'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

import { trpc } from '@/trpc/provider'

export default function WriteFutureSelfPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [deliverAt, setDeliverAt] = useState('')
  const [error, setError] = useState('')

  const createLetter = trpc.futureLetter.create.useMutation({
    onSuccess: () => {
      router.push('/future-self')
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !deliverAt) return

    setError('')
    createLetter.mutate({ content: content.trim(), deliverAt: deliverAt })
  }

  const defaultDate = new Date()
  defaultDate.setFullYear(defaultDate.getFullYear() + 1)
  const defaultDateStr = defaultDate.toISOString().slice(0, 16)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Write to Your Future Self</h1>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Your Letter</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dear future me..."
            rows={12}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Deliver On</label>
          <input
            type="datetime-local"
            value={deliverAt || defaultDateStr}
            onChange={(e) => setDeliverAt(e.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={createLetter.isPending || !content.trim()}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {createLetter.isPending ? 'Saving...' : 'Schedule Letter'}
        </button>
      </form>
    </div>
  )
}
