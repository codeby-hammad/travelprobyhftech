'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import { ensureCustomerRow, type CustomerProfile } from './customerAuth'

export type { CustomerProfile }

export default function CustomerAuthModal({
  organizationId,
  orgSlug,
  pendingPackageId,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}: {
  organizationId: string
  orgSlug: string
  pendingPackageId?: string
  initialMode?: 'login' | 'signup'
  onClose: () => void
  onAuthenticated: (customer: CustomerProfile) => void
}) {
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError

        if (!data.session) {
          // Email confirmation is required on this project, so there's no
          // active session yet — inserting into `customers` here would be
          // rejected by RLS since auth.uid() is null until they confirm.
          // Their customer row gets created automatically on first login
          // instead, since the login branch below also calls ensureCustomerRow.
          setError('Check your inbox to confirm your email, then log in to continue.')
          setLoading(false)
          return
        }

        const customer = await ensureCustomerRow(supabase, data.user!.id, organizationId, { fullName, email })
        onAuthenticated(customer)
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError

        const customer = await ensureCustomerRow(supabase, data.user.id, organizationId, { email })
        onAuthenticated(customer)
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleAuth() {
    setLoading(true)
    setError(null)

    // Preserve which package they were booking across the OAuth redirect —
    // the callback route sends them back here with ?resumeBooking=<id> so
    // the modal can reopen exactly where they left off
    if (pendingPackageId && typeof window !== 'undefined') {
      sessionStorage.setItem('umrah_pending_package_id', pendingPackageId)
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${orgSlug}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
    // On success the browser navigates away to Google, so nothing further
    // happens here — the callback route takes over from there
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-7 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-[#1a2744]/50 hover:text-[#1a2744]">
          <X size={20} />
        </button>

        <h2 className="font-playfair text-2xl font-bold text-[#1a2744] mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-[#6b7a99] text-sm mb-6">
          {mode === 'login'
            ? 'Log in to continue your Umrah booking'
            : 'Sign up to start your Umrah booking'}
        </p>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 border border-black/10 rounded-xl py-3 mb-5 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 009 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.9A9 9 0 000 9c0 1.45.35 2.83.9 4.03l3.05-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          <span className="text-sm font-medium text-[#1a2744]">Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-black/08" />
          <span className="text-xs text-[#6b7a99]">or</span>
          <div className="flex-1 h-px bg-black/08" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full border border-black/10 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c9a84c]"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full border border-black/10 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c9a84c]"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full border border-black/10 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c9a84c]"
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0a1628] hover:bg-[#162a50] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6b7a99] mt-5">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[#c9a84c] font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}