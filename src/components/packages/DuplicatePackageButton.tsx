'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Copy, Loader2 } from 'lucide-react'

// Fields intentionally left OUT of the duplicate — either because they must
// be unique (id, timestamps), auto-managed (seats_booked resets to 0), or
// because they're the "what changes per hotel variant" fields the user will
// want to edit immediately after duplicating (name, hotels, distances,
// nights, and all 4 price tiers). Everything else — especially the full
// flight leg — carries over exactly, since that's the whole point: keep the
// flight identical so the new package groups under the same header.
const EXCLUDE_FIELDS = new Set([
  'id', 'created_at', 'updated_at', 'seats_booked',
  'name', 'makkah_hotel', 'madinah_hotel',
  'makkah_hotel_distance', 'madinah_hotel_distance',
  'makkah_nights', 'madinah_nights',
  'base_price', 'price_quad', 'price_triple', 'price_double',
  'image_url',
])

export default function DuplicatePackageButton({ pkg, label }: { pkg: any; label?: string }) {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    setLoading(true)

    const copy: Record<string, any> = {}
    Object.entries(pkg).forEach(([key, value]) => {
      if (!EXCLUDE_FIELDS.has(key)) copy[key] = value
    })

    const { data: newPkg, error } = await supabase
      .from('packages')
      .insert({
        ...copy,
        name: `${pkg.name} (Copy)`,
        // Hotel + pricing + image intentionally blank — this is what the
        // user fills in next to create the new variant under the same flight
        image_url: null,
        makkah_hotel: null,
        madinah_hotel: null,
        makkah_hotel_distance: null,
        madinah_hotel_distance: null,
        makkah_nights: pkg.makkah_nights ?? null,
        madinah_nights: pkg.madinah_nights ?? null,
        base_price: pkg.base_price ?? 0,
        price_quad: null,
        price_triple: null,
        price_double: null,
      })
      .select('id')
      .single()

    setLoading(false)

    if (error) {
      alert(`Could not duplicate package: ${error.message}`)
      return
    }

    // Straight to edit so the user immediately fills in the new hotel + prices
    router.push(`/dashboard/packages/${newPkg.id}/edit`)
    router.refresh()
  }

  if (label) {
    return (
      <button
        onClick={handleDuplicate}
        disabled={loading}
        title="Keeps the same flight, lets you add a different hotel & price"
        className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      title="Duplicate this package — keeps the same flight, clears hotel & price"
      className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
    </button>
  )
}