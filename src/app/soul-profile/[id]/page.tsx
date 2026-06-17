'use client'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState } from 'react'

import { UploadZone } from '@/components/UploadZone'
import { trpc } from '@/trpc/provider'

export default function SoulProfilePage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const profileId = id as string

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } =
    trpc.soulProfile.getById.useQuery(
      { id: profileId },
      { enabled: !!session && !!profileId }
    )

  const { data: allLetters = [], refetch: refetchLetters } =
    trpc.letter.list.useQuery(undefined, { enabled: !!session })

  const { data: lifeUpdates = [], refetch: refetchUpdates } =
    trpc.lifeUpdate.list.useQuery(
      { soulProfileId: profileId },
      { enabled: !!session && !!profileId }
    )

  const [updateContent, setUpdateContent] = useState('')
  const [updateImageUrl, setUpdateImageUrl] = useState('')

  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'special_date'>('weekly')
  const [dayOfWeek, setDayOfWeek] = useState(0)
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [specialDate, setSpecialDate] = useState('')

  const generateSample = trpc.letter.generateSample.useMutation({
    onSuccess: () => {
      refetchLetters()
    },
  })

  const createUpdate = trpc.lifeUpdate.create.useMutation({
    onSuccess: () => {
      setUpdateContent('')
      setUpdateImageUrl('')
      refetchUpdates()
    },
  })

  const { data: allSchedules = [], refetch: refetchSchedules } =
    trpc.schedule.list.useQuery(undefined, { enabled: !!session })

  const createSchedule = trpc.schedule.create.useMutation({
    onSuccess: () => {
      refetchSchedules()
    },
  })

  const pauseSchedule = trpc.schedule.pause.useMutation({
    onSuccess: () => refetchSchedules(),
  })

  const resumeSchedule = trpc.schedule.resume.useMutation({
    onSuccess: () => refetchSchedules(),
  })

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session) redirect('/auth/login')
  if (profileLoading) return <div className="p-8">Loading...</div>
  if (!profile) return <div className="p-8">Profile not found</div>

  const letters = allLetters.filter((l) => l.soulProfileId === profileId)
  const schedules = allSchedules.filter((s) => s.soulProfileId === profileId)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
        <p className="text-slate-600">{profile.relationship}</p>
        {profile.location && (
          <p className="mt-1 text-sm text-slate-500">
            Location: {profile.location}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <UploadZone soulProfileId={profileId} onUpload={refetchProfile} />
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Actions</h3>
            <button
              onClick={() => generateSample.mutate({ soulProfileId: profileId, tone: 'comforting' })}
              disabled={generateSample.isPending}
              className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {generateSample.isPending ? 'Generating...' : 'Generate Sample Letter'}
            </button>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Letter Schedule</h3>
            <div className="space-y-3">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'weekly' | 'monthly' | 'special_date')}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
                <option value="special_date">Special date (e.g. birthday)</option>
              </select>

              {frequency === 'weekly' && (
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              )}

              {frequency === 'monthly' && (
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              )}

              {frequency === 'special_date' && (
                <input
                  type="datetime-local"
                  value={specialDate}
                  onChange={(e) => setSpecialDate(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              )}

              <button
                onClick={() =>
                  createSchedule.mutate({
                    soulProfileId: profileId,
                    frequency,
                    dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
                    dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
                    specialDate: frequency === 'special_date' ? specialDate : undefined,
                  })
                }
                disabled={createSchedule.isPending || (frequency === 'special_date' && !specialDate)}
                className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createSchedule.isPending ? 'Saving...' : 'Add Schedule'}
              </button>
            </div>

            {schedules.length > 0 && (
              <div className="mt-4 space-y-3">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="rounded border bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-slate-700">{schedule.frequency.replace('_', ' ')}</span>
                      <span className={`rounded px-2 py-0.5 text-xs ${schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      Next: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : '—'}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {schedule.isActive ? (
                        <button
                          onClick={() => pauseSchedule.mutate({ id: schedule.id })}
                          disabled={pauseSchedule.isPending}
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => resumeSchedule.mutate({ id: schedule.id })}
                          disabled={resumeSchedule.isPending}
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                        >
                          Resume
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Personality</h3>
            {profile.personalityJson && profile.personalityJson !== '{}' ? (
              <pre className="rounded bg-slate-100 p-4 text-xs overflow-auto">
                {JSON.stringify(JSON.parse(profile.personalityJson), null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-slate-600">Upload content to extract personality.</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Life Updates</h3>
            <div className="rounded border bg-white p-4">
              <textarea
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                placeholder="Share a recent moment, thought, or photo..."
                className="w-full rounded border border-slate-300 p-3 text-sm focus:border-slate-500 focus:outline-none"
                rows={3}
              />
              <input
                type="url"
                value={updateImageUrl}
                onChange={(e) => setUpdateImageUrl(e.target.value)}
                placeholder="Optional image URL"
                className="mt-2 w-full rounded border border-slate-300 p-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <button
                onClick={() =>
                  createUpdate.mutate({
                    soulProfileId: profileId,
                    content: updateContent.trim(),
                    imageUrl: updateImageUrl.trim() || undefined,
                  })
                }
                disabled={createUpdate.isPending || !updateContent.trim()}
                className="mt-3 w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createUpdate.isPending ? 'Sharing...' : 'Share Update'}
              </button>
            </div>

            {lifeUpdates.length === 0 ? (
              <p className="text-sm text-slate-600">No life updates yet.</p>
            ) : (
              lifeUpdates.map((update) => (
                <div key={update.id} className="rounded border bg-white p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{update.content}</p>
                  {update.imageUrl && (
                    <img
                      src={update.imageUrl}
                      alt="Life update"
                      className="mt-3 max-h-48 rounded object-cover"
                    />
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(update.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Letters</h3>
            {letters.length === 0 ? (
              <p className="text-sm text-slate-600">No letters yet.</p>
            ) : (
              letters.map((letter) => (
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
    </div>
  )
}
