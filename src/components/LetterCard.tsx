'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface LetterCardLetter {
  id: string
  content: string
  tone: string
  realityAnchor: string
  status: string
  createdAt: Date
  soulProfile?: {
    name: string
    relationship: string
  } | null
}

interface LetterCardProps {
  letter: LetterCardLetter
  onDeliver?: () => void
  isDelivering?: boolean
}

export function LetterCard({ letter, onDeliver, isDelivering }: LetterCardProps) {
  const [expanded, setExpanded] = useState(false)

  const statusVariant = letter.status === 'delivered'
    ? 'default'
    : letter.status === 'pending_review'
    ? 'secondary'
    : 'outline'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              From {letter.soulProfile?.name || 'Your Future Self'}
            </h3>
            <p className="text-xs text-slate-500">
              {new Date(letter.createdAt).toLocaleDateString()} · {letter.tone}
            </p>
          </div>
          <Badge variant={statusVariant}>{letter.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-sm text-slate-700 ${expanded ? '' : 'line-clamp-6'}`}>
          {letter.content.split('\n').map((paragraph: string, i: number) => (
            <p key={i} className="mb-3">{paragraph}</p>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Read more'}
          </Button>
          {onDeliver && letter.status !== 'delivered' && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeliver}
                disabled={isDelivering}
              >
                {isDelivering ? 'Sending...' : 'Send to email'}
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-slate-400 italic">{letter.realityAnchor}</p>
      </CardFooter>
    </Card>
  )
}
