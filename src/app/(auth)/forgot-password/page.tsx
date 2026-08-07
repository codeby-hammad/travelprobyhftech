'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src="/travel.png" alt="logo" />
          <h2 className="mt-3 text-xl font-semibold text-gray-700">Reset your password</h2>
        </div>

        <div className="bg-white shadow rounded-xl p-8">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✉️
              </div>
              <p className="font-medium text-gray-900">Check your email</p>
              <p className="text-sm text-gray-500">
                We sent a password reset link to <strong>{email}</strong>
              </p>
              <Link href="/login" className="text-sm text-blue-600 hover:underline block mt-4">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
              <p className="text-sm text-gray-500">
                Enter your email and we'll send you a reset link.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <Link href="/login" className="block text-center text-sm text-gray-400 hover:text-gray-600">
                Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}