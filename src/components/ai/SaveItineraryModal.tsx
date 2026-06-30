'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Sparkles } from 'lucide-react'

export default function SaveItineraryModal({
  itinerary,
  onClose,
}: {
  itinerary: any
  onClose:   () => void
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [clients,  setClients]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [form, setForm] = useState({
    client_id:   '',
    travel_date: '',
    total_amount: itinerary.totalBudgetMin?.toString() ?? '',
    currency:    'PKR',
    notes:       itinerary.summary ?? '',
  })

  useEffect(() => {
    supabase.from('clients').select('id, full_name').order('full_name').then(({ data }) => {
      setClients(data ?? [])
    })
  }, [])

  async function handleSave() {
    if (!form.client_id) { setError('Please select a client'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    // Create booking from itinerary
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        organization_id: profile!.organization_id,
        agent_id:        user!.id,
        client_id:       form.client_id,
        travel_date:     form.travel_date || null,
        num_passengers:  1,
        total_amount:    parseFloat(form.total_amount || '0'),
        paid_amount:     0,
        currency:        form.currency,
        status:          'inquiry',
        notes:           `AI Generated: ${form.notes}`,
      })
      .select()
      .single()

    if (bookingError) { setError(bookingError.message); setLoading(false); return }

    // Save hotels from itinerary
    if (itinerary.hotels?.length > 0) {
      for (const hotel of itinerary.hotels) {
        await supabase.from('hotel_details').insert({
          booking_id:      booking.id,
          organization_id: profile!.organization_id,
          city:            hotel.city,
          hotel_name:      hotel.name,
          stars:           hotel.stars ?? null,
          meal_plan:       'bed_breakfast',
        })
      }
    }

    // Save flight info
    if (itinerary.flightInfo?.airline) {
      await supabase.from('flight_details').insert({
        booking_id:      booking.id,
        organization_id: profile!.organization_id,
        trip_type:       'outbound',
        airline:         itinerary.flightInfo.airline,
        departure_city:  'Karachi',
        arrival_city:    itinerary.destination,
        seat_class:      'economy',
        baggage_kg:      23,
      })
    }

    setLoading(false)
    router.push(`/dashboard/bookings/${booking.id}`)
    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600" />
            Save as booking
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Itinerary summary */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="font-semibold text-purple-900 text-sm">{itinerary.title}</p>
            <p className="text-purple-600 text-xs mt-1">
              {itinerary.duration} days • {itinerary.destination}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              value={form.client_id}
              onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel date
              </label>
              <input
                type="date"
                value={form.travel_date}
                onChange={e => setForm(p => ({ ...p, travel_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Est. amount (PKR)
              </label>
              <input
                type="number"
                value={form.total_amount}
                onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-gray-700 mb-1">This will automatically create:</p>
            <p>✓ A new booking in inquiry status</p>
            {itinerary.flightInfo?.airline && <p>✓ Flight details ({itinerary.flightInfo.airline})</p>}
            {itinerary.hotels?.length > 0 && <p>✓ {itinerary.hotels.length} hotel(s)</p>}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            <Sparkles size={16} />
            {loading ? 'Creating booking...' : 'Save as booking'}
          </button>
        </div>
      </div>
    </div>
  )
}