'use client'

import { useState } from 'react'

export function UploadZone({ soulProfileId, onUpload }: { soulProfileId: string; onUpload?: () => void }) {
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/trpc/upload.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soulProfileId,
          type: 'text',
          filename: filename || 'upload.txt',
          content
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)

      setSuccess('Upload successful! Personality extracted.')
      setContent('')
      setFilename('')
      onUpload?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="mb-4 font-semibold text-slate-900">Upload Memories</h3>
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-3 rounded bg-green-50 p-2 text-sm text-green-600">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Label (optional)"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste chat logs, stories, or any text that captures their voice..."
          rows={6}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload & Extract Personality'}
        </button>
      </form>
    </div>
  )
}
