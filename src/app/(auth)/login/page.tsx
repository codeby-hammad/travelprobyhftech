'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Loader2, ShieldCheck, FileText, Users2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const searchParams = useSearchParams()
  const timedOut = searchParams.get('reason') === 'timeout'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* Left — brand panel (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-[#0a1e3f] via-[#123566] to-[#1e6fd9] flex-col justify-between p-12">

        {/* Decorative glow blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#2f7ff2]/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 bg-[#0a1e3f]/40 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo.png" alt="Travixa" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-black/20" />
            <span className="font-bold text-2xl tracking-tight text-white">
              TRAVI<span className="text-[#4da3ff]">X</span>A
            </span>
          </div>
          <p className="text-white/50 text-[11px] font-semibold tracking-[0.2em] uppercase pl-[60px]">
            Travel Agency Management Simplified
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-white text-3xl font-bold leading-tight max-w-sm">
            Run your whole agency from one dashboard.
          </h2>
          <div className="space-y-4">
            {[
              { icon: FileText, text: 'Bookings, vouchers & invoices in one place' },
              { icon: Users2,   text: 'Manage staff, roles & client records' },
              { icon: ShieldCheck, text: 'Every agency\u2019s data kept completely separate' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <f.icon size={16} className="text-[#4da3ff]" />
                </div>
                <span className="text-white/80 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/35 text-xs">
          © {new Date().getFullYear()} Travixa. All rights reserved.
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center bg-[#f7f9fc] px-6 py-12">
        <div className="max-w-sm w-full">

          {/* Mobile-only compact logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src="/logo.png" alt="Travixa" className="w-10 h-10 rounded-xl object-cover" />
            <span className="font-bold text-xl tracking-tight text-[#0a1e3f]">
              TRAVI<span className="text-[#1e6fd9]">X</span>A
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0a1e3f]">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              No account?{' '}
              <Link href="/register" className="text-[#1e6fd9] font-medium hover:underline">
                Register your agency
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="bg-white shadow-sm border border-gray-100 rounded-2xl p-7 space-y-5">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {timedOut && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg px-4 py-3">
                You were automatically logged out due to inactivity.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1e6fd9]/30 focus:border-[#1e6fd9] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1e6fd9]/30 focus:border-[#1e6fd9] transition-colors"
              />
            </div>

            <div className="text-right -mt-2">
              <Link href="/forgot-password" className="text-xs text-[#1e6fd9] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e6fd9] to-[#123566] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="lg:hidden text-center text-gray-400 text-xs mt-8">
            © {new Date().getFullYear()} Travixa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc]">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}