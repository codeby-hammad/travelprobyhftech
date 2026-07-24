import { redirect }           from 'next/navigation'
import { headers }            from 'next/headers'
import { createClient }       from '@/lib/supabase/server'
import Sidebar                from '@/components/ui/layout/Sidebar'
import SessionTimeoutProvider from '@/components/auth/SessionTimeoutProvider'
import UnauthorizedToast      from '@/components/ui/UnauthorizedToast'

// Map route prefixes to required permission modules
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard/financial':          'financial',
  '/dashboard/ledger':             'ledger',
  '/dashboard/inventory':          'tickets',
  '/dashboard/sell-ticket':        'tickets',
  '/dashboard/subagents':          'tickets',
  '/dashboard/supplier-payments':  'supplier_payments',
  '/dashboard/suppliers':          'suppliers',
  '/dashboard/staff':              'staff',
  '/dashboard/settings':           'settings',
  '/dashboard/reports':            'reports',
  '/dashboard/bookings':           'bookings',
  '/dashboard/quotations':         'bookings',
  '/dashboard/packages':           'bookings',
  '/dashboard/groups':             'groups',
  '/dashboard/clients':            'clients',
  '/dashboard/visa':               'visa',
  '/dashboard/invoices':           'invoices',
  '/dashboard/inquiries':          'bookings',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get profile + role permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*), role:staff_roles(name, role_permissions(*))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.must_change_password) redirect('/force-password-change')

  // Get current path from headers
  const headersList = await headers()
  const pathname    = headersList.get('x-invoke-path') ?? headersList.get('x-pathname') ?? ''

  // Only check permissions for non-owner staff
  if (!profile.is_owner) {
    // Find which module this route requires
    const requiredModule = Object.entries(ROUTE_PERMISSIONS)
      .find(([route]) => pathname.startsWith(route))?.[1]

    if (requiredModule) {
      // Check if this role has can_view on the required module
      const permissions = profile.role?.role_permissions ?? []
      const hasPerm = permissions.some(
        (p: any) => p.module === requiredModule && p.can_view === true
      )

      if (!hasPerm) {
        redirect('/dashboard?error=unauthorized')
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">
        <SessionTimeoutProvider>
          <UnauthorizedToast />
          {children}
        </SessionTimeoutProvider>
      </main>
    </div>
  )
}