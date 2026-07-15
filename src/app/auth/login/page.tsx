'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      await router.push('/dashboard')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Sign In</h1>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-slate-600 hover:text-slate-900">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-slate-900 underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
