'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, User, Trash2 } from 'lucide-react'

type Props = {
  staff:         any[]
  roles:         any[]
  currentUserId: string
}

export default function StaffList({ staff, roles, currentUserId }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const [saving,      setSaving]      = useState<string | null>(null)
  const [confirming,  setConfirming]  = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function updateRole(profileId: string, roleId: string) {
    setSaving(profileId)
    await supabase
      .from('profiles')
      .update({ role_id: roleId || null })
      .eq('id', profileId)
    setSaving(null)
    router.refresh()
  }

  async function handleDelete(staffId: string) {
    setDeleting(staffId)
    setDeleteError(null)

    try {
      const res = await fetch('/api/staff/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete staff')

      setConfirming(null)
      router.refresh()
    } catch (err: any) {
      setDeleteError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const roleColors: Record<string, string> = {
    'Owner':          'bg-blue-50   text-blue-700',
    'Manager':        'bg-purple-50 text-purple-700',
    'Booking Agent':  'bg-green-50  text-green-700',
    'Ticketing Staff':'bg-orange-50 text-orange-700',
    'Accounts':       'bg-yellow-50 text-yellow-700',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Staff member</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Email</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Current role</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Change role</th>
            <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {staff.map((member: any) => (
            <tr key={member.id} className="hover:bg-gray-50">

              {/* Name */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {member.full_name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.full_name}</p>
                    {member.is_owner && (
                      <span className="text-xs text-blue-600 font-medium">Owner</span>
                    )}
                    {member.id === currentUserId && (
                      <span className="text-xs text-gray-400 ml-1">(you)</span>
                    )}
                  </div>
                </div>
              </td>

              {/* Email */}
              <td className="px-5 py-3 text-gray-500 text-xs">{member.email}</td>

              {/* Current role badge */}
              <td className="px-5 py-3">
                {member.is_owner ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700">
                    Owner — full access
                  </span>
                ) : member.role ? (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    roleColors[member.role.name] ?? 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role.name}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">
                    No role — no access
                  </span>
                )}
              </td>

              {/* Change role */}
              <td className="px-5 py-3">
                {member.is_owner ? (
                  <span className="text-xs text-gray-400">Cannot change owner role</span>
                ) : (
                  <select
                    value={member.role_id ?? ''}
                    disabled={saving === member.id}
                    onChange={e => updateRole(member.id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">No access</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                )}
                {saving === member.id && (
                  <span className="text-xs text-blue-500 ml-2">Saving...</span>
                )}
              </td>

              {/* Delete */}
              <td className="px-5 py-3">
                {member.is_owner || member.id === currentUserId ? (
                  <span className="text-xs text-gray-300">—</span>
                ) : confirming === member.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sure?</span>
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={deleting === member.id}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50"
                    >
                      {deleting === member.id ? 'Removing...' : 'Yes'}
                    </button>
                    <button
                      onClick={() => { setConfirming(null); setDeleteError(null) }}
                      disabled={deleting === member.id}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded"
                    >
                      No
                    </button>
                    {deleteError && (
                      <span className="text-xs text-red-500">{deleteError}</span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setConfirming(member.id); setDeleteError(null) }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove staff member"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}