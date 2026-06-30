import { createClient } from '@/lib/supabase/server'

export type Module =
  | 'bookings' | 'tickets'   | 'clients'  | 'groups'
  | 'visa'     | 'invoices'  | 'suppliers'| 'ledger'
  | 'financial'| 'reports'   | 'settings' | 'staff'
  | 'supplier_payments'      | 'ai_planner'

export type Permission = {
  can_view:   boolean
  can_create: boolean
  can_edit:   boolean
  can_delete: boolean
}

export type UserPermissions = {
  is_owner:    boolean
  role_name:   string | null
  permissions: Record<Module, Permission>
}

const FULL_ACCESS: Permission = {
  can_view:   true,
  can_create: true,
  can_edit:   true,
  can_delete: true,
}

const NO_ACCESS: Permission = {
  can_view:   false,
  can_create: false,
  can_edit:   false,
  can_delete: false,
}

export async function getUserPermissions(): Promise<UserPermissions> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      is_owner:    false,
      role_name:   null,
      permissions: {} as Record<Module, Permission>,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_owner, role_id')
    .eq('id', user.id)
    .single()

  // Owner gets full access to everything
  if (profile?.is_owner) {
    const allModules: Module[] = [
      'bookings','tickets','clients','groups','visa',
      'invoices','suppliers','ledger','financial',
      'reports','settings','staff','supplier_payments','ai_planner',
    ]
    return {
      is_owner:    true,
      role_name:   'Owner',
      permissions: Object.fromEntries(
        allModules.map(m => [m, FULL_ACCESS])
      ) as Record<Module, Permission>,
    }
  }

  // No role assigned — no access
  if (!profile?.role_id) {
    return {
      is_owner:    false,
      role_name:   null,
      permissions: {} as Record<Module, Permission>,
    }
  }

  // Fetch role and permissions
  const [{ data: role }, { data: perms }] = await Promise.all([
    supabase
      .from('staff_roles')
      .select('name')
      .eq('id', profile.role_id)
      .single(),
    supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', profile.role_id),
  ])

  const permMap = Object.fromEntries(
    (perms ?? []).map(p => [
      p.module,
      {
        can_view:   p.can_view,
        can_create: p.can_create,
        can_edit:   p.can_edit,
        can_delete: p.can_delete,
      }
    ])
  ) as Record<Module, Permission>

  return {
    is_owner:    false,
    role_name:   role?.name ?? null,
    permissions: permMap,
  }
}

export function can(
  perms: UserPermissions,
  module: Module,
  action: keyof Permission = 'can_view'
): boolean {
  if (perms.is_owner) return true
  return perms.permissions[module]?.[action] ?? false
}