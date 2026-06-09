'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UploadZone } from '@/components/UploadZone'

export default function SoulProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<any>(null)
  const [letters, setLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    const res = await fetch(`/api/trpc/soulProfile.getById?input=${encodeURIComponent(JSON.stringify({ id }))}`)
    const data = await res.json()
    setProfile(data.result?.data?.json)
    setLoading(false)
  }

  const fetchLetters = async () => {
    const res = await fetch('/api/trpc/letter.list')
    const data = await res.json()
    const allLetters = data.result?.data?.json || []
    setLetters(allLetters.filter((l: any) => l.soulProfileId === id))
  }

  const generateSample = async () => {
    const res = await fetch('/api/trpc/letter.generateSample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soulProfileId: id, tone: 'comforting' })
    })
    await res.json()
    fetchLetters()
  }

  useEffect(() => { fetchProfile() }, [id])
  useEffect(() => { fetchLetters() }, [id])

  if (loading) return <div className="p-8">Loading...</div>
  if (!profile) return <div className="p-8">Profile not found</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
        <p className="text-slate-600">{profile.relationship}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <UploadZone soulProfileId={id as string} onUpload={fetchProfile} />
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Actions</h3>
            <button
              onClick={generateSample}
              className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Generate Sample Letter
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Personality</h3>
          {profile.personalityJson && profile.personalityJson !== '{}' ? (
            <pre className="rounded bg-slate-100 p-4 text-xs overflow-auto">
              {JSON.stringify(JSON.parse(profile.personalityJson), null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-slate-600">Upload content to extract personality.</p>
          )}

          <h3 className="font-semibold text-slate-900">Letters</h3>
          {letters.length === 0 ? (
            <p className="text-sm text-slate-600">No letters yet.</p>
          ) : (
            letters.map((letter: any) => (
              <div key={letter.id} className="rounded border bg-white p-4">
                <p className="text-xs text-slate-500">{new Date(letter.createdAt).toLocaleDateString()}</p>
                <p className="mt-1 text-sm text-slate-700 line-clamp-3">{letter.content}</p>
                <p className="mt-2 text-xs text-slate-400">{letter.realityAnchor}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
