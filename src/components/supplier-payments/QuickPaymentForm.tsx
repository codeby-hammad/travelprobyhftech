'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function QuickPaymentForm({
  suppliers,
  invoices,
}: {
  suppliers: any[]
  invoices:  any[]
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    supplier_id:         '',
    supplier_invoice_id: '',
    amount:              '',
    payment_date:        new Date().toISOString().split('T')[0],
    payment_method:      'bank_transfer',
    reference_no:        '',
    bank_name:           '',
    account_title:       '',
    account_number:      '',
    notes:               '',
    currency:            'PKR',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  
  // When invoice selected, auto-fill supplier and amount
  function handleInvoiceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const invoiceId = e.target.value
    const invoice   = invoices.find(i => i.id === invoiceId)
    setForm(prev => ({
      ...prev,
      supplier_invoice_id: invoiceId,
      supplier_id:         invoice ? prev.supplier_id || '' : prev.supplier_id,
      amount: invoice
        ? (Number(invoice.amount) - Number(invoice.paid_amount)).toString()
        : prev.amount,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.supplier_id || !form.amount) {
      setError('Supplier and amount are required')
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

    const { data: payment, error: payErr } = await supabase
      .from('supplier_payments')
      .insert({
        organization_id:     profile!.organization_id,
        supplier_id:         form.supplier_id,
        supplier_invoice_id: form.supplier_invoice_id || null,
        payment_date:        form.payment_date,
        amount:              parseFloat(form.amount),
        currency:            form.currency,
        payment_method:      form.payment_method,
        reference_no:        form.reference_no  || null,
        bank_name:           form.bank_name      || null,
        account_title:       form.account_title  || null,
        account_number:      form.account_number || null,
        notes:               form.notes          || null,
        created_by:          user!.id,
      })
      .select()
      .single()

    if (payErr) { setError(payErr.message); setLoading(false); return }

    setSuccess(`Payment ${payment.payment_number} recorded successfully!`)
    setLoading(false)
    setTimeout(() => router.push('/dashboard/supplier-payments'), 1500)
  }

  // Filter invoices by selected supplier
  const filteredInvoices = form.supplier_id
    ? invoices.filter(i => {
        const invoice = invoices.find(inv => inv.id === i.id)
        return true // We don't have supplier_id in invoices query here
      })
    : invoices

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/supplier-payments"
          className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record payment</h1>
          <p className="text-gray-500 text-sm">
            Supplier ko paisa diya — record karein
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
            px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700
            px-4 py-3 rounded-xl text-sm">
            ✓ {success}
          </div>
        )}

        <div>
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
            Against invoice (optional)
          </label>
          <select name="supplier_invoice_id"
            value={form.supplier_invoice_id}
            onChange={handleInvoiceChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">No invoice / advance payment</option>
            {invoices.map(i => (
              <option key={i.id} value={i.id}>
                {i.invoice_number} — {i.supplier?.name} —{' '}
                Balance: {formatCurrency(
                  Number(i.amount) - Number(i.paid_amount)
                )}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input type="number" min="0" name="amount" required
              value={form.amount} onChange={handleChange}
              placeholder="e.g. 500000"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment date
            </label>
            <input type="date" name="payment_date" value={form.payment_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment method
            </label>
            <select name="payment_method" value={form.payment_method}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference / transaction no.
          </label>
          <input name="reference_no" value={form.reference_no}
            onChange={handleChange}
            placeholder="Bank TRN, cheque no., IBFT ref..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-500
              font-mono" />
        </div>

        {form.payment_method === 'bank_transfer' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank name
              </label>
              <input name="bank_name" value={form.bank_name}
                onChange={handleChange}
                placeholder="e.g. HBL, MCB, Meezan"
                className="w-full border border-gray-300 rounded-xl px-3 py-2
                  text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account title
              </label>
              <input name="account_title" value={form.account_title}
                onChange={handleChange}
                placeholder="Beneficiary name"
                className="w-full border border-gray-300 rounded-xl px-3 py-2
                  text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-500
              resize-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl
              font-medium hover:bg-orange-700 transition disabled:opacity-50
              text-sm">
            {loading ? 'Recording...' : 'Record payment'}
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