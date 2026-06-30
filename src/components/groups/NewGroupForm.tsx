'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react'

type Props = {
  clients:  any[]
  packages: any[]
}

export default function NewGroupForm({ clients, packages }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    group_name:      '',
    group_leader_id: '',
    package_id:      '',
    travel_date:     '',
    return_date:     '',
    total_amount:    '',
    currency:        'PKR',
    notes:           '',
  })

  // Passenger list — each has a client_id and individual amount
  const [passengers, setPassengers] = useState([
    { client_id: '', total_amount: '', paid_amount: '0', notes: '' }
  ])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Auto-fill price when package selected
    if (name === 'package_id' && value) {
      const pkg = packages.find(p => p.id === value)
      if (pkg) {
        setForm(prev => ({
          ...prev,
          package_id:   value,
          total_amount: (pkg.base_price * passengers.length).toString(),
          currency:     pkg.currency,
        }))
        setPassengers(prev => prev.map(p => ({
          ...p,
          total_amount: pkg.base_price.toString(),
        })))
      }
    }
  }

  function updatePassenger(index: number, field: string, value: string) {
    setPassengers(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addPassenger() {
    const pkg = packages.find(p => p.id === form.package_id)
    setPassengers(prev => [
      ...prev,
      { client_id: '', total_amount: pkg?.base_price?.toString() ?? '', paid_amount: '0', notes: '' }
    ])
  }

  function removePassenger(index: number) {
    if (passengers.length === 1) return
    setPassengers(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (passengers.some(p => !p.client_id)) {
      setError('Please select a client for every passenger')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    const orgId = profile!.organization_id

    // Step 1 — Create the main booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        organization_id: orgId,
        agent_id:        user!.id,
        client_id:       form.group_leader_id || passengers[0].client_id,
        package_id:      form.package_id      || null,
        travel_date:     form.travel_date     || null,
        return_date:     form.return_date     || null,
        num_passengers:  passengers.length,
        total_amount:    parseFloat(form.total_amount || '0'),
        paid_amount:     0,
        currency:        form.currency,
        status:          'inquiry',
        notes:           form.notes           || null,
      })
      .select()
      .single()

    if (bookingError) { setError(bookingError.message); setLoading(false); return }

    // Step 2 — Create group booking record
    const { data: group, error: groupError } = await supabase
      .from('group_bookings')
      .insert({
        organization_id: orgId,
        booking_id:      booking.id,
        group_name:      form.group_name,
        group_leader_id: form.group_leader_id || null,
        total_pax:       passengers.length,
        notes:           form.notes           || null,
      })
      .select()
      .single()

    if (groupError) { setError(groupError.message); setLoading(false); return }

    // Step 3 — Add all passengers
    const { error: passengersError } = await supabase
      .from('group_passengers')
      .insert(
        passengers.map(p => ({
          organization_id:  orgId,
          group_booking_id: group.id,
          client_id:        p.client_id,
          total_amount:     parseFloat(p.total_amount || '0'),
          paid_amount:      parseFloat(p.paid_amount  || '0'),
          notes:            p.notes                   || null,
        }))
      )

    if (passengersError) { setError(passengersError.message); setLoading(false); return }

    router.push(`/dashboard/groups/${group.id}`)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/groups" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New group booking</h1>
          <p className="text-gray-500 text-sm">Add multiple passengers under one booking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Group info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Group information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group name <span className="text-red-500">*</span>
              </label>
              <input name="group_name" required value={form.group_name} onChange={handleChange}
                placeholder="e.g. Ahmed Family Umrah Group"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group leader</label>
              <select name="group_leader_id" value={form.group_leader_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select leader...</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Travel date</label>
              <input type="date" name="travel_date" value={form.travel_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return date</label>
              <input type="date" name="return_date" value={form.return_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* Passengers */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={16} />
              Passengers
              <span className="text-blue-600 font-bold">{passengers.length}</span>
            </h2>
            <button type="button" onClick={addPassenger}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
              <Plus size={14} /> Add passenger
            </button>
          </div>

          <div className="space-y-3">
            {passengers.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Passenger {i + 1}
                    {form.group_leader_id === p.client_id && p.client_id && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Leader
                      </span>
                    )}
                  </span>
                  {passengers.length > 1 && (
                    <button type="button" onClick={() => removePassenger(i)}
                      className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select value={p.client_id}
                      onChange={e => updatePassenger(i, 'client_id', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">Select client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount ({form.currency})
                    </label>
                    <input type="number" min="0" value={p.total_amount}
                      onChange={e => updatePassenger(i, 'total_amount', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Paid so far</label>
                    <input type="number" min="0" value={p.paid_amount}
                      onChange={e => updatePassenger(i, 'paid_amount', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Total ({passengers.length} passengers)
            </span>
            <span className="font-bold text-gray-900">
              {form.currency}{' '}
              {passengers.reduce((s, p) => s + parseFloat(p.total_amount || '0'), 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Creating group booking...' : 'Create group booking'}
          </button>
          <Link href="/dashboard/groups"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}