'use client'

import { useState, useRef } from 'react'

import { trpc } from '@/trpc/provider'
import { useFileUpload } from '@/hooks/useFileUpload'

export function UploadZone({ soulProfileId, onUpload }: { soulProfileId: string; onUpload?: () => void }) {
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { uploadFile, isUploading: isFileUploading, error: fileError } = useFileUpload()

  const upload = trpc.upload.create.useMutation({
    onSuccess: () => {
      setSuccess('Upload successful! Personality extracted.')
      setContent('')
      setFilename('')
      setPreview(null)
      onUpload?.()
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')

    try {
      const result = await uploadFile(file)
      setPreview({ url: result.url, type: result.contentType })

      upload.mutate({
        soulProfileId,
        type: result.contentType.startsWith('video/') ? 'audio_transcript' : 'photo',
        filename: file.name,
        content: `[Media file: ${file.name}]\nURL: ${result.url}\nType: ${result.contentType}`,
      })
    } catch {
      setError(fileError || 'File upload failed')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setError('')
    setSuccess('')

    upload.mutate({
      soulProfileId,
      type: 'text',
      filename: filename || 'upload.txt',
      content: content.trim(),
    })
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="mb-4 font-semibold text-slate-900">Upload Memories</h3>
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-3 rounded bg-green-50 p-2 text-sm text-green-600">{success}</p>}

      {/* File upload section */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Upload Image or Video
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isFileUploading}
          className="w-full rounded-lg border-2 border-dashed border-slate-300 p-4 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
        >
          {isFileUploading ? 'Uploading...' : 'Click to select image or video'}
        </button>
        <p className="mt-1 text-xs text-slate-400">JPEG, PNG, GIF, WebP, MP4, WebM, MOV (max 50MB)</p>

        {preview && (
          <div className="mt-3">
            {preview.type.startsWith('video/') ? (
              <video
                src={preview.url}
                controls
                className="max-h-48 rounded-lg"
              />
            ) : (
              <img
                src={preview.url}
                alt="Preview"
                className="max-h-48 rounded-lg object-cover"
              />
            )}
          </div>
        )}
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-slate-400">OR paste text</span>
        </div>
      </div>

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
          rows={4}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={upload.isPending || !content.trim()}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {upload.isPending ? 'Extracting...' : 'Upload & Extract Personality'}
        </button>
      </form>
    </div>
  )
}
