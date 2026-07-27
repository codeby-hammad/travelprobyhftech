'use client'

import { Calendar, ArrowRight } from 'lucide-react'
import AirlineLogo from '@/components/shared/AirlineLogo'
import { type Package, typeMeta, startingPrice, formatDateRange } from './packageTypes'

export default function PackageCard({
  pkg,
  onClick,
  disabled = false,
  displayPrice,
}: {
  pkg: Package
  onClick?: () => void
  disabled?: boolean
  displayPrice?: number | null
}) {
  const meta = typeMeta(pkg.package_type)
  const price = displayPrice !== undefined ? displayPrice : startingPrice(pkg)
  const dateRange = formatDateRange(pkg.departure_date, pkg.return_date)
  const featured = Boolean(pkg.is_featured)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'group relative rounded-[18px] overflow-hidden h-[280px] block w-full text-left transition-transform duration-300',
        disabled ? 'cursor-default' : 'hover:-translate-y-1',
        featured ? 'ring-2 ring-[#c9a84c]' : '',
      ].join(' ')}
    >
      {/* Photo, or gradient + emoji fallback until an image is uploaded */}
      {pkg.image_url ? (
        <img
          src={pkg.image_url}
          alt={pkg.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.bg}`}>
          <span className="text-[64px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90">
            {meta.emoji}
          </span>
        </div>
      )}

      {/* Scrim so white text stays legible over any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/35" />

      {/* Top badges: airline + departure city */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
        {(pkg.airline || pkg.airline_iata_code) ? (
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full pl-1 pr-3 py-1">
            <AirlineLogo airlineName={pkg.airline} iataCode={pkg.airline_iata_code} size={20} />
            <span className="text-white text-[12px] font-semibold">
              {pkg.airline ?? pkg.airline_iata_code}
            </span>
          </div>
        ) : <span />}
        {pkg.departure_city_code && (
          <span className="bg-black/40 backdrop-blur-sm text-white text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
            ✈ {pkg.departure_city_code}
          </span>
        )}
      </div>

      {/* Bottom content: name, dates, price, CTA arrow */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-[17px] leading-snug mb-2 truncate">
          {pkg.name}
        </h3>

        {dateRange && (
          <div className="flex items-center gap-1.5 text-white/75 text-[12.5px] mb-3">
            <Calendar size={13} />
            {dateRange}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="block text-white/60 text-[11px] mb-0.5">Starting From</span>
            <span className="block text-white font-bold text-[18px]">
              {price != null
                ? `${pkg.currency ?? 'PKR'} ${Number(price).toLocaleString()}`
                : 'Contact us'}
            </span>
          </div>
          <span className="w-9 h-9 rounded-full bg-white text-[#0a1628] flex items-center justify-center shrink-0 group-hover:bg-[#c9a84c] transition-colors">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </button>
  )
}