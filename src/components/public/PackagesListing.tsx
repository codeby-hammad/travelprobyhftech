'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import PackageCard from './PackageCard'
import BookingLauncher from './BookingLauncher'
import { type Package, type DisplayPackage, startingPrice, dedupePackagesForDisplay } from './packageTypes'

const STEPS = ['Choose Package', 'Accommodation', 'Pilgrim Details', 'Questionnaire', 'Review & Submit']

type SortOption = 'recommended' | 'price_asc' | 'price_desc'

function formatK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export default function PackagesListing({
  packages,
  orgSlug,
}: {
  packages: Package[]
  orgSlug: string
}) {
  const [activePackage, setActivePackage] = useState<Package | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [selectedDurations, setSelectedDurations] = useState<number[]>([])

  // After a Google OAuth round-trip, resume the flow on whichever package
  // the customer was booking before being sent off to log in
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('resumeBooking') !== '1') return

    const pendingId = sessionStorage.getItem('umrah_pending_package_id')
    if (pendingId) {
      const found = packages.find(p => p.id === pendingId)
      if (found) setActivePackage(found)
      sessionStorage.removeItem('umrah_pending_package_id')
    }
    window.history.replaceState({}, '', window.location.pathname)
  }, [packages])

  // Collapse hotel-variant duplicates (same flight, different hotel) into
  // one item per route before anything else — filters, sorting and the
  // grid all work off this deduped list, never the raw `packages` prop
  const items = useMemo(() => dedupePackagesForDisplay(packages), [packages])

  const priceBounds = useMemo(() => {
    const prices = items.map(i => i.displayPrice).filter((p): p is number => p != null)
    if (prices.length === 0) return { min: 0, max: 500000 }
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [items])

  const [priceRange, setPriceRange] = useState<[number, number]>([priceBounds.min, priceBounds.max])

  const airlineOptions = useMemo(
    () => Array.from(new Set(items.map(i => i.pkg.airline).filter((a): a is string => !!a))),
    [items]
  )
  const durationOptions = useMemo(
    () => Array.from(new Set(items.map(i => i.pkg.duration_days).filter((d): d is number => d != null))).sort((a, b) => a - b),
    [items]
  )

  function toggle<T>(list: T[], value: T, setList: (v: T[]) => void) {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  }

  const filtered = useMemo(() => {
    let list = items.filter(({ pkg, displayPrice }) => {
      if (displayPrice != null && (displayPrice < priceRange[0] || displayPrice > priceRange[1])) return false
      if (selectedAirlines.length && !selectedAirlines.includes(pkg.airline ?? '')) return false
      if (selectedDurations.length && !selectedDurations.includes(pkg.duration_days ?? -1)) return false
      return true
    })
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => (a.displayPrice ?? Infinity) - (b.displayPrice ?? Infinity))
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => (b.displayPrice ?? -Infinity) - (a.displayPrice ?? -Infinity))
    }
    return list
  }, [items, priceRange, selectedAirlines, selectedDurations, sortBy])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header + decorative stepper (this page IS the Choose Package step) */}
      <a href={`/${orgSlug}`} className="flex items-center gap-2 text-[#1a2744] hover:text-[#c9a84c] transition-colors mb-3 w-fit">
        <ArrowLeft size={20} />
        <h1 className="font-playfair text-2xl font-bold">Browse Umrah Packages</h1>
      </a>

      <div className="flex items-center mb-10 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none min-w-fit">
            <div className="flex flex-col gap-1.5 min-w-fit pr-4">
              <span className={`text-[13px] font-semibold whitespace-nowrap ${i === 0 ? 'text-[#0a1628]' : 'text-[#6b7a99]/50'}`}>
                {label}
              </span>
              <div className={`h-[3px] rounded-full ${i === 0 ? 'bg-[#0a1628]' : 'bg-black/10'}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {/* Filters sidebar */}
        <aside className="w-full md:w-64 md:shrink-0 bg-white rounded-xl border border-black/06 p-5 md:sticky md:top-6">
          <h3 className="font-semibold text-[#1a2744] mb-5">Filters</h3>

          {/* Price range */}
          <div className="mb-6 pb-6 border-b border-black/06">
            <p className="text-[13px] font-semibold text-[#1a2744] mb-3">Price Range</p>
            <div className="price-slider relative h-1 mt-5 mb-2">
              <div className="absolute inset-0 rounded-full bg-black/10" />
              <div
                className="absolute h-1 rounded-full bg-[#c9a84c]"
                style={{
                  left:  `${((priceRange[0] - priceBounds.min) / (priceBounds.max - priceBounds.min || 1)) * 100}%`,
                  right: `${100 - ((priceRange[1] - priceBounds.min) / (priceBounds.max - priceBounds.min || 1)) * 100}%`,
                }}
              />
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceRange[0]}
                onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none"
              />
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none"
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#6b7a99]">
              <span>{formatK(priceRange[0])}</span>
              <span>{formatK(priceRange[1])}</span>
            </div>
          </div>

          {/* Airlines */}
          {airlineOptions.length > 0 && (
            <div className="mb-6 pb-6 border-b border-black/06">
              <p className="text-[13px] font-semibold text-[#1a2744] mb-3">Airlines</p>
              <div className="space-y-2">
                {airlineOptions.map(airline => (
                  <label key={airline} className="flex items-center gap-2 text-sm text-[#1a2744] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAirlines.includes(airline)}
                      onChange={() => toggle(selectedAirlines, airline, setSelectedAirlines)}
                      className="accent-[#c9a84c]"
                    />
                    {airline}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          {durationOptions.length > 0 && (
            <div>
              <p className="text-[13px] font-semibold text-[#1a2744] mb-3">Duration</p>
              <div className="space-y-2">
                {durationOptions.map(days => (
                  <label key={days} className="flex items-center gap-2 text-sm text-[#1a2744] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDurations.includes(days)}
                      onChange={() => toggle(selectedDurations, days, setSelectedDurations)}
                      className="accent-[#c9a84c]"
                    />
                    {days} Days
                  </label>
                ))}
              </div>
            </div>
          )}

          {(selectedAirlines.length > 0 || selectedDurations.length > 0 || priceRange[0] !== priceBounds.min || priceRange[1] !== priceBounds.max) && (
            <button
              onClick={() => { setSelectedAirlines([]); setSelectedDurations([]); setPriceRange([priceBounds.min, priceBounds.max]) }}
              className="w-full mt-6 text-xs text-[#6b7a99] hover:text-[#1a2744] underline"
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Custom package CTA banner */}
          <div className="bg-gradient-to-br from-[#0a1628] to-[#1a2744] rounded-2xl p-6 mb-5 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="text-white/70 text-sm mb-1">Can't find the right fit?</p>
              <h2 className="font-playfair text-xl font-bold text-white">Talk to our Umrah advisors directly</h2>
            </div>
            <a
              href={`/${orgSlug}#book`}
              className="flex items-center gap-2 bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0a1628] font-semibold px-5 py-3 rounded-xl whitespace-nowrap hover:opacity-90 transition-opacity"
            >
              Request a Custom Package
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Sort bar */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-black/06 p-1.5 mb-5 w-full sm:w-fit overflow-x-auto">
            {([
              { key: 'recommended' as const, label: 'Recommended' },
              { key: 'price_asc'   as const, label: 'Price: Low to High' },
              { key: 'price_desc'  as const, label: 'Price: High to Low' },
            ]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  sortBy === opt.key ? 'bg-[#0a1628] text-white' : 'text-[#6b7a99] hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="text-[#6b7a99] text-sm mb-4">
            {filtered.length} package{filtered.length !== 1 ? 's' : ''} found
          </p>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/06 p-12 text-center text-[#6b7a99] text-sm">
              No packages match these filters — try widening your price range or clearing a filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(({ pkg, displayPrice }) => (
                <PackageCard key={pkg.id} pkg={pkg} displayPrice={displayPrice} onClick={() => setActivePackage(pkg)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {activePackage && (
        <BookingLauncher pkg={activePackage} orgSlug={orgSlug} onClose={() => setActivePackage(null)} />
      )}

      <style jsx>{`
        .price-slider input[type='range']::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #0a1628;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }
        .price-slider input[type='range']::-moz-range-thumb {
          pointer-events: auto;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #0a1628;
          cursor: pointer;
          border: 2px solid white;
        }
        .price-slider input[type='range']::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  )
}