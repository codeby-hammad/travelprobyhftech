import { createClient }    from '@/lib/supabase/server'
import { notFound }        from 'next/navigation'
import Link                from 'next/link'
import { ArrowLeft, Users }       from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import SellSeatModal       from '@/components/inventory/SellSeatModal'
import BatchSeatGrid       from '@/components/inventory/BatchSeatGrid'

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

const [
  { data: batch   },
  { data: seats   },
  { data: clients },
  { data: agents  },
] = await Promise.all([
  supabase
    .from('ticket_batch_summary')
    .select('*')
    .eq('id', id)
    .single(),
  supabase
    .from('ticket_seats')
    .select('*, client:clients(full_name), sub_agent:sub_agents(name)')
    .eq('batch_id', id)
    .order('created_at'),
  supabase
    .from('clients')
    .select('id, full_name, phone')
    .order('full_name'),
  supabase
    .from('sub_agents')
    .select('id, name, current_balance, credit_limit')
    .eq('is_active', true)
    .order('name'),
])

  if (!batch) notFound()

const [{ data: org }, { data: groupSales }, { data: legs }, { data: pricing }] =
  await Promise.all([
    supabase
      .from('organizations')
      .select('*')
      .eq('id', batch.organization_id)
      .single(),
    supabase
      .from('ticket_group_sales')
      .select('*, lead_client:clients(full_name)')
      .eq('batch_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('ticket_flight_legs')
      .select('*')
      .eq('batch_id', id)
      .order('leg_number'),
    supabase
      .from('ticket_batch_pricing')
      .select('*')
      .eq('batch_id', id)
      .order('age_category'),
  ])

  const profit   = Number(batch.gross_profit)
  const roi      = Number(batch.total_investment) > 0
    ? Math.round((profit / Number(batch.total_investment)) * 100 * 10) / 10
    : 0

  const statusColors: Record<string, string> = {
    available: 'bg-green-50  text-green-700 border-green-200',
    reserved:  'bg-yellow-50 text-yellow-700 border-yellow-200',
    sold:      'bg-blue-50   text-blue-700   border-blue-200',
    returned:  'bg-red-50    text-red-700    border-red-200',
    expired:   'bg-gray-100  text-gray-500   border-gray-200',
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/inventory" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {batch.batch_number}
            </h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
              batch.status === 'active'   ? 'bg-green-50 text-green-700' :
              batch.status === 'sold_out' ? 'bg-blue-50  text-blue-700'  :
                                            'bg-gray-100 text-gray-600'
            }`}>
              {batch.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {batch.airline} • {batch.route_from} → {batch.route_to} •{' '}
            {formatDate(batch.flight_date)} •{' '}
            <span className="capitalize">{batch.seat_class}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Left: stats */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total seats',     value: batch.total_seats,       color: 'text-gray-900'   },
            { label: 'Seats sold',      value: batch.seats_sold,        color: 'text-blue-600'   },
            { label: 'Available',       value: batch.seats_available,   color: 'text-green-600'  },
            { label: 'Reserved',        value: batch.seats_reserved,    color: 'text-yellow-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Right: profit */}
        <div className={`rounded-xl p-5 border ${
          profit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          <p className="text-xs text-gray-500 mb-1">Profit so far</p>
          <p className={`text-3xl font-black ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {profit >= 0 ? '+' : ''}{formatCurrency(profit, batch.currency)}
          </p>
          <p className="text-sm text-gray-500 mt-2">ROI: {roi}%</p>
          <div className="mt-3 pt-3 border-t border-green-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Investment</span>
              <span className="font-medium">{formatCurrency(batch.total_investment, batch.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Revenue</span>
              <span className="font-medium text-green-600">{formatCurrency(batch.total_revenue, batch.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pending collection</span>
              <span className="font-medium text-orange-600">{formatCurrency(batch.pending_collection, batch.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h2 className="font-semibold text-gray-900 mb-3">Pricing</h2>
        <div className="grid grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Cost per seat',  value: formatCurrency(batch.cost_per_seat,  batch.currency), color: 'text-gray-900' },
            { label: 'Retail price',   value: formatCurrency(batch.retail_price,   batch.currency), color: 'text-blue-600' },
            { label: 'Agent price',    value: formatCurrency(batch.agent_price,    batch.currency), color: 'text-purple-600' },
            { label: 'Agency price',   value: formatCurrency(batch.agency_price,   batch.currency), color: 'text-orange-600' },
          ].map(p => (
            <div key={p.label}>
              <p className="text-xs text-gray-400 mb-0.5">{p.label}</p>
              <p className={`font-bold ${p.color}`}>{p.value}</p>
            </div>
          ))}
        </div>
      </div>

{/* Flight itinerary with legs/stopovers */}
{legs && legs.length > 0 && (
  <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
      ✈ Flight itinerary
      {legs.length > 1 && (
        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          {legs.length} legs — connecting flight
        </span>
      )}
    </h2>

    <div className="space-y-0">
      {legs.map((leg: any, i: number) => {
        const isLast = i === legs.length - 1
        return (
          <div key={leg.id}>
            <div className="flex items-center gap-4 py-3">
              {/* Departure */}
              <div className="text-center flex-1">
                <p className="text-lg font-black text-gray-900">
                  {leg.departure_city?.match(/\(([^)]+)\)/)?.[1] ?? leg.departure_city?.slice(0,3).toUpperCase()}
                </p>
                <p className="text-xs text-gray-400">{leg.departure_city}</p>
                {leg.departure_time && (
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    {new Date(leg.departure_time).toLocaleString('en-PK', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>

              {/* Flight info middle */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-blue-600 text-lg">✈</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <p className="text-xs font-bold text-gray-700 mt-1">
                  {leg.airline} {leg.flight_number}
                </p>
                {leg.terminal && (
                  <p className="text-xs text-gray-400">{leg.terminal}</p>
                )}
              </div>

              {/* Arrival */}
              <div className="text-center flex-1">
                <p className="text-lg font-black text-gray-900">
                  {leg.arrival_city?.match(/\(([^)]+)\)/)?.[1] ?? leg.arrival_city?.slice(0,3).toUpperCase()}
                </p>
                <p className="text-xs text-gray-400">{leg.arrival_city}</p>
                {leg.arrival_time && (
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    {new Date(leg.arrival_time).toLocaleString('en-PK', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Layover badge */}
            {!isLast && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-full">
                  🕐 Layover in {leg.arrival_city}
                  {leg.layover_minutes && (
                    <span className="font-bold">
                      {' '}
                      {leg.layover_minutes >= 60
                        ? `${Math.floor(leg.layover_minutes/60)}h ${leg.layover_minutes%60}m`
                        : `${leg.layover_minutes}m`
                      }
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  </div>
)}


      {/* Group sales list */}
{groupSales && groupSales.length > 0 && (
  <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
    <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
      <Users size={16} className="text-purple-600" />
      Group sales ({groupSales.length})
    </h2>
    <div className="space-y-2">
      {groupSales.map((gs: any) => (
        <Link key={gs.id}
          href={`/dashboard/inventory/${id}/group-sale/${gs.id}`}
          className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-purple-100 hover:bg-purple-50 transition">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-purple-600 font-bold text-sm">
                {gs.group_ref}
              </span>
              {gs.pnr && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono">
                  PNR: {gs.pnr}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {gs.total_pax} pax —{' '}
              {gs.adult_count}A/{gs.child_count}C/{gs.infant_count}I •{' '}
              {gs.lead_client?.full_name ?? gs.buyer_name ?? 'Walk-in'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">
              {formatCurrency(gs.total_amount, gs.currency)}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              gs.payment_status === 'received' ? 'bg-green-50 text-green-700' :
              gs.payment_status === 'partial'  ? 'bg-yellow-50 text-yellow-700' :
                                                  'bg-red-50 text-red-700'
            }`}>
              {gs.payment_status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  </div>
)}

      {/* Seats grid */}
      <BatchSeatGrid
  seats={seats         ?? []}
  batch={batch}
  pricing={pricing     ?? []}
  clients={clients     ?? []}
  subAgents={agents    ?? []}
  statusColors={statusColors}
  organization={org}
/>
    </div>
  )
}