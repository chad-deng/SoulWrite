'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!token) {
      setError('Invalid reset link. Please request a new one.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
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
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Password Reset</h1>
        <p className="mb-4 text-sm text-slate-600">
          Your password has been reset successfully.
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Sign in with new password
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Invalid Reset Link</h1>
        <p className="mb-4 text-sm text-slate-600">
          This password reset link is invalid or missing a token.
        </p>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-slate-900 underline"
        >
          Request a new reset link
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Reset Password</h1>
      <p className="mb-6 text-sm text-slate-600">
        Enter your new password below.
      </p>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        <Link href="/auth/login" className="text-slate-900 underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
