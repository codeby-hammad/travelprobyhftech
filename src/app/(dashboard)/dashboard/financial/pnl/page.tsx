import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { ArrowLeft }     from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function PnlPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const supabase      = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile  } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  let query = supabase
    .from('income_statement')
    .select('*')
    .eq('organization_id', orgId)
    .order('period', { ascending: false })

  const { data: rows } = await query

  // Group by account
  const income: Record<string, number>  = {}
  const expense: Record<string, number> = {}

  rows?.forEach(row => {
    if (row.account_type === 'income') {
      income[row.account_name]  = (income[row.account_name]  ?? 0) + Number(row.net_amount)
    } else {
      expense[row.account_name] = (expense[row.account_name] ?? 0) + Math.abs(Number(row.net_amount))
    }
  })

  const totalIncome   = Object.values(income).reduce((s, v)  => s + v, 0)
  const totalExpenses = Object.values(expense).reduce((s, v) => s + v, 0)
  const grossProfit   = totalIncome - totalExpenses
  const margin        = totalIncome > 0
    ? Math.round((grossProfit / totalIncome) * 100 * 10) / 10
    : 0

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/financial" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Profit & Loss Statement
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">All time</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 text-white">
          <h2 className="font-bold text-lg">Income Statement</h2>
          <p className="text-blue-200 text-sm mt-0.5">All transactions to date</p>
        </div>

        <div className="p-6 space-y-6">

          {/* Income section */}
          <div>
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />
              Income
            </h3>
            <div className="space-y-2">
              {Object.entries(income).map(([name, amount]) => (
                <div key={name} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-600">{name}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                </div>
              ))}
              {Object.keys(income).length === 0 && (
                <p className="text-gray-400 text-sm italic">No income recorded</p>
              )}
            </div>
            <div className="flex justify-between font-bold mt-3 pt-3 border-t-2 border-gray-200 text-sm">
              <span className="text-gray-900">Total income</span>
              <span className="text-green-600">{formatCurrency(totalIncome)}</span>
            </div>
          </div>

          {/* Expense section */}
          <div>
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-400 rounded-full inline-block" />
              Expenses
            </h3>
            <div className="space-y-2">
              {Object.entries(expense).map(([name, amount]) => (
                <div key={name} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-600">{name}</span>
                  <span className="font-medium text-red-600">{formatCurrency(amount)}</span>
                </div>
              ))}
              {Object.keys(expense).length === 0 && (
                <p className="text-gray-400 text-sm italic">No expenses recorded</p>
              )}
            </div>
            <div className="flex justify-between font-bold mt-3 pt-3 border-t-2 border-gray-200 text-sm">
              <span className="text-gray-900">Total expenses</span>
              <span className="text-red-500">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>

          {/* Net profit */}
          <div className={`rounded-xl p-5 border-2 ${
            grossProfit >= 0
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50   border-red-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-lg text-gray-900">
                  Net {grossProfit >= 0 ? 'Profit' : 'Loss'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Profit margin: {margin}%
                </p>
              </div>
              <p className={`text-3xl font-black ${
                grossProfit >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {grossProfit >= 0 ? '+' : ''}{formatCurrency(grossProfit)}
              </p>
            </div>
            {/* Visual bar */}
            <div className="mt-4 h-3 bg-white rounded-full overflow-hidden">
              <div className="h-full flex">
                <div
                  className="h-full bg-red-400 transition-all"
                  style={{
                    width: totalIncome > 0
                      ? `${Math.min((totalExpenses / totalIncome) * 100, 100)}%`
                      : '0%'
                  }}
                />
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: totalIncome > 0 && grossProfit > 0
                      ? `${(grossProfit / totalIncome) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>🔴 Costs {totalIncome > 0 ? Math.round((totalExpenses/totalIncome)*100) : 0}%</span>
              <span>🟢 Profit {margin}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}