import { getUserPermissions, can } from '@/lib/permissions'
import { redirect }                from 'next/navigation'

type Module =
  | 'bookings' | 'tickets'  | 'clients'  | 'groups'
  | 'visa'     | 'invoices' | 'suppliers'| 'supplier_payments'
  | 'ledger'   | 'financial'| 'reports'  | 'ai_planner'
  | 'settings' | 'staff'

type Action = 'can_view' | 'can_create' | 'can_edit' | 'can_delete'

export async function requirePermission(module: Module, action: Action = 'can_view') {
  const perms = await getUserPermissions()

  // Owners always have access
  if (perms?.is_owner) return perms

  // Check permission
  if (!can(perms, module, action)) {
    redirect('/dashboard?error=unauthorized')
  }

  return perms
}