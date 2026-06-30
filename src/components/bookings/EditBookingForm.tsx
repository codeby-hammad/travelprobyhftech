'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trash2 } from 'lucide-react'
import type { Client, Package, Booking } from '@/types'

type Props = {
  booking:  Booking
  clients:  Client[]
  packages: Package[]
}

export default function EditBookingForm({ booking, clients, packages }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [form, setForm] = useState({
    client_id:      booking.client_id      ?? '',
    package_id:     booking.package_id     ?? '',
    status:         booking.status         ?? 'inquiry',
    travel_date:    booking.travel_date    ?? '',
    return_date:    booking.return_date    ?? '',
    num_passengers: booking.num_passengers?.toString() ?? '1',
    total_amount:   booking.total_amount?.toString()   ?? '0',
    paid_amount:    booking.paid_amount?.toString()    ?? '0',
    currency:       booking.currency       ?? 'PKR',
    notes:          booking.notes          ?? '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('bookings')
      .update({
        client_id:      form.client_id,
        package_id:     form.package_id     || null,
        status:         form.status,
        travel_date:    form.travel_date    || null,
        return_date:    form.return_date    || null,
        num_passengers: parseInt(form.num_passengers),
        total_amount:   parseFloat(form.total_amount || '0'),
        currency:       form.currency,
        notes:          form.notes          || null,
      })
      .eq('id', booking.id)

    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/dashboard/bookings/${booking.id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this booking? This cannot be undone.')) return
    setDeleting(true)

    // Delete payments first (foreign key), then booking
    await supabase.from('payments').delete().eq('booking_id', booking.id)
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id)

    if (error) { setError(error.message); setDeleting(false); return }
    router.push('/dashboard/bookings')
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit booking</h1>
            <p className="text-gray-500 text-sm font-mono">{booking.booking_ref}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-2 rounded-lg text-sm transition disabled:opacity-50"
        >
          <Trash2 size={15} />
          {deleting ? 'Deleting...' : 'Delete booking'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client <span className="text-red-500">*</span>
          </label>
          <select name="client_id" required value={form.client_id} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
          <select name="package_id" value={form.package_id} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No package / custom</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.destination}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="inquiry">Inquiry</option>
              <option value="quoted">Quoted</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
            <input type="number" name="num_passengers" min="1"
              value={form.num_passengers} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Travel date</label>
            <input type="date" name="travel_date" value={form.travel_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return date</label>
            <input type="date" name="return_date" value={form.return_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total amount</label>
            <input type="number" name="total_amount" min="0"
              value={form.total_amount} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select name="currency" value={form.currency} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>PKR</option>
              <option>USD</option>
              <option>SAR</option>
              <option>AED</option>
              <option>EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Saving...' : 'Save changes'}
          </button>
          <Link href={`/dashboard/bookings/${booking.id}`}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}