import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold text-slate-900">
        Letters from the ones you miss
      </h1>
      <p className="mb-8 text-lg text-slate-600">
        GhostWrite uses AI to capture the voice of your loved ones and continue
        the conversation — with care, memory, and a gentle reality anchor.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/auth/register"
          className="rounded bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Get Started
        </Link>
        <Link
          href="/future-self"
          className="rounded border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Write to Your Future Self
        </Link>
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-semibold text-slate-900">Upload Memories</h3>
          <p className="text-sm text-slate-600">
            Share chat logs, photos, and stories. We build a personality model that
            captures their unique voice.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-semibold text-slate-900">Receive Letters</h3>
          <p className="text-sm text-slate-600">
            Choose how often — weekly, monthly, or on special dates. Each letter
            sounds like them, with shared memories and warmth.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-semibold text-slate-900">Always Anchored</h3>
          <p className="text-sm text-slate-600">
            Every letter ends with a reality anchor, ensuring you never forget:
            this is AI keeping their memory alive.
          </p>
        </div>
      </div>
    </div>
  )
}
