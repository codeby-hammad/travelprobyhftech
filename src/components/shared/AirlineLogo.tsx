'use client'

import { useState } from 'react'
import { Plane } from 'lucide-react'

// Common Pakistani + Gulf/Umrah-route airlines, mapped from full name to
// IATA code, so existing packages that only stored a free-text airline name
// (e.g. "Saudia", "PIA") can still resolve a logo without re-entering data.
const KNOWN_AIRLINES: Record<string, string> = {
  'saudia':            'SV',
  'saudi arabian airlines': 'SV',
  'pia':               'PK',
  'pakistan international airlines': 'PK',
  'emirates':          'EK',
  'qatar airways':     'QR',
  'etihad':            'EY',
  'etihad airways':    'EY',
  'flynas':            'XY',
  'flyadeal':          'F3',
  'airblue':           'PA',
  'serene air':        'ER',
  'turkish airlines':  'TK',
  'gulf air':          'GF',
  'oman air':          'WY',
  'kuwait airways':    'KU',
}

function resolveIataCode(airlineName?: string | null, explicitCode?: string | null): string | null {
  if (explicitCode) return explicitCode.trim().toUpperCase()
  if (!airlineName) return null
  return KNOWN_AIRLINES[airlineName.trim().toLowerCase()] ?? null
}

export default function AirlineLogo({
  airlineName,
  iataCode,
  size = 40,
  className = '',
}: {
  airlineName?: string | null
  iataCode?: string | null
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const code = resolveIataCode(airlineName, iataCode)

  if (!code || failed) {
    return (
      <div
        className={`bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Plane size={Math.round(size * 0.5)} className="text-emerald-600" />
      </div>
    )
  }

  return (
    <div
      className={`bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Free public airline-logo CDN, keyed by IATA code — no hosting/upload needed */}
      <img
        src={`https://pics.avs.io/200/200/${code}.png`}
        alt={airlineName ?? code}
        width={size}
        height={size}
        className="object-contain p-1"
        onError={() => setFailed(true)}
      />
    </div>
  )
}