'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trash2 } from 'lucide-react'
import VisaStatusBadge from './VisaStatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { VisaStatus } from '@/types'

export default function VisaDetailForm({ visa }: { visa: any }) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [form, setForm] = useState({
    status:           visa.status,
    visa_number:      visa.visa_number      ?? '',
    applied_date:     visa.applied_date     ?? '',
    expected_date:    visa.expected_date    ?? '',
    approved_date:    visa.approved_date    ?? '',
    expiry_date:      visa.expiry_date      ?? '',
    rejection_reason: visa.rejection_reason ?? '',
    fee_charged:      visa.fee_charged?.toString() ?? '0',
    fee_paid:         visa.fee_paid?.toString()    ?? 'false',
    embassy:          visa.embassy          ?? '',
    notes:            visa.notes            ?? '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const { error } = await supabase
      .from('visa_applications')
      .update({
        status:           form.status,
        visa_number:      form.visa_number      || null,
        applied_date:     form.applied_date     || null,
        expected_date:    form.expected_date    || null,
        approved_date:    form.approved_date    || null,
        expiry_date:      form.expiry_date      || null,
        rejection_reason: form.rejection_reason || null,
        fee_charged:      parseFloat(form.fee_charged || '0'),
        fee_paid:         form.fee_paid === 'true',
        embassy:          form.embassy          || null,
        notes:            form.notes            || null,
      })
      .eq('id', visa.id)

    if (error) { setError(error.message); setLoading(false); return }
    setSaved(true)
    setLoading(false)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDelete() {
    if (!confirm('Delete this visa application?')) return
    setDeleting(true)
    await supabase.from('visa_applications').delete().eq('id', visa.id)
    router.push('/dashboard/visa')
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/visa" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {visa.client?.full_name}
              </h1>
              <VisaStatusBadge status={visa.status as VisaStatus} />
            </div>
            <p className="text-gray-500 text-sm">
              {visa.visa_type} visa • {visa.destination} •{' '}
              <Link href={`/dashboard/bookings/${visa.booking_id}`}
                className="text-blue-600 hover:underline">
                {visa.booking?.booking_ref}
              </Link>
            </p>
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-1.5 text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-sm transition disabled:opacity-50">
          <Trash2 size={14} />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Client info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-blue-400">Client</p>
            <p className="font-medium text-blue-900">{visa.client?.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-blue-400">Passport</p>
            <p className="font-mono font-medium text-blue-900">
              {visa.client?.passport_number ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-400">Phone</p>
            <p className="font-medium text-blue-900">{visa.client?.phone ?? '—'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            Visa application updated
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="not_applied">Not applied</option>
              <option value="documents_collecting">Collecting documents</option>
              <option value="applied">Applied</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visa number</label>
            <input name="visa_number" value={form.visa_number} onChange={handleChange}
              placeholder="e.g. SA-2024-123456"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'applied_date',  label: 'Applied'  },
            { name: 'expected_date', label: 'Expected' },
            { name: 'approved_date', label: 'Approved' },
            { name: 'expiry_date',   label: 'Expiry'   },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type="date" name={f.name}
                value={(form as any)[f.name]} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
        </div>

        {form.status === 'rejected' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection reason</label>
            <input name="rejection_reason" value={form.rejection_reason} onChange={handleChange}
              placeholder="Reason for rejection..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Embassy</label>
            <input name="embassy" value={form.embassy} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee (PKR)</label>
            <input name="fee_charged" type="number" value={form.fee_charged} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee paid?</label>
            <select name="fee_paid" value={form.fee_paid} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="false">Not paid</option>
              <option value="true">Paid ✓</option>
            </select>
          </div>
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
    </>
  )
}