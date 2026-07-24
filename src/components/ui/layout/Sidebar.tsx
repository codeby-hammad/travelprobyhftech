'use client'

import { useEffect, useState } from 'react'
import Link            from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { usePermissions }         from '@/lib/usePermissions'
import { createClient }           from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Calendar, Package,
  Building2, BarChart3, Settings, ShieldCheck,
  UsersRound, FileText, Sparkles, Ticket,
  UserCheck, BookOpen, TrendingUp, CreditCard,
  UserCog, LogOut, Zap, FileSignature, Inbox,
  ChevronLeft, ChevronRight
} from 'lucide-react'

type NavLink = {
  href: string
  label: string
  icon: any
  module: string | null
}

type NavGroup = {
  heading: string | null
  links: NavLink[]
}

const navGroups: NavGroup[] = [
  {
    heading: null,
    links: [
      { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, module: null },
      { href: '/dashboard/ai', label: 'AI Planner ✨', icon: Sparkles,        module: 'ai_planner' },
    ],
  },
  {
    heading: 'Bookings',
    links: [
      { href: '/dashboard/inquiries',   label: 'Inquiries 🔔',  icon: Inbox,         module: 'bookings' },
      { href: '/dashboard/bookings',    label: 'Bookings',     icon: Calendar,  module: 'bookings' },
      { href: '/dashboard/quotations',  label: 'Quotations',   icon: FileSignature, module: 'bookings' },
      { href: '/dashboard/groups',      label: 'Groups',       icon: UsersRound, module: 'groups' },
      { href: '/dashboard/clients',     label: 'Clients',      icon: Users,     module: 'clients' },
      { href: '/dashboard/packages',    label: 'Packages',     icon: Package,   module: 'bookings' },
      { href: '/dashboard/visa',        label: 'Visa Tracker', icon: ShieldCheck, module: 'visa' },
      { href: '/dashboard/hotels',      label: 'Hotels',       icon: Building2, module: 'bookings' },
    ],
  },
  {
    heading: 'Tickets',
    links: [
      { href: '/dashboard/sell-ticket', label: '⚡ Sell Ticket', icon: Zap,        module: 'tickets' },
      { href: '/dashboard/inventory',   label: 'Batch Stock',   icon: Ticket,     module: 'tickets' },
      { href: '/dashboard/subagents',   label: 'Sub-Agents',    icon: UserCheck,  module: 'tickets' },
    ],
  },
  {
    heading: 'Financial',
    links: [
      { href: '/dashboard/invoices',  label: 'Invoices',     icon: FileText,    module: 'invoices' },
      { href: '/dashboard/ledger',    label: 'Ledger/Khata', icon: BookOpen,    module: 'ledger' },
      { href: '/dashboard/financial', label: 'Financial',    icon: TrendingUp,  module: 'financial' },
    ],
  },
  {
    heading: 'Suppliers',
    links: [
      { href: '/dashboard/supplier-payments', label: 'Supplier Payments', icon: CreditCard, module: 'supplier_payments' },
      { href: '/dashboard/suppliers',         label: 'Suppliers',         icon: Building2,  module: 'suppliers' },
    ],
  },
  {
    heading: 'Management',
    links: [
      { href: '/dashboard/reports',  label: 'Reports',      icon: BarChart3, module: 'reports' },
      { href: '/dashboard/staff',    label: 'Staff & Roles', icon: UserCog,  module: 'staff' },
      { href: '/dashboard/settings', label: 'Settings',     icon: Settings, module: 'settings' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { can, perms, loading } = usePermissions()
  const supabase = createClient()

  const [org, setOrg] = useState<{ name: string; logo_url: string | null } | null>(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Restore collapsed state from a previous session
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  useEffect(() => {
    let active = true
    async function loadOrg() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization:organizations(name, logo_url)')
        .eq('id', user.id)
        .single()

      if (active && profile?.organization) {
        setOrg(profile.organization as any)
      }
    }
    loadOrg()
    return () => { active = false }
  }, [])

  useEffect(() => {
    function handleOrgUpdate(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail) {
        setOrg(detail)
        setLogoFailed(false)
      }
    }
    window.addEventListener('org-updated', handleOrgUpdate)
    return () => window.removeEventListener('org-updated', handleOrgUpdate)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleGroups = navGroups
    .map(group => ({
      ...group,
      links: group.links.filter(link =>
        link.module === null || can(link.module as any, 'can_view')
      ),
    }))
    .filter(group => group.links.length > 0)

  const orgName    = org?.name ?? 'TravelPro'
  const orgInitial = orgName.charAt(0).toUpperCase()

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 transition-all duration-200`}>

      {/* Logo */}
      <div className={`${collapsed ? 'px-2 py-2' : 'px-4 py-2.5'} border-b border-gray-100`}>
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className={`w-full flex items-center justify-center rounded-lg overflow-hidden ${collapsed ? 'max-h-8' : 'max-h-10'}`}>
            {org?.logo_url && !logoFailed ? (
              <img
                src={org.logo_url}
                alt={orgName}
                className={`w-auto object-contain ${collapsed ? 'h-8' : 'h-10'}`}
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className={`text-gray-900 font-bold ${collapsed ? 'text-sm' : 'text-lg'}`}>{orgInitial}</span>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 max-w-full">
              <span className="font-bold text-gray-900 text-xs truncate">{orgName}</span>
              {perms && (
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  perms.is_owner
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {perms.role_name ?? 'No role'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
className="flex items-center justify-center py-1 border-b border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav */}
<nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-3">
          {loading ? (
          <div className="space-y-2 px-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          visibleGroups.map((group, gi) => (
            <div key={gi}>
              {group.heading && !collapsed && (
                <p className="px-3 mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {group.heading}
                </p>
              )}
              {group.heading && collapsed && (
                <div className="mx-2 mb-1.5 border-t border-gray-100" />
              )}
              <div className="space-y-0">
                {group.links.map(link => {
                  const isActive = pathname === link.href ||
                    (link.href !== '/dashboard' && pathname.startsWith(link.href))
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={collapsed ? link.label : undefined}
                      className={`relative flex items-center rounded-lg text-sm transition-colors ${
                        collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-1.5'
                      } ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {isActive && (
                        <span className={`absolute bg-blue-600 rounded-full ${
                          collapsed
                            ? 'left-0.5 top-2 bottom-2 w-0.5'
                            : 'left-0 top-1.5 bottom-1.5 w-0.5'
                        }`} />
                      )}
                      <link.icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                      {!collapsed && <span className="truncate">{link.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Bottom — user info + logout */}
      <div className="border-t border-gray-100 p-2">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition ${
            collapsed ? 'justify-center py-2' : 'gap-2.5 px-3 py-2'
          }`}
        >
          <LogOut size={16} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  )
}