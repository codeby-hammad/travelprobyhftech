'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

type Props = {
  clients:  any[]
  bookings: any[]
}

export default function NewVisaForm({ clients, bookings }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    client_id:    '',
    booking_id:   '',
    visa_type:    'umrah',
    destination:  'Saudi Arabia',
    status:       'not_applied',
    applied_date:  '',
    expected_date: '',
    approved_date: '',
    expiry_date:   '',
    visa_number:   '',
    embassy:       '',
    fee_charged:   '0',
    fee_paid:      'false',
    notes:         '',
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

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    const { error } = await supabase.from('visa_applications').insert({
      organization_id: profile!.organization_id,
      client_id:       form.client_id,
      booking_id:      form.booking_id,
      visa_type:       form.visa_type,
      destination:     form.destination,
      status:          form.status,
      applied_date:    form.applied_date  || null,
      expected_date:   form.expected_date || null,
      approved_date:   form.approved_date || null,
      expiry_date:     form.expiry_date   || null,
      visa_number:     form.visa_number   || null,
      embassy:         form.embassy       || null,
      fee_charged:     parseFloat(form.fee_charged || '0'),
      fee_paid:        form.fee_paid === 'true',
      notes:           form.notes         || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/visa')
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/visa" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add visa application</h1>
          <p className="text-gray-500 text-sm">Track visa status for a client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Client + Booking */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b">
            Link to client & booking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select name="client_id" required value={form.client_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}{c.passport_number ? ` — ${c.passport_number}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking <span className="text-red-500">*</span>
              </label>
              <select name="booking_id" required value={form.booking_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select booking...</option>
                {bookings.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_ref} — {b.client?.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Visa info */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b">
            Visa information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visa type</label>
              <select name="visa_type" value={form.visa_type} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="umrah">Umrah</option>
                <option value="tourist">Tourist</option>
                <option value="business">Business</option>
                <option value="transit">Transit</option>
                <option value="student">Student</option>
                <option value="work">Work</option>
                <option value="multiple">Multiple entry</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input name="destination" required value={form.destination} onChange={handleChange}
                placeholder="e.g. Saudi Arabia"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current status</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Embassy</label>
              <input name="embassy" value={form.embassy} onChange={handleChange}
                placeholder="e.g. Saudi Embassy Karachi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b">
            Important dates
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'applied_date',  label: 'Applied date'  },
              { name: 'expected_date', label: 'Expected date' },
              { name: 'approved_date', label: 'Approved date' },
              { name: 'expiry_date',   label: 'Expiry date'   },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type="date" name={f.name}
                  value={(form as any)[f.name]} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Visa number + fee */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b">
            Visa number & fees
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visa number</label>
              <input name="visa_number" value={form.visa_number} onChange={handleChange}
                placeholder="e.g. SA-2024-123456"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee charged (PKR)</label>
              <input name="fee_charged" type="number" min="0"
                value={form.fee_charged} onChange={handleChange}
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            placeholder="Any additional notes about this visa application..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Saving...' : 'Save visa application'}
          </button>
          <Link href="/dashboard/visa"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}