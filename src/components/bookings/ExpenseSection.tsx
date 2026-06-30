'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Receipt, Plus, Trash2, ChevronDown,
  ChevronUp, CheckCircle, Clock
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { BookingExpense } from '@/types'

type Props = {
  bookingId:      string
  organizationId: string
  expenses:       (BookingExpense & { supplier?: { name: string } | null })[]
  suppliers:      { id: string; name: string; type: string }[]
  currency:       string
}

const categoryIcons: Record<string, string> = {
  flight:    '✈️',
  hotel:     '🏨',
  visa:      '🛂',
  transport: '🚌',
  guide:     '👤',
  insurance: '🛡️',
  food:      '🍽️',
  other:     '📦',
}

const emptyForm = {
  category:     'flight',
  description:  '',
  amount:       '',
  supplier_id:  '',
  is_paid:      'false',
  paid_date:    '',
  reference_no: '',
  notes:        '',
}

export default function ExpenseSection({
  bookingId,
  organizationId,
  expenses,
  suppliers,
  currency,
}: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [open,    setOpen]    = useState(expenses.length > 0)
  const [adding,  setAdding]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [form,    setForm]    = useState<Record<string, string>>(emptyForm)

  // Auto-fill description when category changes
  const descriptionHints: Record<string, string> = {
    flight:    'PIA flight KHI-JED return',
    hotel:     'Marriott Makkah — 7 nights',
    visa:      'Saudi Umrah visa fee',
    transport: 'Airport transfer + Makkah-Madinah bus',
    guide:     'Local guide Makkah ziarat',
    insurance: 'Travel insurance',
    food:      'Meals allowance',
    other:     'Miscellaneous expense',
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Auto-fill description hint when category changes
      if (name === 'category' && !prev.description) {
        next.description = descriptionHints[value] ?? ''
      }
      return next
    })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) {
      setError('Description and amount are required')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('booking_expenses').insert({
      booking_id:      bookingId,
      organization_id: organizationId,
      category:        form.category,
      description:     form.description,
      amount:          parseFloat(form.amount),
      currency,
      supplier_id:     form.supplier_id || null,
      is_paid:         form.is_paid === 'true',
      paid_date:       form.paid_date    || null,
      reference_no:    form.reference_no || null,
      notes:           form.notes        || null,
      created_by:      user!.id,
    })

    if (error) { setError(error.message); setLoading(false); return }

    setForm(emptyForm)
    setAdding(false)
    setLoading(false)
    router.refresh()
  }

  async function togglePaid(expense: BookingExpense) {
    await supabase
      .from('booking_expenses')
      .update({
        is_paid:   !expense.is_paid,
        paid_date: !expense.is_paid ? new Date().toISOString().split('T')[0] : null,
      })
      .eq('id', expense.id)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this expense?')) return
    await supabase.from('booking_expenses').delete().eq('id', id)
    router.refresh()
  }

  const totalCost   = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const paidCost    = expenses.filter(e => e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const unpaidCost  = totalCost - paidCost

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">

      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-orange-600 transition"
        >
          <Receipt size={16} />
          Expenses & costs
          <span className="text-xs text-gray-400 font-normal">
            ({expenses.length})
          </span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          onClick={() => { setAdding(true); setOpen(true) }}
          className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
        >
          <Plus size={14} /> Add expense
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">

          {/* Existing expenses */}
          {expenses.map(exp => (
            <div key={exp.id}
              className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-lg mt-0.5">
                  {categoryIcons[exp.category]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {exp.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 capitalize">{exp.category}</span>
                    {exp.supplier && (
                      <span className="text-xs text-gray-400">• {exp.supplier.name}</span>
                    )}
                    {exp.reference_no && (
                      <span className="text-xs text-gray-400">• Ref: {exp.reference_no}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(exp.amount, exp.currency)}
                  </p>
                  <button
                    onClick={() => togglePaid(exp)}
                    className={`text-xs flex items-center gap-1 mt-0.5 transition ${
                      exp.is_paid
                        ? 'text-green-600 hover:text-green-700'
                        : 'text-orange-500 hover:text-orange-600'
                    }`}
                  >
                    {exp.is_paid
                      ? <><CheckCircle size={10} /> Paid</>
                      : <><Clock size={10} /> Unpaid</>
                    }
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="text-gray-300 hover:text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Totals row */}
          {expenses.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      ✅ Paid: {formatCurrency(paidCost, currency)}
                    </span>
                    <span>
                      ⏳ Unpaid: {formatCurrency(unpaidCost, currency)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total cost</p>
                  <p className="font-bold text-orange-700">
                    {formatCurrency(totalCost, currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add expense form */}
          {adding && (
            <form onSubmit={handleAdd}
              className="border border-orange-100 rounded-xl p-4 bg-orange-50 space-y-3 mt-2">
              <p className="text-sm font-semibold text-gray-800">Add expense</p>

              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="flight">✈️ Flight</option>
                    <option value="hotel">🏨 Hotel</option>
                    <option value="visa">🛂 Visa</option>
                    <option value="transport">🚌 Transport</option>
                    <option value="guide">👤 Guide</option>
                    <option value="insurance">🛡️ Insurance</option>
                    <option value="food">🍽️ Food</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Supplier (optional)
                  </label>
                  <select
                    name="supplier_id"
                    value={form.supplier_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="">No supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="description"
                    required
                    value={form.description}
                    onChange={handleChange}
                    placeholder="e.g. PIA flight KHI-JED return"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount ({currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    required
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment status
                  </label>
                  <select
                    name="is_paid"
                    value={form.is_paid}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="false">⏳ Not paid yet</option>
                    <option value="true">✅ Already paid</option>
                  </select>
                </div>

                {form.is_paid === 'true' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Paid date
                    </label>
                    <input
                      name="paid_date"
                      type="date"
                      value={form.paid_date}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                    />
                  </div>
                )}

                <div className={form.is_paid === 'true' ? '' : 'col-span-2'}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reference no.
                  </label>
                  <input
                    name="reference_no"
                    value={form.reference_no}
                    onChange={handleChange}
                    placeholder="Receipt or invoice number"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add expense'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setError(null) }}
                  className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {expenses.length === 0 && !adding && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">No expenses added yet</p>
              <p className="text-xs text-gray-300 mt-1">
                Add flight, hotel, visa costs to calculate profit
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}