'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function NewAccountPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [form, setForm] = useState({
    code:            '',
    name:            '',
    type:            'asset',
    sub_type:        '',
    opening_balance: '0',
    notes:           '',
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
    const { data: profile  } = await supabase
      .from('profiles').select('organization_id').eq('id', user!.id).single()

    const { error } = await supabase.from('accounts').insert({
      organization_id: profile!.organization_id,
      code:            form.code,
      name:            form.name,
      type:            form.type,
      sub_type:        form.sub_type        || null,
      opening_balance: parseFloat(form.opening_balance || '0'),
      notes:           form.notes           || null,
      is_system:       false,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/accounts')
    router.refresh()
  }

  const subTypes: Record<string, string[]> = {
    asset:     ['cash','bank','receivable','inventory','fixed_asset','other'],
    liability: ['payable','advance','loan','other'],
    equity:    ['capital','retained_earnings','other'],
    income:    ['sales','commission','fees','other'],
    expense:   ['cogs','operating','salary','rent','other'],
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/accounts" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add account</h1>
      </div>

      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account code <span className="text-red-500">*</span>
            </label>
            <input name="code" required value={form.code} onChange={handleChange}
              placeholder="e.g. 1005"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account type <span className="text-red-500">*</span>
            </label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account name <span className="text-red-500">*</span>
          </label>
          <input name="name" required value={form.name} onChange={handleChange}
            placeholder="e.g. Petty cash"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub type</label>
            <select name="sub_type" value={form.sub_type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select...</option>
              {(subTypes[form.type] ?? []).map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening balance (PKR)
            </label>
            <input type="number" min="0" name="opening_balance"
              value={form.opening_balance} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Saving...' : 'Add account'}
          </button>
          <Link href="/dashboard/accounts"
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}