import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { Package, Plus, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  active:    'bg-green-50  text-green-700',
  expired:   'bg-gray-100  text-gray-500',
  sold_out:  'bg-blue-50   text-blue-700',
  cancelled: 'bg-red-50    text-red-700',
}

export default async function InventoryPage() {
  const supabase = await createClient()

 const { data: batches } = await supabase
  .from('ticket_batch_summary')
  .select('*')
  .neq('batch_number', 'SPOT')   // hide spot placeholder from batch list
  .order('created_at', { ascending: false })
  
  // Summary stats
  const totalInvestment  = batches?.reduce((s, b) => s + Number(b.total_investment),  0) ?? 0
  const totalRevenue     = batches?.reduce((s, b) => s + Number(b.total_revenue),     0) ?? 0
  const totalProfit      = batches?.reduce((s, b) => s + Number(b.gross_profit),      0) ?? 0
  const totalAvailable   = batches?.reduce((s, b) => s + Number(b.seats_available),   0) ?? 0

  // Expiring soon (within 7 days)
  const expiringSoon = batches?.filter(b => {
    if (!b.expiry_date || b.status !== 'active') return false
    const days = Math.ceil(
      (new Date(b.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return days <= 7 && days >= 0
  }) ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bulk seat purchases aur stock management
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/subagents"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
            Sub-Agents
          </Link>
          <Link href="/dashboard/inventory/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <Plus size={16} /> Buy Ticket Batch
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total investment',
            value: formatCurrency(totalInvestment),
            sub:   `${batches?.length ?? 0} batches`,
            color: 'text-blue-600',
            bg:    'bg-blue-50',
          },
          {
            label: 'Total revenue',
            value: formatCurrency(totalRevenue),
            sub:   'From sold seats',
            color: 'text-purple-600',
            bg:    'bg-purple-50',
          },
          {
            label: 'Gross profit',
            value: formatCurrency(totalProfit),
            sub:   totalInvestment > 0
              ? `${Math.round((totalProfit / totalInvestment) * 100)}% ROI`
              : '0% ROI',
            color: totalProfit >= 0 ? 'text-green-600' : 'text-red-600',
            bg:    totalProfit >= 0 ? 'bg-green-50'    : 'bg-red-50',
          },
          {
            label: 'Seats available',
            value: totalAvailable,
            sub:   'Ready to sell',
            color: 'text-orange-600',
            bg:    'bg-orange-50',
          },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <TrendingUp size={18} className={card.color} />
            </div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Expiry alert */}
      {expiringSoon.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange-600" />
            <p className="font-semibold text-orange-800 text-sm">
              {expiringSoon.length} batch(es) expiring within 7 days!
            </p>
          </div>
          <div className="space-y-1">
            {expiringSoon.map((b: any) => (
              <p key={b.id} className="text-sm text-orange-700">
                • {b.batch_number} — {b.route_from}→{b.route_to} —{' '}
                {b.seats_available} seats left — expires {formatDate(b.expiry_date)}
              </p>
            ))}
          </div>
        </div>
      )}

      {(!batches || batches.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No ticket batches yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Bulk mein seats khareed kar inventory shuru karein
          </p>
          <Link href="/dashboard/inventory/new"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            <Plus size={15} /> Buy First Batch
          </Link>
        </div>
      )}

      {/* Batches grid */}
      <div className="space-y-3">
        {batches?.map((b: any) => {
          const soldPct = b.total_seats > 0
            ? Math.round((b.seats_sold / b.total_seats) * 100)
            : 0
          const profit     = Number(b.gross_profit)
          const investment = Number(b.total_investment)
          const roi        = investment > 0
            ? Math.round((profit / investment) * 100 * 10) / 10
            : 0

          return (
            <Link key={b.id} href={`/dashboard/inventory/${b.id}`}
              className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-100 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 rounded-xl p-3 text-center min-w-16">
                    <p className="text-xs text-blue-400 font-medium">
                      {b.airline?.slice(0, 3).toUpperCase()}
                    </p>
                    <p className="text-lg font-black text-blue-700">
                      {b.seats_available}
                    </p>
                    <p className="text-xs text-blue-400">left</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-blue-600 font-bold text-sm">
                        {b.batch_number}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[b.status]}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 text-lg">
                      {b.route_from} → {b.route_to}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {b.airline}
                      {b.flight_number && ` ${b.flight_number}`} •{' '}
                      {formatDate(b.flight_date)} •{' '}
                      <span className="capitalize">{b.seat_class}</span>
                    </p>
                  </div>
                </div>

                {/* ROI badge */}
                <div className={`text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="text-2xl font-black">
                    {profit >= 0 ? '+' : ''}{roi}%
                  </p>
                  <p className="text-xs opacity-70">ROI</p>
                </div>
              </div>

              {/* Seat progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{b.seats_sold} sold</span>
                  <span>{b.seats_available} available</span>
                  <span>{b.total_seats} total</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${soldPct}%` }}
                    />
                    {b.seats_reserved > 0 && (
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${Math.round((b.seats_reserved / b.total_seats) * 100)}%` }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                    Sold {soldPct}%
                  </span>
                  {b.seats_reserved > 0 && (
                    <span className="flex items-center gap-1 text-yellow-600">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" />
                      Reserved {b.seats_reserved}
                    </span>
                  )}
                </div>
              </div>

              {/* Financial row */}
              <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-50">
                {[
                  {
                    label: 'Cost/seat',
                    value: formatCurrency(b.cost_per_seat, b.currency),
                    color: 'text-gray-900',
                  },
                  {
                    label: 'Retail price',
                    value: formatCurrency(b.retail_price, b.currency),
                    color: 'text-blue-600',
                  },
                  {
                    label: 'Revenue',
                    value: formatCurrency(b.total_revenue, b.currency),
                    color: 'text-purple-600',
                  },
                  {
                    label: 'Profit so far',
                    value: formatCurrency(profit, b.currency),
                    color: profit >= 0 ? 'text-green-600' : 'text-red-600',
                  },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {b.expiry_date && (
                <p className={`text-xs mt-2 ${
                  new Date(b.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    ? 'text-orange-500 font-medium'
                    : 'text-gray-400'
                }`}>
                  Expiry: {formatDate(b.expiry_date)}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}