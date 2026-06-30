'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import type { Client } from '@/types'

export default function EditClientForm({ client }: { client: Client }) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name:       client.full_name       ?? '',
    email:           client.email           ?? '',
    phone:           client.phone           ?? '',
    nationality:     client.nationality     ?? '',
    passport_number: client.passport_number ?? '',
    passport_expiry: client.passport_expiry ?? '',
    date_of_birth:   client.date_of_birth   ?? '',
    address:         client.address         ?? '',
    notes:           client.notes           ?? '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const { error } = await supabase
      .from('clients')
      .update({
        full_name:       form.full_name,
        email:           form.email           || null,
        phone:           form.phone           || null,
        nationality:     form.nationality     || null,
        passport_number: form.passport_number || null,
        passport_expiry: form.passport_expiry || null,
        date_of_birth:   form.date_of_birth   || null,
        address:         form.address         || null,
        notes:           form.notes           || null,
      })
      .eq('id', client.id)

    if (error) { setError(error.message); setLoading(false); return }

    setSaved(true)
    setLoading(false)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDelete() {
    if (!confirm(`Delete ${client.full_name}? This cannot be undone.`)) return
    setDeleting(true)

    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (error) { setError(error.message); setDeleting(false); return }

    router.push('/dashboard/clients')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900">Client details</h2>
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-1.5 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg text-sm transition disabled:opacity-50">
          <Trash2 size={14} />
          {deleting ? 'Deleting...' : 'Delete client'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            Client updated successfully
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b">
            Personal info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input name="full_name" required value={form.full_name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              <input name="nationality" value={form.nationality} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
              <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b">
            Passport
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passport number</label>
              <input name="passport_number" value={form.passport_number} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
              <input name="passport_expiry" type="date" value={form.passport_expiry} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input name="address" value={form.address} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <button type="submit" disabled={loading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}