'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PlusCircle } from 'lucide-react'

type Props = {
  partyType: string
  partyId:   string
  partyName: string
}

export default function AddLedgerEntryForm({ partyType, partyId, partyName }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    entry_type:  'debit',
    amount:      '',
    description: '',
    entry_date:  new Date().toISOString().split('T')[0],
    notes:       '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.description) {
      setError('Amount and description are required')
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

    const orgId = profile!.organization_id

    // Create journal entry
    const { data: je, error: jeError } = await supabase
      .from('journal_entries')
      .insert({
        organization_id: orgId,
        entry_date:      form.entry_date,
        description:     form.description,
        reference_type:  'manual',
        total_amount:    parseFloat(form.amount),
        currency:        'PKR',
        created_by:      user!.id,
      })
      .select()
      .single()

    if (jeError) { setError(jeError.message); setLoading(false); return }

    // Create ledger entry
    const partyField =
      partyType === 'client'    ? { client_id:    partyId } :
      partyType === 'sub_agent' ? { sub_agent_id: partyId } :
                                   { supplier_id:  partyId }

    const { error: leError } = await supabase
      .from('ledger_entries')
      .insert({
        organization_id:  orgId,
        journal_entry_id: je.id,
        party_type:       partyType,
        ...partyField,
        party_name:       partyName,
        entry_type:       form.entry_type,
        amount:           parseFloat(form.amount),
        currency:         'PKR',
        description:      form.description,
      })

    if (leError) { setError(leError.message); setLoading(false); return }

    setSuccess(true)
    setForm({
      entry_type:  'debit',
      amount:      '',
      description: '',
      entry_date:  new Date().toISOString().split('T')[0],
      notes:       '',
    })
    setLoading(false)
    router.refresh()
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PlusCircle size={16} className="text-blue-600" />
        Manual entry
      </h2>

      {error && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs mb-3">
          ✓ Entry added successfully
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Entry type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, entry_type: 'debit' }))}
              className={`py-2 rounded-lg border text-xs font-semibold transition ${
                form.entry_type === 'debit'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              ⬆ Debit
              <p className="text-xs font-normal opacity-70 mt-0.5">
                Humein dena hai
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, entry_type: 'credit' }))}
              className={`py-2 rounded-lg border text-xs font-semibold transition ${
                form.entry_type === 'credit'
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              ⬇ Credit
              <p className="text-xs font-normal opacity-70 mt-0.5">
                Humein mila
              </p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount (PKR) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="0" name="amount"
            value={form.amount} onChange={handleChange} required
            placeholder="e.g. 50000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            name="description" value={form.description}
            onChange={handleChange} required
            placeholder="e.g. Cash received for booking TP-001"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date" name="entry_date"
            value={form.entry_date} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add entry'}
        </button>
      </form>

      {/* Help text */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">Debit vs Credit:</p>
        <p>⬆ <strong>Debit</strong> = Party ko charge karna (invoice dena)</p>
        <p>⬇ <strong>Credit</strong> = Party se payment lena (receipt)</p>
      </div>
    </div>
  )
}