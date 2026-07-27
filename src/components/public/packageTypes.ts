export type Package = {
  id:                  string
  organization_id:     string
  name:                string
  description:         string | null
  package_type:        string | null
  image_url:           string | null
  destination_code:    string | null
  departure_city_code: string | null
  route_code:          string | null
  departure_date:      string | null
  return_date:         string | null
  duration_days:       number | null
  base_price:          number | null
  price_quad:          number | null
  price_triple:        number | null
  price_double:        number | null
  currency:            string | null
  airline:             string | null
  airline_iata_code:   string | null
  makkah_hotel:        string | null
  madinah_hotel:       string | null
  makkah_nights:       number | null
  madinah_nights:      number | null
  includes_flight:     boolean | null
  includes_hotel:      boolean | null
  includes_visa:       boolean | null
  visa_included:       boolean | null
  transport_included:  boolean | null
  is_featured:         boolean | null
}

export const PACKAGE_SELECT_FIELDS = `
  id, organization_id, name, description, package_type, image_url,
  destination_code, departure_city_code, route_code,
  departure_date, return_date, duration_days,
  base_price, price_quad, price_triple, price_double, currency,
  airline, airline_iata_code,
  makkah_hotel, madinah_hotel, makkah_nights, madinah_nights,
  includes_flight, includes_hotel, includes_visa, visa_included, transport_included,
  is_featured, is_active
`

export const TYPE_META: Record<string, { emoji: string; bg: string }> = {
  umrah:   { emoji: '🕋', bg: 'from-[#1a3a6b] to-[#0a1628]' },
  hajj:    { emoji: '🤲', bg: 'from-[#2d1b00] to-[#1a0f00]' },
  tour:    { emoji: '🌍', bg: 'from-[#1a2a5e] to-[#0a1030]' },
  ziarat:  { emoji: '🕌', bg: 'from-[#1a2744] to-[#0a1628]' },
  general: { emoji: '✈️', bg: 'from-[#1a1a3e] to-[#0a0a1e]' },
}

export function typeMeta(type?: string | null) {
  return TYPE_META[type ?? 'general'] ?? TYPE_META.general
}

export function startingPrice(pkg: Package): number | null {
  const prices = [pkg.price_double, pkg.price_triple, pkg.price_quad, pkg.base_price]
    .filter((p): p is number => typeof p === 'number' && p > 0)
  return prices.length ? Math.min(...prices) : null
}

export function formatDateRange(start?: string | null, end?: string | null): string | null {
  if (!start) return null
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
  const startLabel = new Date(start).toLocaleDateString('en-GB', opts)
  if (!end) return startLabel
  const endLabel = new Date(end).toLocaleDateString('en-GB', opts)
  return `${startLabel} - ${endLabel}`
}

// Packages duplicated via "Duplicate Package" (same flight, different hotel)
// share this key. Used both to collapse them into one public card, and by
// BookingFlowModal to find the accommodation variants for a chosen package.
export function groupKey(pkg: Package): string {
  return pkg.route_code || `${pkg.departure_date ?? ''}|${pkg.departure_city_code ?? ''}|${pkg.airline_iata_code ?? ''}`
}

export type DisplayPackage = { pkg: Package; displayPrice: number | null }

// Collapses hotel-variant duplicates into a single public-facing card per
// route/flight. The representative shown is whichever package in the group
// is marked featured (falling back to the first one from the query, which
// is already ordered featured-first, newest-first) — but the price shown is
// always the cheapest across every variant in that group, since that's the
// honest "Starting From" figure once all hotel options are considered.
export function dedupePackagesForDisplay(packages: Package[]): DisplayPackage[] {
  const groups = new Map<string, Package[]>()
  for (const p of packages) {
    const key = groupKey(p)
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  return Array.from(groups.values()).map(group => {
    const representative = group.find(p => p.is_featured) ?? group[0]
    const prices = group.map(startingPrice).filter((p): p is number => p != null)
    const displayPrice = prices.length ? Math.min(...prices) : null
    return { pkg: representative, displayPrice }
  })
}