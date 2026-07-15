'use client'

interface PersonalityData {
  communicationStyle?: {
    tone?: string
    sentenceStructure?: string
    vocabularyLevel?: string
  }
  commonPhrases?: string[]
  frequentTopics?: string[]
  relationshipDynamics?: {
    affectionLevel?: string
    communicationPattern?: string
    insideJokes?: string[]
  }
  values?: string[]
  emotionalPatterns?: {
    showsCare?: string
    handlesStress?: string
    sharesJoy?: string
  }
  memories?: string[]
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span>{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
      {label}
    </span>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  if (!value || value === 'unknown') return null
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-800 capitalize">{value}</span>
    </div>
  )
}

export function PersonalityCard({ personalityJson }: { personalityJson: string }) {
  if (!personalityJson || personalityJson === '{}') {
    return (
      <p className="text-sm text-slate-500">Upload content to extract personality.</p>
    )
  }

  let data: PersonalityData
  try {
    data = JSON.parse(personalityJson) as PersonalityData
  } catch {
    return (
      <p className="text-sm text-red-500">Failed to parse personality data.</p>
    )
  }

  const hasCommunication = data.communicationStyle &&
    (data.communicationStyle.tone || data.communicationStyle.sentenceStructure || data.communicationStyle.vocabularyLevel)

  const hasRelationship = data.relationshipDynamics &&
    (data.relationshipDynamics.affectionLevel || data.relationshipDynamics.communicationPattern)

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Communication Style */}
      {hasCommunication && (
        <Section title="Communication Style" icon="💬">
          <div className="space-y-0.5">
            <StatRow label="Tone" value={data.communicationStyle!.tone ?? ''} />
            <StatRow label="Sentence structure" value={data.communicationStyle!.sentenceStructure ?? ''} />
            <StatRow label="Vocabulary" value={data.communicationStyle!.vocabularyLevel ?? ''} />
          </div>
        </Section>
      )}

      {/* Relationship Dynamics */}
      {hasRelationship && (
        <Section title="Relationship" icon="🤝">
          <div className="space-y-0.5">
            <StatRow label="Affection" value={data.relationshipDynamics!.affectionLevel ?? ''} />
            <StatRow label="Pattern" value={data.relationshipDynamics!.communicationPattern ?? ''} />
          </div>
          {data.relationshipDynamics!.insideJokes && data.relationshipDynamics!.insideJokes.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-xs text-slate-500">Inside jokes</p>
              <div className="flex flex-wrap gap-1">
                {data.relationshipDynamics!.insideJokes.map((joke, i) => (
                  <Tag key={i} label={joke} />
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Emotional Patterns */}
      {data.emotionalPatterns && (
        <Section title="Emotional Patterns" icon="❤️">
          <div className="space-y-0.5">
            <StatRow label="Shows care" value={data.emotionalPatterns.showsCare ?? ''} />
            <StatRow label="Handles stress" value={data.emotionalPatterns.handlesStress ?? ''} />
            <StatRow label="Shares joy" value={data.emotionalPatterns.sharesJoy ?? ''} />
          </div>
        </Section>
      )}

      {/* Values */}
      {data.values && data.values.length > 0 && (
        <Section title="Values" icon="⭐">
          <div className="flex flex-wrap gap-1.5">
            {data.values.map((v, i) => (
              <Tag key={i} label={v} />
            ))}
          </div>
        </Section>
      )}

      {/* Frequent Topics */}
      {data.frequentTopics && data.frequentTopics.length > 0 && (
        <Section title="Frequent Topics" icon="📌">
          <div className="flex flex-wrap gap-1.5">
            {data.frequentTopics.map((t, i) => (
              <Tag key={i} label={t} />
            ))}
          </div>
        </Section>
      )}

      {/* Common Phrases */}
      {data.commonPhrases && data.commonPhrases.length > 0 && (
        <Section title="Common Phrases" icon="🗨️">
          <ul className="space-y-1">
            {data.commonPhrases.map((p, i) => (
              <li key={i} className="text-xs text-slate-700 italic">&ldquo;{p}&rdquo;</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Memories */}
      {data.memories && data.memories.length > 0 && (
        <Section title="Memories" icon="📸">
          <ul className="space-y-1">
            {data.memories.map((m, i) => (
              <li key={i} className="text-xs text-slate-700">{m}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
