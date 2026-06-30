'use client'

import { useState }        from 'react'
import { useRouter }       from 'next/navigation'
import Link                from 'next/link'
import { Users, Plus }     from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import SaleTypeModal       from './SaleTypeModal'
import SingleTicketSaleForm from './SingleTicketSaleForm'
import QuickReceiptButton  from './QuickReceiptButton'
import B2BSaleForm        from './B2BSaleForm'

type Props = {
  seats:        any[]
  batch:        any
  pricing:      any[]
  clients:      any[]
  subAgents:    any[]
  statusColors: Record<string, string>
  organization: any
}

export default function BatchSeatGrid({
  seats, batch, pricing, clients, subAgents, statusColors, organization
}: Props) {
  const [filter,       setFilter]       = useState<string>('all')
  const [showTypeModal, setShowTypeModal] = useState(false)
const [showSingle,    setShowSingle]    = useState(false)
const [b2bMode,       setB2bMode]       = useState<'sub_agent' | 'agency' | null>(null)

  const availableSeats = seats.filter(s => s.status === 'available')
  const filtered       = filter === 'all' ? seats : seats.filter(s => s.status === filter)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">
          Seats ({seats.length})
        </h2>
        <div className="flex items-center gap-2">

          {/* NEW SALE button */}
          {availableSeats.length > 0 && (
            <button
              onClick={() => setShowTypeModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition"
            >
              <Plus size={13} /> New Sale
            </button>
          )}

          {/* Group sale link */}
          <Link
            href={`/dashboard/inventory/${batch.id}/group-sale`}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition"
          >
            <Users size={13} /> Group Sale
          </Link>

          {/* Filter pills */}
          <div className="flex gap-1.5">
            {['all','available','reserved','sold','returned'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition capitalize ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f} {f !== 'all' && `(${seats.filter(s => s.status === f).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Seat grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-5">
        {filtered.map((seat: any, i: number) => (
          <div
            key={seat.id}
            className={`
              border rounded-lg p-2 text-center transition
              ${statusColors[seat.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}
            `}
            title={
              seat.status === 'sold'
                ? `${seat.buyer_name ?? '—'} — ${formatCurrency(seat.sold_price, batch.currency)}`
                : seat.status
            }
          >
            <p className="text-xs font-bold">
              {seat.seat_number ?? `#${i + 1}`}
            </p>
            <p className="text-xs mt-0.5 truncate text-gray-500">
              {seat.status === 'sold'
                ? seat.buyer_name?.split(' ')[0] ?? '—'
                : seat.status
              }
            </p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs pt-3 border-t border-gray-50 mb-5">
        {[
          { color: 'bg-green-50  border-green-200',  label: 'Available' },
          { color: 'bg-yellow-50 border-yellow-200', label: 'Reserved'  },
          { color: 'bg-blue-50   border-blue-200',   label: 'Sold'      },
          { color: 'bg-red-50    border-red-200',    label: 'Returned'  },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border ${item.color}`} />
            <span className="text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Sold seats table */}
      {seats.filter(s => s.status === 'sold').length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 text-sm mb-3">
            Sold seats
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Seat</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Passenger</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Type</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Sold price</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Profit</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Payment</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Date</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {seats
                  .filter(s => s.status === 'sold')
                  .map((seat: any, i: number) => {
                    const profit = Number(seat.sold_price) - Number(batch.cost_per_seat)
                    return (
                      <tr key={seat.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-600 font-bold">
                          {seat.seat_number ?? `#${i+1}`}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900 text-xs">
                          {seat.buyer_name ?? seat.client?.full_name ?? seat.sub_agent?.name ?? '—'}
                          {seat.pnr && (
                            <p className="text-xs text-blue-500 font-mono">{seat.pnr}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className="capitalize text-xs text-gray-500">
                            {seat.sold_to_type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-xs">
                          {formatCurrency(seat.sold_price, batch.currency)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`font-semibold text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit, batch.currency)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            seat.payment_status === 'received' ? 'bg-green-50  text-green-700' :
                            seat.payment_status === 'overdue'  ? 'bg-red-50    text-red-700'   :
                                                                  'bg-yellow-50 text-yellow-700'
                          }`}>
                            {seat.payment_status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {seat.sold_date ? formatDate(seat.sold_date) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <QuickReceiptButton
                            seat={seat}
                            batch={batch}
                            organization={organization}
                          />
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sale type chooser modal */}
      {showTypeModal && (
  <SaleTypeModal
    batch={batch}
    onClose={() => setShowTypeModal(false)}
    onSingle={() => {
      setShowTypeModal(false)
      setShowSingle(true)
    }}
    onGroup={() => {
      setShowTypeModal(false)
      window.location.href = `/dashboard/inventory/${batch.id}/group-sale`
    }}
    onAgent={() => {
      setShowTypeModal(false)
      setB2bMode('sub_agent')
    }}
    onAgency={() => {
      setShowTypeModal(false)
      setB2bMode('agency')
    }}
  />
)}

{showSingle && (
  <SingleTicketSaleForm
    batch={batch}
    pricing={pricing}
    clients={clients}
    seats={availableSeats}
    organization={organization}
    onClose={() => setShowSingle(false)}
    onBack={() => {
      setShowSingle(false)
      setShowTypeModal(true)
    }}
  />
)}

{b2bMode && (
  <B2BSaleForm
    batch={batch}
    seats={availableSeats}
    subAgents={subAgents}
    mode={b2bMode}
    organization={organization}
    onClose={() => setB2bMode(null)}
    onBack={() => {
      setB2bMode(null)
      setShowTypeModal(true)
    }}
  />
)}
    </div>
  )
}