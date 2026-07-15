'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/trpc/provider'

const CHANNEL_HELP: Record<string, { label: string; webhookPlaceholder: string; secretPlaceholder: string; instructions: string }> = {
  email: {
    label: 'Email',
    webhookPlaceholder: '',
    secretPlaceholder: '',
    instructions: 'Letters will be sent to your registered email address.',
  },
  lark: {
    label: 'Feishu / Lark',
    webhookPlaceholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx',
    secretPlaceholder: 'SECxxxxx (optional)',
    instructions:
      'Create a custom bot in your Feishu group, then paste the webhook URL here. Letters will be delivered as rich cards.',
  },
  dingtalk: {
    label: 'DingTalk',
    webhookPlaceholder: 'https://oapi.dingtalk.com/robot/send?access_token=xxxxx',
    secretPlaceholder: 'SECxxxxx (optional)',
    instructions:
      'Create a custom robot in your DingTalk group, then paste the webhook URL here. Letters will be delivered as markdown messages.',
  },
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const { data: settings, isLoading } = trpc.letter.getDeliverySettings.useQuery(undefined, {
    enabled: status === 'authenticated',
  })

  const updateSettings = trpc.letter.updateDeliverySettings.useMutation({
    onSuccess: () => setSaved(true),
    onError: (err) => setError(err.message),
  })

  const [channel, setChannel] = useState('email')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (settings) {
      setChannel(settings.channel)
      setWebhookUrl(settings.webhookUrl)
      setWebhookSecret(settings.webhookSecret)
    }
  }, [settings])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    setSaved(false)
  }, [channel, webhookUrl, webhookSecret])

  if (status === 'unauthenticated') return null

  const help = CHANNEL_HELP[channel]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    updateSettings.mutate({
      channel: channel as 'email' | 'dingtalk' | 'lark',
      webhookUrl: channel !== 'email' ? webhookUrl : undefined,
      webhookSecret: channel !== 'email' && webhookSecret ? webhookSecret : undefined,
    })
  }

  const needsWebhook = channel === 'lark' || channel === 'dingtalk'

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Delivery Settings</h1>
      <p className="mb-8 text-sm text-slate-500">
        Choose how you want to receive your letters.
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Channel selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Delivery Channel
            </label>
            <div className="space-y-2">
              {Object.entries(CHANNEL_HELP).map(([value, info]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    channel === value
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="channel"
                    value={value}
                    checked={channel === value}
                    onChange={(e) => setChannel(e.target.value)}
                    className="accent-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-800">{info.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Channel instructions */}
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            {help.instructions}
          </p>

          {/* Webhook config (only for lark/dingtalk) */}
          {needsWebhook && (
            <>
              <div>
                <label
                  htmlFor="webhookUrl"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Webhook URL
                </label>
                <input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={help.webhookPlaceholder}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label
                  htmlFor="webhookSecret"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Sign Secret{' '}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="webhookSecret"
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={help.secretPlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  If your bot has signature verification enabled, enter the secret here.
                </p>
              </div>
            </>
          )}

          {/* Status messages */}
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}
          {saved && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              Settings saved successfully.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  )
}
