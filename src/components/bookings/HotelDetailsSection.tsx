'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Plus, Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react'
import type { HotelDetail } from '@/types'

type Props = {
  bookingId:      string
  organizationId: string
  hotels:         HotelDetail[]
}

const emptyHotel = {
  city:            '',
  hotel_name:      '',
  stars:           '4',
  room_type:       '',
  check_in:        '',
  check_out:       '',
  confirmation_no: '',
  distance_haram:  '',
  meal_plan:       'bed_breakfast',
  notes:           '',
}

export default function HotelDetailsSection({ bookingId, organizationId, hotels }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [open,    setOpen]    = useState(hotels.length > 0)
  const [adding,  setAdding]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [form,    setForm]    = useState<Record<string, string>>(emptyHotel)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('hotel_details').insert({
      booking_id:      bookingId,
      organization_id: organizationId,
      city:            form.city,
      hotel_name:      form.hotel_name,
      stars:           parseInt(form.stars) || null,
      room_type:       form.room_type       || null,
      check_in:        form.check_in        || null,
      check_out:       form.check_out       || null,
      confirmation_no: form.confirmation_no || null,
      distance_haram:  form.distance_haram  || null,
      meal_plan:       form.meal_plan,
      notes:           form.notes           || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setAdding(false)
    setForm(emptyHotel)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this hotel?')) return
    await supabase.from('hotel_details').delete().eq('id', id)
    router.refresh()
  }

  const mealLabels: Record<string, string> = {
    room_only:     'Room only',
    bed_breakfast: 'Bed & breakfast',
    half_board:    'Half board',
    full_board:    'Full board',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition">
          <Building2 size={16} />
          Hotel details
          <span className="text-xs text-gray-400 font-normal">({hotels.length})</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button onClick={() => { setAdding(true); setOpen(true) }}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
          <Plus size={14} /> Add hotel
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">

          {hotels.map(h => (
            <div key={h.id} className="border border-gray-100 rounded-lg p-4 text-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{h.hotel_name}</p>
                  <p className="text-xs text-gray-500">{h.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  {h.stars && (
                    <div className="flex">
                      {Array.from({ length: h.stars }).map((_, i) => (
                        <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  )}
                  <button onClick={() => handleDelete(h.id)}
                    className="text-gray-300 hover:text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {h.check_in && h.check_out && (
                  <div className="col-span-2">
                    Check-in: {h.check_in} → Check-out: {h.check_out}
                    {h.nights && <span className="ml-2 text-blue-600 font-medium">({h.nights} nights)</span>}
                  </div>
                )}
                {h.room_type       && <div>Room: {h.room_type}</div>}
                {h.meal_plan       && <div>{mealLabels[h.meal_plan]}</div>}
                {h.confirmation_no && <div>Conf#: <span className="font-mono font-medium text-gray-800">{h.confirmation_no}</span></div>}
                {h.distance_haram  && <div>🕋 {h.distance_haram}</div>}
              </div>
            </div>
          ))}

          {adding && (
            <form onSubmit={handleAdd} className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
              <p className="text-sm font-medium text-gray-700">Add hotel</p>

              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-xs">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input name="city" required value={form.city} onChange={handleChange}
                    placeholder="e.g. Makkah"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hotel name <span className="text-red-500">*</span>
                  </label>
                  <input name="hotel_name" required value={form.hotel_name} onChange={handleChange}
                    placeholder="e.g. Marriott Makkah"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stars</label>
                  <select name="stars" value={form.stars} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {[5,4,3,2,1].map(s => (
                      <option key={s} value={s}>{s} star</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Room type</label>
                  <input name="room_type" value={form.room_type} onChange={handleChange}
                    placeholder="e.g. Double, Triple"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Check-in</label>
                  <input name="check_in" type="date" value={form.check_in} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Check-out</label>
                  <input name="check_out" type="date" value={form.check_out} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirmation no.</label>
                  <input name="confirmation_no" value={form.confirmation_no} onChange={handleChange}
                    placeholder="Hotel booking ref"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Meal plan</label>
                  <select name="meal_plan" value={form.meal_plan} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="room_only">Room only</option>
                    <option value="bed_breakfast">Bed & breakfast</option>
                    <option value="half_board">Half board</option>
                    <option value="full_board">Full board</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Distance from Haram 🕋
                  </label>
                  <input name="distance_haram" value={form.distance_haram} onChange={handleChange}
                    placeholder="e.g. 200m walking distance"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add hotel'}
                </button>
                <button type="button" onClick={() => setAdding(false)}
                  className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {hotels.length === 0 && !adding && (
            <p className="text-sm text-gray-400 text-center py-3">No hotels added yet</p>
          )}
        </div>
      )}
    </div>
  )
}