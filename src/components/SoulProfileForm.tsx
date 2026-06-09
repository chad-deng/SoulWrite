'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SoulProfileForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/trpc/soulProfile.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, relationship })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      router.push(`/soul-profile/${data.result.data.json.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700">Their Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="e.g., Grandma Rose"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Relationship</label>
        <input
          type="text"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="e.g., grandmother"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Profile'}
      </button>
    </form>
  )
}
