'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import {
  Loader2, Mail, Lock, Eye, EyeOff, AlertCircle,
} from 'lucide-react'

const REMEMBERED_EMAIL_KEY = 'travixa_remembered_email'

function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [mounted, setMounted]   = useState(false)
  const searchParams = useSearchParams()
  const timedOut = searchParams.get('reason') === 'timeout'

  useEffect(() => {
    const remembered = window.localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
    setMounted(true)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message
      )
      setLoading(false)
      return
    }

    if (rememberMe) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10 bg-[#0d1b3d]">

      {/* Sunset sky */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3a5aa8_0%,_#1a2a5e_35%,_#0d1230_70%,_#070b1a_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,_rgba(255,177,109,0.35)_0%,_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_75%,_rgba(77,163,255,0.18)_0%,_transparent_50%)]" />

      {/* Sun glow */}
      <div className="absolute top-[12%] right-[18%] w-40 h-40 rounded-full bg-gradient-to-br from-[#ffcf8a] to-[#ff9d5c] blur-2xl opacity-70" />

      {/* Stars */}
      <div className="absolute inset-0 opacity-70" style={{
        backgroundImage: 'radial-gradient(1px 1px at 20% 20%, white, transparent), radial-gradient(1px 1px at 60% 10%, white, transparent), radial-gradient(1px 1px at 80% 25%, white, transparent), radial-gradient(1px 1px at 35% 35%, white, transparent), radial-gradient(1px 1px at 90% 15%, white, transparent), radial-gradient(1px 1px at 10% 45%, white, transparent), radial-gradient(1px 1px at 50% 8%, white, transparent)',
        backgroundSize: '100% 60%',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Soft clouds */}
      <div className="absolute bottom-[38%] left-[-5%] w-72 h-20 bg-white/[0.06] rounded-full blur-2xl" />
      <div className="absolute bottom-[30%] left-[8%] w-96 h-24 bg-white/[0.05] rounded-full blur-3xl" />
      <div className="absolute bottom-[45%] right-[-8%] w-80 h-24 bg-white/[0.05] rounded-full blur-3xl" />

      {/* Flight path with plane */}
      <svg className="absolute top-[18%] left-0 w-full h-72 opacity-60" viewBox="0 0 1000 200" fill="none">
        <path
          d="M -40 160 C 180 160, 260 40, 480 40 S 780 70, 1040 -10"
          stroke="#ffd9a8"
          strokeWidth="1.5"
          strokeDasharray="5 9"
          fill="none"
        />
        <g transform="translate(478, 38) rotate(-18)">
          <path d="M0 0 L14 -3 L34 -1 L14 3 Z" fill="#ffe4bf" />
          <path d="M10 -1 L4 -9 L8 -9 L16 -1 Z" fill="#ffe4bf" />
          <path d="M10 1 L4 9 L8 9 L16 1 Z" fill="#ffe4bf" />
        </g>
      </svg>

      {/* City / mountain skyline silhouette */}
      <svg className="absolute bottom-0 left-0 w-full h-40 sm:h-48" viewBox="0 0 1440 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 120 L60 120 L60 90 L100 90 L100 130 L160 130 L160 60 L200 60 L200 100 L260 100 L260 140 L320 140 L320 80 L360 80 L360 40 L400 40 L400 110 L460 110 L460 150 L520 150 L520 70 L580 70 L580 120 L640 120 L640 50 L690 50 L690 100 L760 100 L760 140 L820 140 L820 90 L880 90 L880 130 L940 130 L940 60 L1000 60 L1000 110 L1060 110 L1060 145 L1120 145 L1120 85 L1180 85 L1180 125 L1240 125 L1240 70 L1300 70 L1300 115 L1360 115 L1360 150 L1440 150 L1440 200 Z"
          fill="#070b1a"
        />
      </svg>

      {/* Glass login card */}
      <div className={`relative z-10 w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        <div className="flex flex-col items-center mb-7">
          <img src="/travelbg.png" />
          
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/40 rounded-2xl p-7 space-y-5"
        >
          <div className="text-center mb-1">
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-white/60 mt-1">
              No account on Travixa?{' '}
              <Link href="/register" className="text-[#ffb96d] font-medium hover:underline">
                Register your agency today!
              </Link>
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/15 border border-red-400/30 text-red-100 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {timedOut && (
            <div className="bg-orange-500/15 border border-orange-400/30 text-orange-100 text-sm rounded-lg px-4 py-3">
              You were automatically logged out due to inactivity.
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[#ffb96d]/40 focus:border-[#ffb96d]/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[#ffb96d]/40 focus:border-[#ffb96d]/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between -mt-2">
            <label className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="accent-[#ffb96d] w-3.5 h-3.5"
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-xs text-[#ffb96d] hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff9d5c] to-[#ff7a45] text-[#1a1030] py-3 rounded-lg font-bold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Travixa. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0d1b3d]">
        <Loader2 size={20} className="animate-spin text-white/40" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}