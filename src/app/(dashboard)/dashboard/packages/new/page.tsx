'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X } from 'lucide-react'
import HotelPicker from '@/components/hotels/HotelPicker'

export default function NewPackagePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

const [form, setForm] = useState({
  name:               '',
  description:        '',
  destination:        '',
  duration_days:      '1',
  base_price:         '',
  currency:           'PKR',
  package_type:       'general',
  departure_city:     'Karachi',
  airline:            '',
  makkah_hotel:       '',
  madinah_hotel:      '',
  makkah_nights:      '7',
  madinah_nights:     '3',
  visa_included:      'false',
  transport_included: 'false',
  // Flight leg
  route_code:             '',
  departure_city_code:    '',
  destination_code:       '',
  airline_iata_code:      '',
  flight_number_out:      '',
  flight_number_return:   '',
  departure_date:         '',
  return_date:             '',
  departure_time:          '',
  arrival_time:            '',
  return_departure_time:   '',
  return_arrival_time:     '',
  baggage_out:             '',
  baggage_return:          '',
  // Hotel distance
  makkah_hotel_distance:   '',
  madinah_hotel_distance:  '',
  // Seats + tiered pricing
  total_seats:  '',
  price_quad:   '',
  price_triple: '',
  price_double: '',
})

  // Dynamic includes/excludes lists
  const [includes, setIncludes] = useState<string[]>([''])
  const [excludes, setExcludes] = useState<string[]>([''])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

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

    const cleanIncludes = includes.filter(i => i.trim() !== '')
    const cleanExcludes = excludes.filter(e => e.trim() !== '')

    const { error } = await supabase.from('packages').insert({
  ...form,
  organization_id:    profile!.organization_id,
  created_by:         user!.id,
  duration_days:      parseInt(form.duration_days),
  base_price:         parseFloat(form.base_price),
  includes:           cleanIncludes.length ? cleanIncludes : null,
  excludes:           cleanExcludes.length ? cleanExcludes : null,
  description:        form.description     || null,
  package_type:       form.package_type,
  departure_city:     form.departure_city  || null,
  airline:            form.airline         || null,
  makkah_hotel:       form.makkah_hotel    || null,
  madinah_hotel:      form.madinah_hotel   || null,
  makkah_nights:      form.makkah_nights   ? parseInt(form.makkah_nights)   : null,
  madinah_nights:     form.madinah_nights  ? parseInt(form.madinah_nights)  : null,
  visa_included:      form.visa_included      === 'true',
  transport_included: form.transport_included === 'true',
  // Flight leg
  route_code:            form.route_code            || null,
  departure_city_code:   form.departure_city_code    || null,
  destination_code:      form.destination_code       || null,
  airline_iata_code:     form.airline_iata_code      || null,
  flight_number_out:     form.flight_number_out      || null,
  flight_number_return:  form.flight_number_return    || null,
  departure_date:        form.departure_date          || null,
  return_date:           form.return_date             || null,
  departure_time:        form.departure_time          || null,
  arrival_time:          form.arrival_time            || null,
  return_departure_time: form.return_departure_time   || null,
  return_arrival_time:   form.return_arrival_time     || null,
  baggage_out:           form.baggage_out             || null,
  baggage_return:        form.baggage_return          || null,
  // Hotel distance
  makkah_hotel_distance:  form.makkah_hotel_distance  || null,
  madinah_hotel_distance: form.madinah_hotel_distance || null,
  // Seats + tiered pricing
  total_seats:  form.total_seats  ? parseInt(form.total_seats)     : null,
  price_quad:   form.price_quad   ? parseFloat(form.price_quad)    : null,
  price_triple: form.price_triple ? parseFloat(form.price_triple)  : null,
  price_double: form.price_double ? parseFloat(form.price_double)  : null,
})

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/packages')
    router.refresh()
  }

  const isUmrahOrHajj = ['umrah', 'hajj', 'ziarat'].includes(form.package_type ?? '')

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/packages" className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add new package</h1>
          <p className="text-gray-500 text-sm">Create a travel package to assign to bookings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Package name <span className="text-red-500">*</span>
          </label>
          <input
            name="name" required value={form.name} onChange={handleChange}
            placeholder="e.g. Turkey 10 Days Luxury Tour"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            <input
              name="destination" required value={form.destination} onChange={handleChange}
              placeholder="e.g. Istanbul, Turkey"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
            <input
              name="duration_days" type="number" min="1" value={form.duration_days} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sharing price (base) <span className="text-red-500">*</span>
            </label>
            <input
              name="base_price" type="number" min="0" required value={form.base_price} onChange={handleChange}
              placeholder="e.g. 263752"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              name="currency" value={form.currency} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>PKR</option>
              <option>USD</option>
              <option>SAR</option>
              <option>AED</option>
              <option>EUR</option>
            </select>
          </div>
        </div>

        {/* Tiered pricing — matches the Sharing/Quad/Triple/Double columns on the packages list */}
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
          <p className="text-sm font-semibold text-blue-800">💰 Room-sharing pricing (per person)</p>
          <p className="text-xs text-blue-600 -mt-2">Sharing price above is used automatically. Leave a tier blank if not offered.</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quad price</label>
              <input name="price_quad" type="number" min="0" value={form.price_quad} onChange={handleChange}
                placeholder="e.g. 269540"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Triple price</label>
              <input name="price_triple" type="number" min="0" value={form.price_triple} onChange={handleChange}
                placeholder="e.g. 277520"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Double price</label>
              <input name="price_double" type="number" min="0" value={form.price_double} onChange={handleChange}
                placeholder="e.g. 293480"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Total seats available</label>
            <input name="total_seats" type="number" min="0" value={form.total_seats} onChange={handleChange}
              placeholder="e.g. 40"
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description" value={form.description} onChange={handleChange} rows={3}
            placeholder="Describe what's included in this package..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package type</label>
          <select name="package_type" value={form.package_type ?? 'general'} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="general">General tour</option>
            <option value="umrah">Umrah</option>
            <option value="hajj">Hajj</option>
            <option value="ziarat">Ziarat</option>
            <option value="tour">Tour package</option>
          </select>
        </div>

        {/* Show Umrah fields only when type is umrah/hajj/ziarat */}
        {isUmrahOrHajj && (
          <div className="border border-green-100 rounded-lg p-4 bg-green-50 space-y-3">
            <p className="text-sm font-semibold text-green-800">🕋 Umrah / Hajj details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Airline</label>
                <input name="airline" value={form.airline ?? ''} onChange={handleChange}
                  placeholder="e.g. PIA, Emirates, Saudia"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Departure city</label>
                <select name="departure_city" value={form.departure_city ?? 'Karachi'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option>Karachi</option>
                  <option>Lahore</option>
                  <option>Islamabad</option>
                  <option>Peshawar</option>
                  <option>Quetta</option>
                  <option>Multan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Makkah hotel</label>
                <HotelPicker
                  city="makkah"
                  nameValue={form.makkah_hotel}
                  onNameChange={v => setForm(p => ({ ...p, makkah_hotel: v }))}
                  onDistanceAutofill={d => setForm(p => ({ ...p, makkah_hotel_distance: d }))}
                  namePlaceholder="e.g. Marriott Makkah"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Makkah hotel distance</label>
                <input name="makkah_hotel_distance" value={form.makkah_hotel_distance ?? ''} onChange={handleChange}
                  placeholder="e.g. 450M Haram facing"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Madinah hotel</label>
                <HotelPicker
                  city="madinah"
                  nameValue={form.madinah_hotel}
                  onNameChange={v => setForm(p => ({ ...p, madinah_hotel: v }))}
                  onDistanceAutofill={d => setForm(p => ({ ...p, madinah_hotel_distance: d }))}
                  namePlaceholder="e.g. Anwar Al Madinah"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Madinah hotel distance</label>
                <input name="madinah_hotel_distance" value={form.madinah_hotel_distance ?? ''} onChange={handleChange}
                  placeholder="e.g. 1200M shuttle"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Makkah nights</label>
                <input name="makkah_nights" type="number" min="1" value={form.makkah_nights ?? '7'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Madinah nights</label>
                <input name="madinah_nights" type="number" min="1" value={form.madinah_nights ?? '3'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" name="visa_included"
                    checked={form.visa_included === 'true'}
                    onChange={e => setForm(p => ({ ...p, visa_included: e.target.checked.toString() }))}
                    className="rounded" />
                  Visa included
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" name="transport_included"
                    checked={form.transport_included === 'true'}
                    onChange={e => setForm(p => ({ ...p, transport_included: e.target.checked.toString() }))}
                    className="rounded" />
                  Transport included
                </label>
              </div>
            </div>

            {/* Flight leg details — matches the flight header block on the packages list */}
            <div className="pt-3 mt-3 border-t border-green-100 space-y-3">
              <p className="text-xs font-semibold text-green-800">✈️ Flight leg</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Route code</label>
                  <input name="route_code" value={form.route_code} onChange={handleChange}
                    placeholder="e.g. MUX-JED-MUX"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Departure airport code</label>
                  <input name="departure_city_code" value={form.departure_city_code} onChange={handleChange}
                    placeholder="e.g. MUX" maxLength={3}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destination airport code</label>
                  <input name="destination_code" value={form.destination_code} onChange={handleChange}
                    placeholder="e.g. JED" maxLength={3}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Airline IATA code</label>
                  <input name="airline_iata_code" value={form.airline_iata_code} onChange={handleChange}
                    placeholder="e.g. SV (Saudia), PK (PIA)"
                    maxLength={3}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                  <p className="text-[10px] text-gray-400 mt-1">Used to show the airline logo. Common airlines auto-detect from name if left blank.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Outbound flight #</label>
                  <input name="flight_number_out" value={form.flight_number_out} onChange={handleChange}
                    placeholder="e.g. SV801"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Return flight #</label>
                  <input name="flight_number_return" value={form.flight_number_return} onChange={handleChange}
                    placeholder="e.g. SV800"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Departure date</label>
                  <input name="departure_date" type="date" value={form.departure_date} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Return date</label>
                  <input name="return_date" type="date" value={form.return_date} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dep. time</label>
                  <input name="departure_time" value={form.departure_time} onChange={handleChange}
                    placeholder="16:45"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Arr. time</label>
                  <input name="arrival_time" value={form.arrival_time} onChange={handleChange}
                    placeholder="19:30"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Return dep.</label>
                  <input name="return_departure_time" value={form.return_departure_time} onChange={handleChange}
                    placeholder="08:30"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Return arr.</label>
                  <input name="return_arrival_time" value={form.return_arrival_time} onChange={handleChange}
                    placeholder="15:05"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Outbound baggage</label>
                  <input name="baggage_out" value={form.baggage_out} onChange={handleChange}
                    placeholder="e.g. 1PC X 23 KG | Meal"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Return baggage</label>
                  <input name="baggage_return" value={form.baggage_return} onChange={handleChange}
                    placeholder="e.g. 2PC X 23 KG | Meal"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Includes list */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What's included</label>
          <div className="space-y-2">
            {includes.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={item}
                  onChange={e => {
                    const next = [...includes]
                    next[i] = e.target.value
                    setIncludes(next)
                  }}
                  placeholder="e.g. Return flights"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setIncludes(includes.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-500 transition">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setIncludes([...includes, ''])}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus size={14} /> Add item
            </button>
          </div>
        </div>

        {/* Excludes list */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What's excluded</label>
          <div className="space-y-2">
            {excludes.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={item}
                  onChange={e => {
                    const next = [...excludes]
                    next[i] = e.target.value
                    setExcludes(next)
                  }}
                  placeholder="e.g. Travel insurance"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setExcludes(excludes.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-500 transition">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setExcludes([...excludes, ''])}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus size={14} /> Add item
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Saving...' : 'Save package'}
          </button>
          <Link href="/dashboard/packages"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}