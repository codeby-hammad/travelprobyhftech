import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { ArrowLeft }     from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function BalanceSheetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile  } = await supabase
    .from('profiles').select('organization_id').eq('id', user!.id).single()

  const orgId = profile!.organization_id

  const { data: rows } = await supabase
    .from('balance_sheet')
    .select('*')
    .eq('organization_id', orgId)
    .order('account_code')

  // Group by type
  const grouped = rows?.reduce((acc, row) => {
    if (!acc[row.account_type]) acc[row.account_type] = []
    acc[row.account_type].push(row)
    return acc
  }, {} as Record<string, any[]>) ?? {}

  const totalAssets      = (grouped['asset']     ?? []).reduce((s: number, r: any) => s + Number(r.closing_balance), 0)
const totalLiabilities = (grouped['liability'] ?? []).reduce((s: number, r: any) => s + Number(r.closing_balance), 0)
const totalEquity      = (grouped['equity']    ?? []).reduce((s: number, r: any) => s + Number(r.closing_balance), 0)
  const netWorth         = totalAssets - totalLiabilities

  const sectionColors: Record<string, string> = {
    asset:     'bg-blue-600',
    liability: 'bg-red-500',
    equity:    'bg-purple-600',
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/financial" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            As of {new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}
          </p>
        </div>
      </div>

      {/* Net worth card */}
      <div className={`rounded-xl p-5 mb-6 border-2 ${
        netWorth >= 0
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50   border-red-200'
      }`}>
        <p className="text-sm text-gray-500">Net worth (Assets − Liabilities)</p>
        <p className={`text-3xl font-black mt-1 ${
          netWorth >= 0 ? 'text-green-700' : 'text-red-700'
        }`}>
          {formatCurrency(netWorth)}
        </p>
      </div>

      <div className="space-y-5">
        {(['asset', 'liability', 'equity'] as const).map(type => {
          const items    = grouped[type] ?? []
          const total    = items.reduce((s: number, r: any) => s + Number(r.closing_balance), 0)
          if (items.length === 0) return null

          return (
            <div key={type} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className={`${sectionColors[type]} px-5 py-3 flex justify-between items-center`}>
                <h3 className="font-bold text-white capitalize">{type}s</h3>
                <span className="text-white font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((row: any) => (
                  <div key={row.account_code}
                    className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{row.account_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{row.account_code}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        type === 'asset'
                          ? 'text-blue-600'
                          : type === 'liability'
                            ? 'text-red-600'
                            : 'text-purple-600'
                      }`}>
                        {formatCurrency(Math.abs(Number(row.closing_balance)))}
                      </p>
                      {(Number(row.opening_balance) > 0) && (
                        <p className="text-xs text-gray-400">
                          Opening: {formatCurrency(row.opening_balance)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                <span className="text-sm font-bold text-gray-900">
                  Total {type}s
                </span>
                <span className={`font-bold ${
                  type === 'asset'
                    ? 'text-blue-600'
                    : type === 'liability'
                      ? 'text-red-600'
                      : 'text-purple-600'
                }`}>
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Accounting equation */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-500 mb-2 font-medium">
          Accounting equation check:
        </p>
        <div className="flex items-center justify-center gap-3 text-sm font-mono">
          <div className="text-center">
            <p className="text-blue-600 font-bold">{formatCurrency(totalAssets)}</p>
            <p className="text-xs text-gray-400">Assets</p>
          </div>
          <span className="text-gray-400 text-lg">=</span>
          <div className="text-center">
            <p className="text-red-600 font-bold">{formatCurrency(totalLiabilities)}</p>
            <p className="text-xs text-gray-400">Liabilities</p>
          </div>
          <span className="text-gray-400 text-lg">+</span>
          <div className="text-center">
            <p className="text-purple-600 font-bold">{formatCurrency(totalEquity)}</p>
            <p className="text-xs text-gray-400">Equity</p>
          </div>
          <span className="text-gray-400 text-lg">=</span>
          <div className="text-center">
            <p className={`font-bold ${
              Math.abs(totalLiabilities + totalEquity - totalAssets) < 1
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(totalLiabilities + totalEquity - totalAssets) < 1
                ? '✓ Balanced' : '✗ Check'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}