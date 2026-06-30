'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X } from 'lucide-react'

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
})

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/packages')
    router.refresh()
  }

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
              Base price <span className="text-red-500">*</span>
            </label>
            <input
              name="base_price" type="number" min="0" required value={form.base_price} onChange={handleChange}
              placeholder="e.g. 150000"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description" value={form.description} onChange={handleChange} rows={3}
            placeholder="Describe what's included in this package..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        {/* Add this section after the description field */}
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
{['umrah','hajj','ziarat'].includes(form.package_type ?? '') && (
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
        <input name="makkah_hotel" value={form.makkah_hotel ?? ''} onChange={handleChange}
          placeholder="e.g. Marriott Makkah"
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Madinah hotel</label>
        <input name="madinah_hotel" value={form.madinah_hotel ?? ''} onChange={handleChange}
          placeholder="e.g. Anwar Al Madinah"
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
      <div className="flex items-center gap-4">
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