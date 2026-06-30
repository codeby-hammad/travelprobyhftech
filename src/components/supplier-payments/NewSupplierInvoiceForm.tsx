'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

type Props = {
  suppliers: any[]
  bookings:  any[]
}

export default function NewSupplierInvoiceForm({ suppliers, bookings }: Props) {

  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    supplier_id:    '',
    booking_id:     '',
    invoice_number: '',
    invoice_date:   new Date().toISOString().split('T')[0],
    due_date:       '',
    service_type:   'other',
    description:    '',
    amount:         '',
    currency:       'PKR',
    notes:          '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Auto-fill description when service type changes
  function handleServiceTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const type = e.target.value
    const supplier = suppliers.find(s => s.id === form.supplier_id)
    const hints: Record<string, string> = {
      flight:    `Flight tickets — ${supplier?.name ?? ''}`,
      hotel:     `Hotel accommodation — ${supplier?.name ?? ''}`,
      visa:      `Visa processing fees — ${supplier?.name ?? ''}`,
      transport: `Transport services — ${supplier?.name ?? ''}`,
      guide:     `Guide services — ${supplier?.name ?? ''}`,
      insurance: `Travel insurance — ${supplier?.name ?? ''}`,
      other:     `Services — ${supplier?.name ?? ''}`,
    }
    setForm(prev => ({
      ...prev,
      service_type: type,
      description:  prev.description || hints[type] || '',
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.supplier_id || !form.invoice_number || !form.amount) {
      setError('Supplier, invoice number and amount are required')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile  } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    const { data: invoice, error: invError } = await supabase
      .from('supplier_invoices')
      .insert({
        organization_id: profile!.organization_id,
        supplier_id:     form.supplier_id,
        booking_id:      form.booking_id  || null,
        invoice_number:  form.invoice_number,
        invoice_date:    form.invoice_date,
        due_date:        form.due_date    || null,
        service_type:    form.service_type,
        description:     form.description,
        amount:          parseFloat(form.amount),
        currency:        form.currency,
        notes:           form.notes       || null,
        created_by:      user!.id,
      })
      .select()
      .single()

    if (invError) { setError(invError.message); setLoading(false); return }
    router.push(`/dashboard/supplier-payments/invoices/${invoice.id}`)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/supplier-payments"
          className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Add supplier invoice
          </h1>
          <p className="text-gray-500 text-sm">
            Supplier ne invoice bheja — record karein
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
            px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select name="supplier_id" required value={form.supplier_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Select supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice number <span className="text-red-500">*</span>
            </label>
            <input name="invoice_number" required value={form.invoice_number}
              onChange={handleChange}
              placeholder="e.g. PIA-2024-00123"
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500
                font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service type
            </label>
            <select name="service_type" value={form.service_type}
              onChange={handleServiceTypeChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="flight">✈️ Flight tickets</option>
              <option value="hotel">🏨 Hotel</option>
              <option value="visa">🛂 Visa</option>
              <option value="transport">🚌 Transport</option>
              <option value="guide">👤 Guide</option>
              <option value="insurance">🛡️ Insurance</option>
              <option value="other">📦 Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice date
            </label>
            <input type="date" name="invoice_date" value={form.invoice_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due date
            </label>
            <input type="date" name="due_date" value={form.due_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input type="number" min="0" name="amount" required
              value={form.amount} onChange={handleChange}
              placeholder="e.g. 2250000"
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select name="currency" value={form.currency} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option>PKR</option>
              <option>USD</option>
              <option>SAR</option>
              <option>AED</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input name="description" required value={form.description}
              onChange={handleChange}
              placeholder="e.g. 50 seats KHI-JED PIA PK-301 Ramadan 2025"
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to booking (optional)
            </label>
            <select name="booking_id" value={form.booking_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">No booking link</option>
              {bookings.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.booking_ref} — {b.client?.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={2}
              placeholder="Any special terms or notes..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500
                resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl
              font-medium hover:bg-orange-700 transition disabled:opacity-50
              text-sm">
            {loading ? 'Saving...' : 'Save invoice'}
          </button>
          <Link href="/dashboard/supplier-payments"
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm
              text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}