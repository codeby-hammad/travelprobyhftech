'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plane, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { FlightDetail } from '@/types'

type Props = {
  bookingId:      string
  organizationId: string
  flights:        FlightDetail[]
}

const emptyFlight = {
  trip_type:      'outbound',
  airline:        '',
  flight_number:  '',
  pnr:            '',
  departure_city: '',
  arrival_city:   '',
  departure_time: '',
  arrival_time:   '',
  terminal:       '',
  seat_class:     'economy',
  baggage_kg:     '23',
  notes:          '',
}

export default function FlightDetailsSection({ bookingId, organizationId, flights }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [open,    setOpen]    = useState(flights.length > 0)
  const [adding,  setAdding]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [form,    setForm]    = useState<Record<string, string>>(emptyFlight)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('flight_details').insert({
      booking_id:      bookingId,
      organization_id: organizationId,
      trip_type:       form.trip_type,
      airline:         form.airline        || null,
      flight_number:   form.flight_number  || null,
      pnr:             form.pnr            || null,
      departure_city:  form.departure_city || null,
      arrival_city:    form.arrival_city   || null,
      departure_time:  form.departure_time || null,
      arrival_time:    form.arrival_time   || null,
      terminal:        form.terminal       || null,
      seat_class:      form.seat_class,
      baggage_kg:      parseInt(form.baggage_kg || '23'),
      notes:           form.notes          || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setAdding(false)
    setForm(emptyFlight)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this flight?')) return
    await supabase.from('flight_details').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition"
        >
          <Plane size={16} />
          Flight details
          <span className="text-xs text-gray-400 font-normal">({flights.length})</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          onClick={() => { setAdding(true); setOpen(true) }}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus size={14} /> Add flight
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">

          {/* Existing flights */}
          {flights.map(f => (
            <div key={f.id} className="border border-gray-100 rounded-lg p-4 text-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    f.trip_type === 'outbound'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-purple-50 text-purple-700'
                  }`}>
                    {f.trip_type === 'outbound' ? '✈ Outbound' : '✈ Return'}
                  </span>
                  {f.airline && <span className="font-medium text-gray-900">{f.airline}</span>}
                  {f.flight_number && <span className="text-gray-500">{f.flight_number}</span>}
                </div>
                <button onClick={() => handleDelete(f.id)}
                  className="text-gray-300 hover:text-red-500 transition">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {f.departure_city && f.arrival_city && (
                  <div className="col-span-2 font-medium text-gray-700">
                    {f.departure_city} → {f.arrival_city}
                  </div>
                )}
                {f.departure_time && (
                  <div>Dep: {new Date(f.departure_time).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}</div>
                )}
                {f.arrival_time && (
                  <div>Arr: {new Date(f.arrival_time).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}</div>
                )}
                {f.pnr && <div>PNR: <span className="font-mono font-medium text-gray-800">{f.pnr}</span></div>}
                {f.seat_class && <div className="capitalize">{f.seat_class} • {f.baggage_kg}kg</div>}
              </div>
            </div>
          ))}

          {/* Add flight form */}
          {adding && (
            <form onSubmit={handleAdd} className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
              <p className="text-sm font-medium text-gray-700">Add flight</p>

              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-xs">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select name="trip_type" value={form.trip_type} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="outbound">Outbound</option>
                    <option value="return">Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Airline</label>
                  <input name="airline" value={form.airline} onChange={handleChange}
                    placeholder="e.g. PIA, Emirates"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Flight no.</label>
                  <input name="flight_number" value={form.flight_number} onChange={handleChange}
                    placeholder="e.g. PK-301"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">PNR</label>
                  <input name="pnr" value={form.pnr} onChange={handleChange}
                    placeholder="e.g. ABC123"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                  <input name="departure_city" value={form.departure_city} onChange={handleChange}
                    placeholder="e.g. Karachi (KHI)"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                  <input name="arrival_city" value={form.arrival_city} onChange={handleChange}
                    placeholder="e.g. Jeddah (JED)"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Departure</label>
                  <input name="departure_time" type="datetime-local" value={form.departure_time} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Arrival</label>
                  <input name="arrival_time" type="datetime-local" value={form.arrival_time} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                  <select name="seat_class" value={form.seat_class} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Baggage (kg)</label>
                  <input name="baggage_kg" type="number" value={form.baggage_kg} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add flight'}
                </button>
                <button type="button" onClick={() => setAdding(false)}
                  className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {flights.length === 0 && !adding && (
            <p className="text-sm text-gray-400 text-center py-3">No flights added yet</p>
          )}
        </div>
      )}
    </div>
  )
}