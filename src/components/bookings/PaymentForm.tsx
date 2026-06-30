'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

type Props = {
  bookingId:      string
  organizationId: string
  currency:       string
  balanceDue:     number
}

export default function PaymentForm({ bookingId, organizationId, currency, balanceDue }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [form, setForm] = useState({
    amount:       balanceDue.toString(),
    method:       'cash',
    reference_no: '',
    notes:        '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('payments').insert({
      booking_id:      bookingId,
      organization_id: organizationId,
      amount:          parseFloat(form.amount),
      currency,
      method:          form.method,
      status:          'completed',
      reference_no:    form.reference_no || null,
      notes:           form.notes        || null,
      created_by:      user!.id,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Record payment</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs">{error}</div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount ({currency})
          </label>
          <input
            name="amount" type="number" min="0.01" step="0.01"
            required value={form.amount} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Balance due: {formatCurrency(balanceDue, currency)}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
          <select name="method" value={form.method} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Reference no. (optional)
          </label>
          <input
            name="reference_no" value={form.reference_no} onChange={handleChange}
            placeholder="Cheque no., transaction ID..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 text-sm">
          {loading ? 'Recording...' : 'Record payment'}
        </button>
      </form>
    </div>
  )
}