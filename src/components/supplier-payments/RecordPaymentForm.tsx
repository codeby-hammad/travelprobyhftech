'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

type Props = {
  invoiceId:      string
  supplierId:     string
  organizationId: string
  currency:       string
  balance:        number
  supplierName:   string
}

export default function RecordPaymentForm({
  invoiceId, supplierId, organizationId,
  currency, balance, supplierName
}: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    amount:         balance.toString(),
    payment_date:   new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_no:   '',
    bank_name:      '',
    account_title:  '',
    account_number: '',
    notes:          '',
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

    const { error } = await supabase
      .from('supplier_payments')
      .insert({
        organization_id:     organizationId,
        supplier_id:         supplierId,
        supplier_invoice_id: invoiceId,
        payment_date:        form.payment_date,
        amount:              parseFloat(form.amount),
        currency,
        payment_method:      form.payment_method,
        reference_no:        form.reference_no   || null,
        bank_name:           form.bank_name       || null,
        account_title:       form.account_title   || null,
        account_number:      form.account_number  || null,
        notes:               form.notes           || null,
        created_by:          user!.id,
      })

    if (error) { setError(error.message); setLoading(false); return }
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Record payment</h2>
      <p className="text-xs text-gray-500 mb-3">
        Paying to: <span className="font-medium text-gray-700">{supplierName}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount ({currency})
          </label>
          <input type="number" min="0.01" step="0.01" name="amount"
            required value={form.amount} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <p className="text-xs text-gray-400 mt-0.5">
            Balance: {formatCurrency(balance, currency)}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Payment date
          </label>
          <input type="date" name="payment_date" value={form.payment_date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Payment method
          </label>
          <select name="payment_method" value={form.payment_method}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="bank_transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Reference / transaction no.
          </label>
          <input name="reference_no" value={form.reference_no}
            onChange={handleChange}
            placeholder="Bank TRN, cheque no..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-orange-500
              font-mono" />
        </div>

        {form.payment_method === 'bank_transfer' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Bank name
              </label>
              <input name="bank_name" value={form.bank_name}
                onChange={handleChange}
                placeholder="e.g. HBL, Meezan, MCB"
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                  text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Account title
              </label>
              <input name="account_title" value={form.account_title}
                onChange={handleChange}
                placeholder="Supplier account title"
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                  text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-orange-600 text-white py-2.5 rounded-lg
            font-medium hover:bg-orange-700 transition disabled:opacity-50
            text-sm">
          {loading ? 'Recording...' : `Pay ${formatCurrency(parseFloat(form.amount || '0'), currency)}`}
        </button>
      </form>
    </div>
  )
}