import { createClient }  from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link              from 'next/link'
import {
  TrendingUp, TrendingDown, Wallet,
  Building, FileText, BarChart2
} from 'lucide-react'
import PnlChart from '@/components/financial/PnlChart'
import { requirePermission } from '@/lib/requirePermission'


export default async function FinancialPage() {
    await requirePermission('financial')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  const [
    { data: summary   },
    { data: monthlyPL },
    { data: cashFlow  },
  ] = await Promise.all([
    supabase
      .from('financial_summary')
      .select('*')
      .eq('organization_id', orgId)
      .single(),
    supabase
      .from('income_statement')
      .select('*')
      .eq('organization_id', orgId)
      .order('period', { ascending: false }),
    supabase
      .from('cash_flow')
      .select('*')
      .eq('organization_id', orgId)
      .order('period', { ascending: false }),
  ])

  // Build monthly P&L chart data — last 6 months
  const months    = buildMonthlyPnl(monthlyPL ?? [])
  const cashMonths = buildMonthlyCash(cashFlow ?? [])

  const totalIncome   = Number(summary?.total_income    ?? 0)
  const totalExpenses = Number(summary?.total_expenses  ?? 0)
  const netProfit     = Number(summary?.net_profit      ?? 0)
  const cashInHand    = Number(summary?.cash_in_hand    ?? 0)
  const bankBalance   = Number(summary?.bank_balance    ?? 0)
  const receivables   = Number(summary?.total_receivables ?? 0)
  const payables      = Number(summary?.total_payables    ?? 0)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            P&L Statement, Balance Sheet, Cash Flow
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/financial/pnl"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
            Full P&L
          </Link>
          <Link href="/dashboard/financial/balance-sheet"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
            Balance Sheet
          </Link>
          <Link href="/dashboard/accounts"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
            Accounts
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          {
            label: 'Total income',
            value: formatCurrency(totalIncome),
            icon:  TrendingUp,
            color: 'text-green-600',
            bg:    'bg-green-50',
          },
          {
            label: 'Total expenses',
            value: formatCurrency(totalExpenses),
            icon:  TrendingDown,
            color: 'text-red-600',
            bg:    'bg-red-50',
          },
          {
            label: 'Net profit',
            value: formatCurrency(netProfit),
            icon:  BarChart2,
            color: netProfit >= 0 ? 'text-green-600' : 'text-red-600',
            bg:    netProfit >= 0 ? 'bg-green-50'    : 'bg-red-50',
          },
          {
            label: 'Cash in hand',
            value: formatCurrency(cashInHand),
            icon:  Wallet,
            color: 'text-blue-600',
            bg:    'bg-blue-50',
          },
          {
            label: 'Receivables',
            value: formatCurrency(receivables),
            icon:  FileText,
            color: 'text-purple-600',
            bg:    'bg-purple-50',
          },
          {
            label: 'Payables',
            value: formatCurrency(payables),
            icon:  Building,
            color: 'text-orange-600',
            bg:    'bg-orange-50',
          },
        ].map(card => (
          <div key={card.label}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon size={17} className={card.color} />
            </div>
            <p className="text-xs text-gray-400">{card.label}</p>
            <p className={`font-bold text-sm mt-0.5 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            Monthly P&L — Last 6 months
          </h2>
          <PnlChart data={months} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            Cash flow — Last 6 months
          </h2>
          <PnlChart data={cashMonths} type="cash" />
        </div>
      </div>

      {/* Monthly summary table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Monthly P&L Summary</h2>
        </div>
        {months.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No financial data yet — add bookings and payments to see P&L
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left  px-5 py-3 text-gray-500 font-medium">Month</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Income</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Expenses</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Net profit</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {months.map((row: any) => {
                const margin = row.income > 0
                  ? Math.round((row.profit / row.income) * 100 * 10) / 10
                  : 0
                return (
                  <tr key={row.month} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{row.month}</td>
                    <td className="px-5 py-3 text-right text-green-600 font-medium">
                      {formatCurrency(row.income)}
                    </td>
                    <td className="px-5 py-3 text-right text-red-500">
                      {formatCurrency(row.expenses)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold ${
                        row.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {row.profit >= 0 ? '+' : ''}{formatCurrency(row.profit)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        margin >= 20 ? 'bg-green-50  text-green-700'  :
                        margin >= 10 ? 'bg-yellow-50 text-yellow-700' :
                        margin >= 0  ? 'bg-blue-50   text-blue-700'   :
                                        'bg-red-50    text-red-700'
                      }`}>
                        {margin}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-5 py-3 font-bold text-gray-900">Total</td>
                <td className="px-5 py-3 text-right font-bold text-green-600">
                  {formatCurrency(months.reduce((s, r) => s + r.income,   0))}
                </td>
                <td className="px-5 py-3 text-right font-bold text-red-500">
                  {formatCurrency(months.reduce((s, r) => s + r.expenses, 0))}
                </td>
                <td className="px-5 py-3 text-right font-bold">
                  <span className={
                    months.reduce((s, r) => s + r.profit, 0) >= 0
                      ? 'text-green-600' : 'text-red-600'
                  }>
                    {formatCurrency(months.reduce((s, r) => s + r.profit, 0))}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Cash flow breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cash flow by source</h2>
        </div>
        {cashMonths.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No cash transactions yet
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left  px-5 py-3 text-gray-500 font-medium">Month</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Cash in</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Cash out</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cashMonths.map((row: any) => (
                <tr key={row.month} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{row.month}</td>
                  <td className="px-5 py-3 text-right text-green-600 font-medium">
                    {formatCurrency(row.income)}
                  </td>
                  <td className="px-5 py-3 text-right text-red-500">
                    {formatCurrency(row.expenses)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-bold ${
                      row.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {row.profit >= 0 ? '+' : ''}{formatCurrency(row.profit)}
                    </span>
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

// Build last 6 months of P&L data
function buildMonthlyPnl(data: any[]) {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d     = new Date()
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const y     = d.getFullYear()
    const m     = d.getMonth() + 1

    const monthData = data.filter(row => {
      const pd = new Date(row.period)
      return pd.getFullYear() === y && pd.getMonth() + 1 === m
    })

    const income   = monthData
      .filter(r => r.account_type === 'income')
      .reduce((s, r) => s + Number(r.net_amount), 0)

    const expenses = monthData
      .filter(r => r.account_type === 'expense')
      .reduce((s, r) => s + Math.abs(Number(r.net_amount)), 0)

    months.push({ month: label, income, expenses, profit: income - expenses })
  }
  return months
}

// Build last 6 months of cash flow
function buildMonthlyCash(data: any[]) {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d     = new Date()
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const y     = d.getFullYear()
    const m     = d.getMonth() + 1

    const monthData = data.filter(row => {
      const pd = new Date(row.period)
      return pd.getFullYear() === y && pd.getMonth() + 1 === m
    })

    const cashIn  = monthData.reduce((s, r) => s + Number(r.cash_in),  0)
    const cashOut = monthData.reduce((s, r) => s + Number(r.cash_out), 0)

    months.push({ month: label, income: cashIn, expenses: cashOut, profit: cashIn - cashOut })
  }
  return months
}