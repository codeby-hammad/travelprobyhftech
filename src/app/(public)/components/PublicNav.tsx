'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, LogOut, CalendarCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ensureCustomerRow, customerInitial, type CustomerProfile } from '@/components/public/customerAuth'
import CustomerAuthModal from '@/components/public/CustomerAuthModal'

export default function PublicNav({
  orgSlug,
  orgName,
  organizationId,
}: {
  orgSlug?: string
  orgName?: string
  organizationId?: string
} = {}) {
  const supabase = createClient()
  const router = useRouter()

  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null)

  // Check auth once on mount, and keep listening so a login/logout that
  // happens elsewhere on the page (e.g. via the booking flow's own auth
  // modal) is reflected here too, without needing a full page reload
  useEffect(() => {
    if (!organizationId) {
      setCheckingAuth(false)
      return
    }

    let cancelled = false

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setCheckingAuth(false)
        return
      }
      const profile = await ensureCustomerRow(supabase, user.id, organizationId, { email: user.email })
      if (!cancelled) {
        setCustomer(profile)
        setCheckingAuth(false)
      }
    })()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setCustomer(null)
        return
      }
      const profile = await ensureCustomerRow(supabase, session.user.id, organizationId, { email: session.user.email })
      setCustomer(profile)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [organizationId])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setCustomer(null)
    setDropdownOpen(false)
    setMenuOpen(false)
    router.push(`/${orgSlug}`)
    router.refresh()
  }

  const waClasses = [
    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors',
    'bg-[#25d166]/15 text-[#25d166] border border-[#25d166]/30 hover:bg-[#25d166]/25',
  ].join(' ')

  const links = [
    { href: '#services', label: 'Services' },
    { href: '#packages', label: 'Packages' },
    { href: '#about',    label: 'About' },
    { href: '#contact',  label: 'Contact' },
  ]

  const showAccountUI = Boolean(organizationId && orgSlug) && !checkingAuth

  return (
    <nav className="bg-[#0a1628] sticky top-0 z-50 border-b border-[#c9a84c]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-[#c9a84c] to-[#e8c96a] rounded-[10px] flex items-center justify-center text-[#0a1628] font-bold text-lg shrink-0">
            H
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-[15px] sm:text-[17px] leading-tight truncate">{orgName ?? 'HAMMAD TRAVELERS'}</p>
            <p className="text-[#c9a84c] text-[10px] font-semibold tracking-widest uppercase truncate">EST. 2005 · LAHORE</p>
          </div>
        </div>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="text-white/70 hover:text-[#c9a84c] text-sm font-medium transition-colors">
              {link.label}
            </Link>
          ))}
          <Link
            href="#book"
            className="bg-[#c9a84c] text-[#0a1628] px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#e8c96a] transition-colors"
          >
            Book Now
          </Link>
          

          {/* Account area — Login/Sign up, or avatar + dropdown once logged in */}
          {showAccountUI && (
            customer ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c96a] text-[#0a1628] font-bold text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  {customerInitial(customer)}
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-black/06 py-2 z-50">
                      <p className="px-4 py-2 text-xs text-[#6b7a99] truncate border-b border-black/06 mb-1">
                        {customer.full_name || customer.email}
                      </p>
                      <Link
                        href={`/${orgSlug}/account`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1a2744] hover:bg-gray-50 transition-colors"
                      >
                        <CalendarCheck size={14} /> My Bookings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthMode('login')}
                  className="px-4 py-2 rounded-lg border border-white/25 text-white text-sm font-medium hover:border-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className="px-4 py-2 rounded-lg border border-[#c9a84c] text-[#c9a84c] text-sm font-medium hover:bg-[#c9a84c]/10 transition-colors"
                >
                  Sign up
                </button>
              </div>
            )
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white p-2 -mr-2"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Nav links — mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a1628] border-t border-[#c9a84c]/20 px-4 py-4 space-y-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-white/80 hover:text-[#c9a84c] text-sm font-medium py-2.5"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#book"
            onClick={() => setMenuOpen(false)}
            className="block text-center bg-[#c9a84c] text-[#0a1628] px-5 py-3 rounded-lg text-sm font-bold hover:bg-[#e8c96a] transition-colors mt-3"
          >
            Book Now
          </Link>
          

          {showAccountUI && (
            customer ? (
              <div className="pt-3 mt-2 border-t border-white/10 space-y-1">
                <p className="text-white/50 text-xs px-1 pb-1 truncate">{customer.full_name || customer.email}</p>
                <Link
                  href={`/${orgSlug}/account`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-white/80 hover:text-[#c9a84c] text-sm font-medium py-2.5"
                >
                  <CalendarCheck size={15} /> My Bookings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium py-2.5 text-left"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-3 mt-2 border-t border-white/10">
                <button
                  onClick={() => { setAuthMode('login'); setMenuOpen(false) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/25 text-white text-sm font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setMenuOpen(false) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#c9a84c] text-[#c9a84c] text-sm font-medium"
                >
                  Sign up
                </button>
              </div>
            )
          )}
        </div>
      )}

      {authMode && organizationId && orgSlug && (
        <CustomerAuthModal
          organizationId={organizationId}
          orgSlug={orgSlug}
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onAuthenticated={(profile) => {
            setCustomer(profile)
            setAuthMode(null)
          }}
        />
      )}
    </nav>
  )
}