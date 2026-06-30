'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OrganizationForm({
  organization,
  isAdmin,
}: {
  organization: any
  isAdmin: boolean
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [name, setName] = useState(organization?.name ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('organizations')
      .update({ name })
      .eq('id', organization.id)

    if (error) { setError(error.message); setLoading(false); return }

    setSaved(true)
    setLoading(false)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-1">Agency settings</h2>
      <p className="text-sm text-gray-500 mb-5">
        {isAdmin ? 'Update your agency information' : 'Only agency admins can edit this'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            Agency updated successfully
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              disabled={!isAdmin} required
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${!isAdmin ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <input
              value={organization?.plan ?? 'starter'} disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed capitalize"
            />
          </div>
        </div>

        {isAdmin && (
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Saving...' : 'Save agency'}
          </button>
        )}
      </form>
    </div>
  )
}