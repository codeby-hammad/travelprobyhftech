'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export default function TeamSection({
  members,
  currentUserId,
  orgId,
}: {
  members:       any[]
  currentUserId: string
  orgId:         string | undefined
}) {
  const router = useRouter()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState('agent')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const res  = await fetch('/api/team/invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: inviteEmail, role: inviteRole, orgId }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error); setLoading(false); return }

    if (data.emailSent) {
      setSuccess(`Account created and email sent to ${inviteEmail}`)
    } else {
      setSuccess(`Account created but EMAIL FAILED. Temp password: ${data.tempPassword ?? '(check server logs)'}`)
    }

    setInviteEmail('')
    setShowInvite(false)
    setLoading(false)
    router.refresh()
  }

  const roleColors: Record<string, string> = {
    agency_admin: 'bg-purple-50 text-purple-700',
    agent:        'bg-blue-50   text-blue-700',
    accountant:   'bg-green-50  text-green-700',
    super_admin:  'bg-red-50    text-red-700',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-gray-900">Team members</h2>
          <p className="text-sm text-gray-500">{members.length} members</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Invite member
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>
      )}

      {/* Invite form */}
      {showInvite && (
        <form onSubmit={handleInvite} className="bg-gray-50 rounded-lg p-4 mb-5 space-y-3">
          <p className="text-sm font-medium text-gray-700">Invite a new team member</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="email" required value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@agency.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="agent">Agent</option>
              <option value="accountant">Accountant</option>
              <option value="agency_admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Sending...' : 'Send invite'}
            </button>
            <button type="button" onClick={() => setShowInvite(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Members list */}
      <div className="divide-y divide-gray-50">
        {members.map(member => (
          <div key={member.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                {member.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.full_name}
                  {member.id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                {member.role.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-400 hidden md:block">
                Joined {formatDate(member.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}