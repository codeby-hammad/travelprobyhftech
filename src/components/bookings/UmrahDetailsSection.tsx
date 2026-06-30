'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, Pencil, Plus } from 'lucide-react'
import type { UmrahDetail } from '@/types'

type Props = {
  bookingId:      string
  organizationId: string
  umrah:          UmrahDetail | null
}

const defaultForm = {
  umrah_type:       'individual',
  visa_type:        'umrah',
  departure_city:   'Karachi',
  maktab_number:    '',
  group_leader:     '',
  makkah_nights:    '7',
  madinah_nights:   '3',
  ziarat_makkah:    'false',
  ziarat_madinah:   'false',
  transport_type:   'bus',
  ihram_point:      '',
  special_requests: '',
}

export default function UmrahDetailsSection({ bookingId, organizationId, umrah }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [open,    setOpen]    = useState(!!umrah)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState(
    umrah ? {
      umrah_type:       umrah.umrah_type,
      visa_type:        umrah.visa_type,
      departure_city:   umrah.departure_city,
      maktab_number:    umrah.maktab_number    ?? '',
      group_leader:     umrah.group_leader     ?? '',
      makkah_nights:    umrah.makkah_nights.toString(),
      madinah_nights:   umrah.madinah_nights.toString(),
      ziarat_makkah:    umrah.ziarat_makkah.toString(),
      ziarat_madinah:   umrah.ziarat_madinah.toString(),
      transport_type:   umrah.transport_type,
      ihram_point:      umrah.ihram_point      ?? '',
      special_requests: umrah.special_requests ?? '',
    } : defaultForm
  )

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      booking_id:       bookingId,
      organization_id:  organizationId,
      umrah_type:       form.umrah_type,
      visa_type:        form.visa_type,
      departure_city:   form.departure_city,
      maktab_number:    form.maktab_number    || null,
      group_leader:     form.group_leader     || null,
      makkah_nights:    parseInt(form.makkah_nights),
      madinah_nights:   parseInt(form.madinah_nights),
      ziarat_makkah:    form.ziarat_makkah   === 'true',
      ziarat_madinah:   form.ziarat_madinah  === 'true',
      transport_type:   form.transport_type,
      ihram_point:      form.ihram_point      || null,
      special_requests: form.special_requests || null,
    }

    const { error } = umrah
      ? await supabase.from('umrah_details').update(payload).eq('id', umrah.id)
      : await supabase.from('umrah_details').insert(payload)

    if (error) { setError(error.message); setLoading(false); return }
    setEditing(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-green-700 transition">
          <span>🕋</span>
          Umrah details
          {!umrah && <span className="text-xs text-gray-400 font-normal">(not added)</span>}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setOpen(true) }}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
          >
            {umrah ? <><Pencil size={13} /> Edit</> : <><Plus size={14} /> Add Umrah details</>}
          </button>
        )}
      </div>

      {open && !editing && umrah && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Type',           value: umrah.umrah_type.replace('_',' ') },
            { label: 'Visa type',      value: umrah.visa_type },
            { label: 'Departure city', value: umrah.departure_city },
            { label: 'Transport',      value: umrah.transport_type.replace('_',' ') },
            { label: 'Makkah nights',  value: `${umrah.makkah_nights} nights` },
            { label: 'Madinah nights', value: `${umrah.madinah_nights} nights` },
            { label: 'Maktab no.',     value: umrah.maktab_number ?? '—' },
            { label: 'Group leader',   value: umrah.group_leader  ?? '—' },
            { label: 'Ziarat Makkah',  value: umrah.ziarat_makkah  ? '✅ Yes' : '❌ No' },
            { label: 'Ziarat Madinah', value: umrah.ziarat_madinah ? '✅ Yes' : '❌ No' },
            { label: 'Ihram point',    value: umrah.ihram_point ?? '—' },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs text-gray-400">{row.label}</p>
              <p className="font-medium text-gray-800 capitalize">{row.value}</p>
            </div>
          ))}
          {umrah.special_requests && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Special requests</p>
              <p className="text-gray-700">{umrah.special_requests}</p>
            </div>
          )}
        </div>
      )}

      {open && !editing && !umrah && (
        <p className="text-sm text-gray-400 text-center py-3 mt-2">
          No Umrah details added yet
        </p>
      )}

      {editing && (
        <form onSubmit={handleSave} className="mt-3 space-y-3">
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-xs">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Umrah type</label>
              <select name="umrah_type" value={form.umrah_type} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="individual">Individual</option>
                <option value="family">Family</option>
                <option value="group">Group</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Visa type</label>
              <select name="visa_type" value={form.visa_type} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="umrah">Umrah visa</option>
                <option value="tourist">Tourist visa</option>
                <option value="ziarat">Ziarat visa</option>
                <option value="multiple">Multiple entry</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Departure city</label>
              <select name="departure_city" value={form.departure_city} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option>Karachi</option>
                <option>Lahore</option>
                <option>Islamabad</option>
                <option>Peshawar</option>
                <option>Quetta</option>
                <option>Multan</option>
                <option>Faisalabad</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transport</label>
              <select name="transport_type" value={form.transport_type} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="bus">Bus</option>
                <option value="private_car">Private car</option>
                <option value="haramain_train">Haramain train</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Makkah nights</label>
              <input name="makkah_nights" type="number" min="1"
                value={form.makkah_nights} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Madinah nights</label>
              <input name="madinah_nights" type="number" min="1"
                value={form.madinah_nights} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Maktab no.</label>
              <input name="maktab_number" value={form.maktab_number} onChange={handleChange}
                placeholder="e.g. 14"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Group leader</label>
              <input name="group_leader" value={form.group_leader} onChange={handleChange}
                placeholder="Leader name"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ziarat Makkah</label>
              <select name="ziarat_makkah" value={form.ziarat_makkah} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="true">Yes ✅</option>
                <option value="false">No ❌</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ziarat Madinah</label>
              <select name="ziarat_madinah" value={form.ziarat_madinah} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="true">Yes ✅</option>
                <option value="false">No ❌</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Ihram point</label>
              <input name="ihram_point" value={form.ihram_point} onChange={handleChange}
                placeholder="e.g. Meeqat Yalamlam, Karachi Airport"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Special requests</label>
              <textarea name="special_requests" value={form.special_requests}
                onChange={handleChange} rows={2}
                placeholder="Wheelchair, ground floor room, dietary requirements..."
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Umrah details'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}