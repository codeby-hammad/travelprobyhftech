import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Props = {
  sellingPrice: number
  totalCost:    number
  collected:    number
  unpaidCosts:  number
  currency:     string
}

export default function ProfitSummaryCard({
  sellingPrice,
  totalCost,
  collected,
  unpaidCosts,
  currency,
}: Props) {
  const grossProfit  = sellingPrice - totalCost
  const margin       = sellingPrice > 0
    ? Math.round((grossProfit / sellingPrice) * 100 * 10) / 10
    : 0
  const isProfit     = grossProfit > 0
  const isBreakeven  = grossProfit === 0

  return (
    <div className={`rounded-xl border p-5 ${
      isProfit
        ? 'bg-green-50  border-green-100'
        : isBreakeven
          ? 'bg-gray-50   border-gray-100'
          : 'bg-red-50    border-red-100'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Profit summary</h2>
        <div className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${
          isProfit
            ? 'bg-green-100 text-green-700'
            : isBreakeven
              ? 'bg-gray-100  text-gray-600'
              : 'bg-red-100   text-red-700'
        }`}>
          {isProfit
            ? <TrendingUp  size={14} />
            : isBreakeven
              ? <Minus       size={14} />
              : <TrendingDown size={14} />
          }
          {margin}%
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Selling price</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(sellingPrice, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total costs</span>
          <span className="font-medium text-orange-700">
            − {formatCurrency(totalCost, currency)}
          </span>
        </div>

        <div className={`flex justify-between font-bold text-base pt-2 border-t ${
          isProfit    ? 'border-green-200' :
          isBreakeven ? 'border-gray-200'  : 'border-red-200'
        }`}>
          <span className={
            isProfit    ? 'text-green-700' :
            isBreakeven ? 'text-gray-600'  : 'text-red-700'
          }>
            {isProfit ? 'Profit' : isBreakeven ? 'Break even' : 'Loss'}
          </span>
          <span className={
            isProfit    ? 'text-green-700' :
            isBreakeven ? 'text-gray-600'  : 'text-red-700'
          }>
            {isProfit ? '+' : ''}{formatCurrency(grossProfit, currency)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {sellingPrice > 0 && (
        <div className="mt-4">
          <div className="h-2 bg-white rounded-full overflow-hidden">
            {/* Cost bar */}
            <div className="h-full flex">
              <div
                className="h-full bg-orange-400 transition-all"
                style={{ width: `${Math.min((totalCost / sellingPrice) * 100, 100)}%` }}
              />
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${Math.max(Math.min((grossProfit / sellingPrice) * 100, 100), 0)}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>🟠 Cost {Math.round((totalCost / sellingPrice) * 100)}%</span>
            {isProfit && (
              <span>🟢 Profit {Math.round((grossProfit / sellingPrice) * 100)}%</span>
            )}
          </div>
        </div>
      )}

      {/* Unpaid costs warning */}
      {unpaidCosts > 0 && (
        <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
          <p className="text-xs text-yellow-700 font-medium">
            ⚠️ {formatCurrency(unpaidCosts, currency)} in costs still unpaid to suppliers
          </p>
        </div>
      )}

      {totalCost === 0 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Add expenses below to calculate real profit
        </p>
      )}
    </div>
  )
}