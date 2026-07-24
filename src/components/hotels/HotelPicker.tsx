'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2 } from 'lucide-react'

type Hotel = { id: string; name: string; distance: string | null }

// Uses a native <datalist> rather than a custom dropdown component — this
// gives real dropdown suggestions while still allowing free-text entry for
// a hotel not yet saved, with zero extra UI library weight.
export default function HotelPicker({
  city,
  nameValue,
  onNameChange,
  onDistanceAutofill,
  namePlaceholder,
}: {
  city: 'makkah' | 'madinah'
  nameValue: string
  onNameChange: (value: string) => void
  onDistanceAutofill?: (distance: string) => void
  namePlaceholder?: string
}) {
  const supabase = createClient()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const listId = `hotels-${city}`

  useEffect(() => {
    let active = true
    supabase
      .from('hotels')
      .select('id, name, distance')
      .eq('city', city)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (active) setHotels(data ?? [])
      })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city])

  function handleChange(value: string) {
    onNameChange(value)
    // If the typed/selected value matches a saved hotel exactly, auto-fill
    // its distance description so staff don't have to re-enter it
    const match = hotels.find(h => h.name.toLowerCase() === value.toLowerCase())
    if (match && onDistanceAutofill) {
      onDistanceAutofill(match.distance ?? '')
    }
  }

  return (
    <div className="relative">
      <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        list={listId}
        value={nameValue}
        onChange={e => handleChange(e.target.value)}
        placeholder={namePlaceholder ?? 'Select or type hotel name'}
        className="w-full border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      />
      <datalist id={listId}>
        {hotels.map(h => (
          <option key={h.id} value={h.name} />
        ))}
      </datalist>
    </div>
  )
}