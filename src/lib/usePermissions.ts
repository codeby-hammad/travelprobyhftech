'use client'

import { useState, useEffect } from 'react'
import { createClient }        from '@/lib/supabase/client'
import type { UserPermissions, Module, Permission } from './permissions'

const FULL: Permission = { can_view: true, can_create: true, can_edit: true, can_delete: true }
const NONE: Permission = { can_view: false, can_create: false, can_edit: false, can_delete: false }

export function usePermissions() {
  const [perms, setPerms] = useState<UserPermissions | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_owner, role_id')
        .eq('id', user.id)
        .single()

      if (profile?.is_owner) {
        const allModules: Module[] = [
          'bookings','tickets','clients','groups','visa',
          'invoices','suppliers','ledger','financial',
          'reports','settings','staff','supplier_payments','ai_planner',
        ]
        setPerms({
          is_owner:    true,
          role_name:   'Owner',
          permissions: Object.fromEntries(allModules.map(m => [m, FULL])) as Record<Module, Permission>,
        })
        return
      }

      if (!profile?.role_id) {
        setPerms({ is_owner: false, role_name: null, permissions: {} as Record<Module, Permission> })
        return
      }

      const [{ data: role }, { data: rolePerms }] = await Promise.all([
        supabase.from('staff_roles').select('name').eq('id', profile.role_id).single(),
        supabase.from('role_permissions').select('*').eq('role_id', profile.role_id),
      ])

      setPerms({
        is_owner:  false,
        role_name: role?.name ?? null,
        permissions: Object.fromEntries(
          (rolePerms ?? []).map(p => [p.module, {
            can_view:   p.can_view,
            can_create: p.can_create,
            can_edit:   p.can_edit,
            can_delete: p.can_delete,
          }])
        ) as Record<Module, Permission>,
      })
    }
    load()
  }, [])

  function can(module: Module, action: keyof Permission = 'can_view'): boolean {
    if (!perms) return false
    if (perms.is_owner) return true
    return perms.permissions[module]?.[action] ?? false
  }

  return { perms, can, loading: perms === null }
}