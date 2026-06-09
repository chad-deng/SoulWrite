'use client'

import { useState } from 'react'

export function LetterCard({ letter }: { letter: any }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            From {letter.soulProfile?.name || 'Your Future Self'}
          </h3>
          <p className="text-xs text-slate-500">
            {new Date(letter.createdAt).toLocaleDateString()} · {letter.tone}
          </p>
        </div>
        <span className={`rounded px-2 py-1 text-xs ${
          letter.status === 'delivered' ? 'bg-green-100 text-green-700' :
          letter.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {letter.status}
        </span>
      </div>

      <div className={`text-sm text-slate-700 ${expanded ? '' : 'line-clamp-6'}`}>
        {letter.content.split('\n').map((paragraph: string, i: number) => (
          <p key={i} className="mb-3">{paragraph}</p>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
        <p className="text-xs text-slate-400 italic">{letter.realityAnchor}</p>
      </div>
    </div>
  )
}
