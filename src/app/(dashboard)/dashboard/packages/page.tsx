import { createClient }  from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link              from 'next/link'
import { Plus, Package, Plane, Image as ImageIcon, Trash2, MessageCircle, Building2 } from 'lucide-react'
import { Button }        from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PackageActions    from '@/components/packages/PackageActions'
import DuplicatePackageButton from '@/components/packages/DuplicatePackageButton'
import AirlineLogo       from '@/components/shared/AirlineLogo'

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
}

// Groups packages that share the same flight leg (route + dates + flight
// numbers) into one "trip" block, since the reference UI shows one flight
// header with several hotel/price combinations underneath it — not one
// flight header per package.
function groupByFlight(packages: any[]) {
  const groups: Record<string, any[]> = {}
  packages.forEach(pkg => {
    const key = [
      pkg.route_code, pkg.airline, pkg.flight_number_out, pkg.flight_number_return,
      pkg.departure_date, pkg.return_date,
    ].join('|')
    if (!groups[key]) groups[key] = []
    groups[key].push(pkg)
  })
  return Object.values(groups)
}

export default async function PackagesPage() {
  const supabase = await createClient()

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const total  = packages?.length ?? 0
  const groups = groupByFlight(packages ?? [])

  return (
    <div className="p-6 max-w-[1500px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Packages</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{total} active packages · {groups.length} flight groups</p>
        </div>
        <Link href="/dashboard/packages/new">
          <Button size="sm" className="h-8 text-[12px] bg-slate-900 hover:bg-slate-800 gap-1.5">
            <Plus size={12} /> Add Package
          </Button>
        </Link>
      </div>

      {(!packages || packages.length === 0) ? (
        <Card className="border-slate-100 shadow-none">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package size={20} className="text-slate-400" />
            </div>
            <p className="text-[14px] font-medium text-slate-600 mb-1">No packages yet</p>
            <p className="text-[13px] text-slate-400 mb-4">Create your first travel package</p>
            <Link href="/dashboard/packages/new">
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-[12px] gap-1.5">
                <Plus size={12} /> Add Package
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group, gi) => {
            const first = group[0]
            const seatsLeft = group.reduce((min, p) => {
              const left = (p.total_seats ?? 0) - (p.seats_booked ?? 0)
              return p.total_seats ? Math.min(min, left) : min
            }, Infinity)
            const cheapest = Math.min(...group.map(p => Number(p.base_price ?? 0)))

            return (
              <Card key={gi} className="border-slate-200 shadow-none overflow-hidden">

                {/* Flight route header — two-row timeline matching the reference layout */}
                <div className="p-5 flex items-center justify-between flex-wrap gap-4 bg-white border-b border-slate-100">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <AirlineLogo airlineName={first.airline} iataCode={first.airline_iata_code} size={56} />

                    <div className="shrink-0">
                      <p className="text-[15px] font-bold text-slate-900 leading-tight">
                        {first.route_code || `${first.departure_city ?? '—'}-${first.destination ?? '—'}`}
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">
                        {first.airline ?? 'Airline TBD'}
                      </p>
                    </div>

                    {/* Two-row timeline: outbound leg, then return leg */}
                    <div className="hidden lg:flex flex-col gap-2.5 flex-1 min-w-0 pl-2">

                      {/* Outbound row */}
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md w-14 text-center shrink-0">
                          {first.departure_city_code ?? first.departure_city?.slice(0, 3).toUpperCase() ?? '—'}
                        </span>
                        <div className="text-left shrink-0 w-24">
                          <p className="text-[12px] font-semibold text-slate-800 leading-tight">{fmtDate(first.departure_date)}</p>
                          <p className="text-[11px] text-slate-400 leading-tight">{first.departure_time ?? ''}</p>
                        </div>

                        <div className="flex items-center flex-1 min-w-[70px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span className="flex-1 h-px bg-emerald-600" />
                        </div>
                        <div className="text-center shrink-0 px-2">
                          <p className="text-[12px] font-bold text-slate-800 leading-tight">{first.flight_number_out ?? '—'}</p>
                          <p className="text-[10px] text-slate-400 leading-tight whitespace-nowrap">{first.baggage_out ?? ''}</p>
                        </div>
                        <div className="flex items-center flex-1 min-w-[70px]">
                          <span className="flex-1 h-px bg-emerald-600" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        </div>

                        <div className="text-right shrink-0 w-24">
                          <p className="text-[12px] font-semibold text-slate-800 leading-tight">{fmtDate(first.departure_date)}</p>
                          <p className="text-[11px] text-slate-400 leading-tight">{first.arrival_time ?? ''}</p>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md w-14 text-center shrink-0">
                          {first.destination_code ?? first.destination?.slice(0, 3).toUpperCase() ?? '—'}
                        </span>
                      </div>

                      {/* Return row */}
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md w-14 text-center shrink-0">
                          {first.destination_code ?? first.destination?.slice(0, 3).toUpperCase() ?? '—'}
                        </span>
                        <div className="text-left shrink-0 w-24">
                          <p className="text-[12px] font-semibold text-slate-800 leading-tight">{fmtDate(first.return_date)}</p>
                          <p className="text-[11px] text-slate-400 leading-tight">{first.return_departure_time ?? ''}</p>
                        </div>

                        <div className="flex items-center flex-1 min-w-[70px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span className="flex-1 h-px bg-emerald-600" />
                        </div>
                        <div className="text-center shrink-0 px-2">
                          <p className="text-[12px] font-bold text-slate-800 leading-tight">{first.flight_number_return ?? '—'}</p>
                          <p className="text-[10px] text-slate-400 leading-tight whitespace-nowrap">{first.baggage_return ?? ''}</p>
                        </div>
                        <div className="flex items-center flex-1 min-w-[70px]">
                          <span className="flex-1 h-px bg-emerald-600" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        </div>

                        <div className="text-right shrink-0 w-24">
                          <p className="text-[12px] font-semibold text-slate-800 leading-tight">{fmtDate(first.return_date)}</p>
                          <p className="text-[11px] text-slate-400 leading-tight">{first.return_arrival_time ?? ''}</p>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md w-14 text-center shrink-0">
                          {first.departure_city_code ?? first.departure_city?.slice(0, 3).toUpperCase() ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-right">
                      <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Package Price From</p>
                      <p className="text-[18px] font-bold text-emerald-700">{formatCurrency(cheapest, first.currency)}</p>
                      <p className="text-[10px] text-emerald-500">Per Person</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {first.duration_days && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-center">
                          {first.duration_days} Days
                        </span>
                      )}
                      {seatsLeft !== Infinity && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg text-center">
                          {seatsLeft} seats left
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-header strip */}
                <div className="px-5 py-2 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Per Person Price</span>
                    <span className="text-[12px] text-emerald-700">Includes visa, ticket, accommodation & transport</span>
                  </div>
                  <DuplicatePackageButton pkg={first} label="+ Add hotel to this flight" />
                </div>

                {/* Pricing table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-emerald-700 text-white">
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide">Package</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide">Makkah Hotel</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide">Madinah Hotel</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide">Sharing</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide">Quad</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide">Triple</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide">Double</th>
                        <th className="px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.map((pkg: any, i: number) => (
                        <tr key={pkg.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="px-4 py-3 align-top">
                            <Link href={`/dashboard/packages/${pkg.id}`} className="font-mono text-[12px] font-bold text-emerald-700 hover:underline">
                              {pkg.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] shrink-0">🕋</span>
                              <p className="text-[12px] font-bold text-slate-800">{pkg.makkah_hotel ?? '—'}</p>
                            </div>
                            <p className="text-[11px] text-slate-400 pl-[18px]">
                              {pkg.makkah_hotel_distance ?? ''}{pkg.makkah_hotel_distance && pkg.makkah_nights ? ' | ' : ''}
                              {pkg.makkah_nights ? `${pkg.makkah_nights} nights` : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] shrink-0">🕌</span>
                              <p className="text-[12px] font-bold text-slate-800">{pkg.madinah_hotel ?? '—'}</p>
                            </div>
                            <p className="text-[11px] text-slate-400 pl-[18px]">
                              {pkg.madinah_hotel_distance ?? ''}{pkg.madinah_hotel_distance && pkg.madinah_nights ? ' | ' : ''}
                              {pkg.madinah_nights ? `${pkg.madinah_nights} nights` : ''}
                            </p>
                          </td>
                          {[
                            { price: pkg.base_price, tier: 'sharing' },
                            { price: pkg.price_quad, tier: 'quad' },
                            { price: pkg.price_triple, tier: 'triple' },
                            { price: pkg.price_double, tier: 'double' },
                          ].map(col => (
                            <td key={col.tier} className="px-4 py-3 text-right align-top">
                              {col.price != null ? (
                                <>
                                  <p className="text-[13px] font-bold text-slate-900">
                                    {Number(col.price).toLocaleString()}
                                  </p>
                                  <Link
                                    href={`/dashboard/bookings/new?package_id=${pkg.id}&room_type=${col.tier}`}
                                    className="text-[11px] text-blue-600 hover:underline font-medium"
                                  >
                                    Book Now
                                  </Link>
                                </>
                              ) : (
                                <span className="text-[12px] text-slate-300">—</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-center gap-1">
                              <DuplicatePackageButton pkg={pkg} />
                              <PackageActions packageId={pkg.id} packageName={pkg.name} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}