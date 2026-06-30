'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

const MODULES = [
  { key: 'bookings',          label: 'Bookings',          desc: 'Create and manage bookings'        },
  { key: 'tickets',           label: 'Ticket Stock',      desc: 'Batch inventory and ticket sales'  },
  { key: 'clients',           label: 'Clients (CRM)',     desc: 'Client profiles and history'       },
  { key: 'groups',            label: 'Groups',            desc: 'Group bookings'                    },
  { key: 'visa',              label: 'Visa Tracker',      desc: 'Visa applications'                 },
  { key: 'invoices',          label: 'Invoices',          desc: 'Client invoices'                   },
  { key: 'suppliers',         label: 'Suppliers',         desc: 'Supplier directory'                },
  { key: 'supplier_payments', label: 'Supplier Payments', desc: 'Pay suppliers, track invoices'     },
  { key: 'ledger',            label: 'Ledger/Khata',      desc: 'Party accounts and ledger'         },
  { key: 'financial',         label: 'Financial Reports', desc: 'P&L, balance sheet, cash flow'     },
  { key: 'reports',           label: 'Reports',           desc: 'Agency performance reports'        },
  { key: 'ai_planner',        label: 'AI Planner',        desc: 'AI trip planning'                  },
  { key: 'settings',          label: 'Settings',          desc: 'Agency settings'                   },
  { key: 'staff',             label: 'Staff & Roles',     desc: 'Manage staff and permissions'      },
]

const ACTIONS = ['can_view', 'can_create', 'can_edit', 'can_delete'] as const

type Props = {
  roles:          any[]
  permissions:    any[]
  organizationId: string
}

export default function RolesEditor({ roles, permissions, organizationId }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [activeRole, setActiveRole] = useState(roles[0]?.id ?? '')
  const [saving,     setSaving]     = useState(false)

  // Build permissions map for active role
  const rolePerms = permissions.filter(p => p.role_id === activeRole)
  const permMap   = Object.fromEntries(
    rolePerms.map(p => [p.module, p])
  )

  // Local edits
  const [edits, setEdits] = useState<Record<string, Record<string, boolean>>>({})

  function getValue(module: string, action: string): boolean {
    if (edits[activeRole]?.[`${module}.${action}`] !== undefined) {
      return edits[activeRole][`${module}.${action}`]
    }
    return permMap[module]?.[action] ?? false
  }

  function toggle(module: string, action: string) {
    const current = getValue(module, action)
    setEdits(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [`${module}.${action}`]: !current,
        // If enabling create/edit/delete, auto-enable view
        ...(action !== 'can_view' && !current
          ? { [`${module}.can_view`]: true }
          : {}
        ),
        // If disabling view, disable all
        ...(action === 'can_view' && current
          ? {
              [`${module}.can_create`]: false,
              [`${module}.can_edit`]:   false,
              [`${module}.can_delete`]: false,
            }
          : {}
        ),
      }
    }))
  }

  async function savePermissions() {
    if (!edits[activeRole]) return
    setSaving(true)

    const roleEdits = edits[activeRole]

    // Group by module
    const moduleChanges: Record<string, Record<string, boolean>> = {}
    for (const [key, value] of Object.entries(roleEdits)) {
      const [module, action] = key.split('.')
      if (!moduleChanges[module]) moduleChanges[module] = {}
      moduleChanges[module][action] = value
    }

    for (const [module, changes] of Object.entries(moduleChanges)) {
      const existing = permMap[module]
      if (existing) {
        await supabase
          .from('role_permissions')
          .update({
            can_view:   getValue(module, 'can_view'),
            can_create: getValue(module, 'can_create'),
            can_edit:   getValue(module, 'can_edit'),
            can_delete: getValue(module, 'can_delete'),
            ...changes,
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('role_permissions')
          .insert({
            role_id:    activeRole,
            module,
            can_view:   getValue(module, 'can_view'),
            can_create: getValue(module, 'can_create'),
            can_edit:   getValue(module, 'can_edit'),
            can_delete: getValue(module, 'can_delete'),
            ...changes,
          })
      }
    }

    // Clear edits for this role
    setEdits(prev => ({ ...prev, [activeRole]: {} }))
    setSaving(false)
    router.refresh()
  }

  const activeRoleData = roles.find(r => r.id === activeRole)
  const hasEdits = Object.keys(edits[activeRole] ?? {}).length > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

      {/* Role list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">
          Roles
        </p>
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${
              activeRole === role.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <p className={`font-semibold text-sm ${
              activeRole === role.id ? 'text-blue-700' : 'text-gray-900'
            }`}>
              {role.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>
            {role.is_system && (
              <span className="text-xs text-gray-300 mt-1 block">System role</span>
            )}
          </button>
        ))}
      </div>

      {/* Permissions grid */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">{activeRoleData?.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeRoleData?.description}
              </p>
            </div>
            {hasEdits && (
              <button
                onClick={savePermissions}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">
                    Module
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium text-xs">
                    View
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium text-xs">
                    Create
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium text-xs">
                    Edit
                  </th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium text-xs">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MODULES.map(mod => (
                  <tr key={mod.key} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 text-sm">{mod.label}</p>
                      <p className="text-xs text-gray-400">{mod.desc}</p>
                    </td>
                    {ACTIONS.map(action => {
                      const checked = getValue(mod.key, action)
                      const isDisabled =
                        activeRoleData?.is_system && activeRoleData?.name === 'Owner'
                      return (
                        <td key={action} className="px-4 py-3 text-center">
                          <button
                            onClick={() => !isDisabled && toggle(mod.key, action)}
                            disabled={isDisabled}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition ${
                              checked
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                            } disabled:cursor-not-allowed`}
                          >
                            {checked
                              ? <Check size={14} />
                              : <X    size={14} />
                            }
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}