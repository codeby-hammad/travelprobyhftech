'use client'

import { formatCurrency } from '@/lib/utils'
import type { SaleData }  from './SellTicketWizard'

type Props = {
  data:   SaleData
  update: (p: Partial<SaleData>) => void
  onNext: () => void
  onBack: () => void
}

export default function PricingStep({ data, update, onNext, onBack }: Props) {
  const cost   = parseFloat(data.cost_price  || '0')
  const sell   = parseFloat(data.sold_price  || '0')
  const profit = sell - cost
  const margin = sell > 0 ? Math.round((profit / sell) * 100 * 10) / 10 : 0

  const isValid = cost > 0 && sell > 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <div>
        <h2 className="font-bold text-gray-900">Pricing & payment</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Ticket ki cost aur selling price enter karein
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GDS / cost price ({data.currency}) <span className="text-red-500">*</span>
          </label>
          <input type="number" min="0"
            value={data.cost_price}
            onChange={e => update({ cost_price: e.target.value })}
            placeholder="What YOU paid airline/GDS"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selling price ({data.currency}) <span className="text-red-500">*</span>
          </label>
          <input type="number" min="0"
            value={data.sold_price}
            onChange={e => update({ sold_price: e.target.value })}
            placeholder="What customer pays"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Profit display */}
      {cost > 0 && sell > 0 && (
        <div className={`rounded-xl p-4 ${
          profit >= 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
        }`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400">Cost</p>
              <p className="font-bold text-gray-900">{formatCurrency(cost, data.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">
                {profit >= 0 ? 'Profit' : 'Loss'}
              </p>
              <p className={`font-bold text-lg ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit, data.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Margin</p>
              <p className={`font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {margin}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select value={data.currency} onChange={e => update({ currency: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>PKR</option>
            <option>USD</option>
            <option>SAR</option>
            <option>AED</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment method
          </label>
          <select value={data.payment_method}
            onChange={e => update({ payment_method: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
            <option value="credit">On credit</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment received?
          </label>
          <select value={data.payment_status}
            onChange={e => update({ payment_status: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="received">✅ Received</option>
            <option value="pending">⏳ Pending</option>
            <option value="overdue">🔴 Overdue</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale date</label>
          <input type="date" value={data.sale_date}
            onChange={e => update({ sale_date: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input value={data.notes} onChange={e => update({ notes: e.target.value })}
            placeholder="Optional..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm">
          ← Back
        </button>
        <button onClick={onNext} disabled={!isValid}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          Next → Review & confirm
        </button>
      </div>
    </div>
  )
}