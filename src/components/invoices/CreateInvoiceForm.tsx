'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type LineItem = {
  description: string
  quantity:    string
  unit_price:  string
}

export default function CreateInvoiceForm({
  bookings,
  preselectedBooking,
}: {
  bookings:            any[]
  preselectedBooking:  any
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [form, setForm] = useState({
    booking_id: preselectedBooking?.id ?? '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date:   '',
    currency:   preselectedBooking?.currency ?? 'PKR',
    tax_rate:   '0',
    discount:   '0',
    notes:      '',
    terms:      'Payment is due within 7 days of invoice date.',
  })

  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: '1', unit_price: '' }
  ])

  // When booking selected, auto-populate items
  useEffect(() => {
    if (preselectedBooking) {
      const booking = preselectedBooking
      const autoItems: LineItem[] = []

      if (booking.package?.name) {
        autoItems.push({
          description: booking.package.name,
          quantity:    booking.num_passengers?.toString() ?? '1',
          unit_price:  (booking.total_amount / (booking.num_passengers ?? 1)).toFixed(0),
        })
      } else {
        autoItems.push({
          description: 'Travel package',
          quantity:    '1',
          unit_price:  booking.total_amount?.toString() ?? '',
        })
      }

      setItems(autoItems)
      setForm(prev => ({
        ...prev,
        booking_id: booking.id,
        currency:   booking.currency ?? 'PKR',
      }))
    }
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // Calculate totals
  const subtotal  = items.reduce((s, item) => {
    return s + (parseFloat(item.quantity || '0') * parseFloat(item.unit_price || '0'))
  }, 0)
  const discount   = parseFloat(form.discount  || '0')
  const taxRate    = parseFloat(form.tax_rate  || '0')
  const taxAmount  = ((subtotal - discount) * taxRate) / 100
  const total      = subtotal - discount + taxAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.booking_id) { setError('Please select a booking'); return }
    if (items.some(i => !i.description || !i.unit_price)) {
      setError('Please fill in all line items')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    // Create invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        organization_id: profile!.organization_id,
        booking_id:      form.booking_id,
        issue_date:      form.issue_date,
        due_date:        form.due_date   || null,
        currency:        form.currency,
        subtotal,
        discount,
        tax_rate:        taxRate,
        tax_amount:      taxAmount,
        total,
        notes:           form.notes     || null,
        terms:           form.terms     || null,
        created_by:      user!.id,
      })
      .select()
      .single()

    if (invError) { setError(invError.message); setLoading(false); return }

    // Create line items
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(
        items.map(item => ({
          invoice_id:  invoice.id,
          description: item.description,
          quantity:    parseInt(item.quantity || '1'),
          unit_price:  parseFloat(item.unit_price || '0'),
        }))
      )

    if (itemsError) { setError(itemsError.message); setLoading(false); return }

    router.push(`/dashboard/invoices/${invoice.id}`)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/invoices" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create invoice</h1>
          <p className="text-gray-500 text-sm">Generate a professional invoice for a booking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Invoice details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking <span className="text-red-500">*</span>
              </label>
              <select name="booking_id" value={form.booking_id} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select booking...</option>
                {bookings.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_ref} — {b.client?.full_name} ({formatCurrency(b.total_amount, b.currency)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue date</label>
              <input type="date" name="issue_date" value={form.issue_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input type="date" name="due_date" value={form.due_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select name="currency" value={form.currency} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>PKR</option>
                <option>USD</option>
                <option>SAR</option>
                <option>AED</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax rate (%)</label>
              <input type="number" name="tax_rate" min="0" max="100" step="0.1"
                value={form.tax_rate} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Line items</h2>
            <button type="button"
              onClick={() => setItems(prev => [...prev, { description: '', quantity: '1', unit_price: '' }])}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus size={14} /> Add item
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-gray-500 px-1">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-3">Unit price</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <input
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    placeholder="e.g. Umrah package — 10 nights"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <input type="number" min="1"
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>
                <div className="col-span-3">
                  <input type="number" min="0"
                    value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1 text-right">
                  {items.length > 1 && (
                    <button type="button"
                      onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, form.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Discount</span>
              <div className="flex items-center gap-2">
                <input type="number" min="0" name="discount"
                  value={form.discount} onChange={handleChange}
                  className="w-28 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount, form.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{formatCurrency(total, form.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes & terms */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Notes & terms</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              placeholder="Any additional notes for the client..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment terms</label>
            <textarea name="terms" value={form.terms} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Creating...' : 'Create invoice'}
          </button>
          <Link href="/dashboard/invoices"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}