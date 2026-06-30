'use client'

import Link            from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { usePermissions }         from '@/lib/usePermissions'
import { createClient }           from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Calendar, Package,
  Building2, BarChart3, Settings, ShieldCheck,
  UsersRound, FileText, Sparkles, Ticket,
  UserCheck, BookOpen, TrendingUp, CreditCard,
  UserCog, LogOut ,Zap 
} from 'lucide-react'

const allNavLinks = [
  { href: '/dashboard',                   label: 'Dashboard',         icon: LayoutDashboard, module: null                },
  { href: '/dashboard/ai',                label: 'AI Planner ✨',      icon: Sparkles,        module: 'ai_planner'        },
  { href: '/dashboard/bookings',          label: 'Bookings',          icon: Calendar,        module: 'bookings'          },
  { href: '/dashboard/sell-ticket',       label: '⚡ Sell Ticket',    icon: Zap,            module: 'tickets' },
  { href: '/dashboard/groups',            label: 'Groups',            icon: UsersRound,      module: 'groups'            },
  { href: '/dashboard/inventory',         label: 'Batch Stock',       icon: Ticket,          module: 'tickets'           },
  { href: '/dashboard/subagents',         label: 'Sub-Agents',        icon: UserCheck,       module: 'tickets'           },
  { href: '/dashboard/supplier-payments', label: 'Supplier Payments', icon: CreditCard,      module: 'supplier_payments' },
  { href: '/dashboard/ledger',            label: 'Ledger/Khata',      icon: BookOpen,        module: 'ledger'            },
  { href: '/dashboard/financial',         label: 'Financial',         icon: TrendingUp,      module: 'financial'         },
  { href: '/dashboard/visa',              label: 'Visa Tracker',      icon: ShieldCheck,     module: 'visa'              },
  { href: '/dashboard/clients',           label: 'Clients',           icon: Users,           module: 'clients'           },
  { href: '/dashboard/packages',          label: 'Packages',          icon: Package,         module: 'bookings'          },
  { href: '/dashboard/invoices',          label: 'Invoices',          icon: FileText,        module: 'invoices'          },
  { href: '/dashboard/suppliers',         label: 'Suppliers',         icon: Building2,       module: 'suppliers'         },
  { href: '/dashboard/reports',           label: 'Reports',           icon: BarChart3,       module: 'reports'           },
  { href: '/dashboard/settings',          label: 'Settings',          icon: Settings,        module: 'settings'          },
  { href: '/dashboard/staff',             label: 'Staff & Roles',     icon: UserCog,         module: 'staff'             },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { can, perms, loading } = usePermissions()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleLinks = allNavLinks.filter(link =>
    link.module === null || can(link.module as any, 'can_view')
  )

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="font-bold text-gray-900">TravelPro</span>
        </div>
        {perms && (
          <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
            perms.is_owner
              ? 'bg-blue-50 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {perms.role_name ?? 'No role'}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {loading ? (
          <div className="space-y-2 px-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          visibleLinks.map(link => {
            const isActive = pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <link.icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                {link.label}
              </Link>
            )
          })
        )}
      </nav>

      {/* Bottom — user info + logout */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}