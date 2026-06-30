'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

type Props = {
  clients:   any[]
  subAgents: any[]
  suppliers: any[]
}

export default function ManualEntryForm({ clients, subAgents, suppliers }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    entry_date:   new Date().toISOString().split('T')[0],
    description:  '',
    party_type:   'client',
    party_id:     '',
    entry_type:   'debit',
    amount:       '',
    currency:     'PKR',
    notes:        '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const partyOptions =
    form.party_type === 'client'    ? clients   :
    form.party_type === 'sub_agent' ? subAgents :
                                       suppliers

  const partyLabel =
    form.party_type === 'client'    ? 'full_name' :
                                       'name'

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

    const orgId = profile!.organization_id

    // Get party name
    const selectedParty = partyOptions.find(p => p.id === form.party_id)
    const partyName     = selectedParty?.[partyLabel] ?? ''

    // Create journal entry
    const { data: je, error: jeError } = await supabase
      .from('journal_entries')
      .insert({
        organization_id: orgId,
        entry_date:      form.entry_date,
        description:     form.description,
        reference_type:  'manual',
        total_amount:    parseFloat(form.amount),
        currency:        form.currency,
        notes:           form.notes || null,
        created_by:      user!.id,
      })
      .select()
      .single()

    if (jeError) { setError(jeError.message); setLoading(false); return }

    // Create ledger entry
    const partyField =
      form.party_type === 'client'    ? { client_id:    form.party_id } :
      form.party_type === 'sub_agent' ? { sub_agent_id: form.party_id } :
                                         { supplier_id:  form.party_id }

    const { error: leError } = await supabase
      .from('ledger_entries')
      .insert({
        organization_id:  orgId,
        journal_entry_id: je.id,
        party_type:       form.party_type,
        ...partyField,
        party_name:       partyName,
        entry_type:       form.entry_type,
        amount:           parseFloat(form.amount),
        currency:         form.currency,
        description:      form.description,
      })

    if (leError) { setError(leError.message); setLoading(false); return }

    router.push('/dashboard/ledger')
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ledger" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual journal entry</h1>
          <p className="text-gray-500 text-sm">Add a manual debit or credit entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input name="description" required value={form.description}
              onChange={handleChange}
              placeholder="e.g. Cash received from Ahmed Khan"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" name="entry_date" value={form.entry_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select name="currency" value={form.currency} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>PKR</option>
              <option>USD</option>
              <option>SAR</option>
              <option>AED</option>
            </select>
          </div>
        </div>

        {/* Party selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party type
            </label>
            <select name="party_type" value={form.party_type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="client">Client</option>
              <option value="sub_agent">Sub-agent</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select party
            </label>
            <select name="party_id" value={form.party_id} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select...</option>
              {partyOptions.map(p => (
                <option key={p.id} value={p.id}>{p[partyLabel]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Entry type + amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry type
            </label>
            <select name="entry_type" value={form.entry_type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="debit">⬆ Debit (humein dena hai)</option>
              <option value="credit">⬇ Credit (humein mila)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input type="number" min="0" name="amount" required
              value={form.amount} onChange={handleChange}
              placeholder="e.g. 50000"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
            placeholder="Any additional notes..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Saving...' : 'Save entry'}
          </button>
          <Link href="/dashboard/ledger"
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}