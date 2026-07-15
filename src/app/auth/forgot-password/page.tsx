'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Check Your Email</h1>
        <p className="mb-4 text-sm text-slate-600">
          If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link.
          Check your inbox and follow the instructions.
        </p>
        <p className="text-sm text-slate-600">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button
            onClick={() => { setSuccess(false); setEmail('') }}
            className="text-slate-900 underline"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm text-slate-900 underline"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Forgot Password</h1>
      <p className="mb-6 text-sm text-slate-600">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>
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
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Remember your password?{' '}
        <Link href="/auth/login" className="text-slate-900 underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
