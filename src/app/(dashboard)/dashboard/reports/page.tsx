import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import RevenueChart from '@/components/reports/RevenueChart'
import ProfitChart  from '@/components/reports/ProfitChart'
import { TrendingUp, Users, Calendar, DollarSign, Receipt } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  const [
    { data: bookings      },
    { data: payments      },
    { data: clients       },
    { data: profitData    },
    { data: monthlyPnl    },
  ] = await Promise.all([
    supabase.from('bookings').select('*, client:clients(full_name)').eq('organization_id', orgId),
    supabase.from('payments').select('*').eq('organization_id', orgId).eq('status', 'completed').order('paid_at', { ascending: true }),
    supabase.from('clients').select('id').eq('organization_id', orgId),
    supabase.from('booking_profit_summary').select('*').eq('organization_id', orgId),
    supabase.from('monthly_pnl').select('*').eq('organization_id', orgId).limit(6),
  ])

  // KPI calculations
  const totalRevenue    = bookings?.reduce((s, b) => s + Number(b.total_amount), 0) ?? 0
  const collectedAmount = bookings?.reduce((s, b) => s + Number(b.paid_amount),  0) ?? 0
  const totalCosts      = profitData?.reduce((s, p) => s + Number(p.total_cost), 0) ?? 0
  const totalProfit     = totalRevenue - totalCosts
  const profitMargin    = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100 * 10) / 10 : 0
  const totalBookings   = bookings?.length ?? 0
  const confirmedCount  = bookings?.filter(b => b.status === 'confirmed').length ?? 0
  const totalClients    = clients?.length ?? 0

  // Monthly data for charts
  const monthlyData     = buildMonthlyData(payments ?? [])

  // Top profitable bookings
  const topProfitable   = (profitData ?? [])
    .filter(p => p.expense_count > 0)
    .sort((a, b) => Number(b.gross_profit) - Number(a.gross_profit))
    .slice(0, 5)

  // Top clients
  const clientTotals: Record<string, { name: string; total: number; count: number }> = {}
  bookings?.forEach((b: any) => {
    if (!b.client) return
    if (!clientTotals[b.client_id]) {
      clientTotals[b.client_id] = { name: b.client.full_name, total: 0, count: 0 }
    }
    clientTotals[b.client_id].total += Number(b.total_amount)
    clientTotals[b.client_id].count += 1
  })
  const topClients = Object.values(clientTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Status breakdown
  const statusData = [
    { label: 'Confirmed',  value: confirmedCount, color: 'bg-green-500'  },
    { label: 'Completed',  value: bookings?.filter(b => b.status === 'completed').length ?? 0, color: 'bg-blue-500'  },
    { label: 'Inquiry',    value: bookings?.filter(b => b.status === 'inquiry').length   ?? 0, color: 'bg-yellow-500'},
    { label: 'Cancelled',  value: bookings?.filter(b => b.status === 'cancelled').length ?? 0, color: 'bg-red-400'  },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Full overview of your agency performance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          {
            label: 'Total revenue',
            value: formatCurrency(totalRevenue),
            icon:  DollarSign,
            color: 'text-purple-600',
            bg:    'bg-purple-50',
            sub:   `${formatCurrency(collectedAmount)} collected`,
          },
          {
            label: 'Gross profit',
            value: formatCurrency(totalProfit),
            icon:  TrendingUp,
            color: totalProfit >= 0 ? 'text-green-600' : 'text-red-600',
            bg:    totalProfit >= 0 ? 'bg-green-50'    : 'bg-red-50',
            sub:   `${profitMargin}% margin`,
          },
          {
            label: 'Total bookings',
            value: totalBookings,
            icon:  Calendar,
            color: 'text-blue-600',
            bg:    'bg-blue-50',
            sub:   `${confirmedCount} confirmed`,
          },
          {
            label: 'Total clients',
            value: totalClients,
            icon:  Users,
            color: 'text-orange-600',
            bg:    'bg-orange-50',
            sub:   `${topClients.length} with bookings`,
          },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly revenue collected</h2>
          <RevenueChart data={monthlyData} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Bookings by status</h2>
          {totalBookings === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {statusData.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-medium text-gray-900">
                      {s.value} ({totalBookings > 0
                        ? Math.round((s.value / totalBookings) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full`}
                      style={{ width: `${totalBookings > 0 ? (s.value / totalBookings) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly P&L table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Monthly Profit & Loss</h2>
        </div>
        {(!monthlyPnl || monthlyPnl.length === 0) ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No data yet — add expenses to bookings to see P&L
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Month</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Bookings</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Revenue</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Costs</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Profit</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyPnl.map((row: any) => {
                const profit = Number(row.gross_profit)
                return (
                  <tr key={row.month} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{row.month_label}</td>
                    <td className="px-5 py-3 text-gray-500">{row.total_bookings}</td>
                    <td className="px-5 py-3 text-gray-900">{formatCurrency(row.total_revenue)}</td>
                    <td className="px-5 py-3 text-orange-600">{formatCurrency(row.total_costs)}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        Number(row.profit_margin) >= 15 ? 'bg-green-50  text-green-700'  :
                        Number(row.profit_margin) >= 5  ? 'bg-yellow-50 text-yellow-700' :
                                                           'bg-red-50    text-red-700'
                      }`}>
                        {row.profit_margin}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Top profitable bookings */}
      {topProfitable.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Most profitable bookings</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Booking</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Revenue</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Cost</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Profit</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topProfitable.map((p: any) => (
                <tr key={p.booking_id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-blue-600 font-medium">
                    {p.booking_ref}
                  </td>
                  <td className="px-5 py-3">{formatCurrency(p.selling_price, p.currency)}</td>
                  <td className="px-5 py-3 text-orange-600">{formatCurrency(p.total_cost, p.currency)}</td>
                  <td className="px-5 py-3 font-semibold text-green-600">
                    +{formatCurrency(p.gross_profit, p.currency)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                      {p.profit_margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top clients */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Top clients by value</h2>
        </div>
        {topClients.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No data yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Client</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Bookings</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Total value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topClients.map((c, i) => (
                <tr key={c.name} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{c.count}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">
                    {formatCurrency(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function buildMonthlyData(payments: any[]) {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d     = new Date()
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const y     = d.getFullYear()
    const m     = d.getMonth()
    const revenue = payments
      .filter(p => {
        const pd = new Date(p.paid_at)
        return pd.getFullYear() === y && pd.getMonth() === m
      })
      .reduce((s, p) => s + Number(p.amount), 0)
    months.push({ month: label, revenue })
  }
  return months
}