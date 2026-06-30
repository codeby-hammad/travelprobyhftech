'use client'

import { X, User, Users, Handshake, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Props = {
  batch:    any
  onClose:  () => void
  onSingle: () => void
  onGroup:  () => void
  onAgent:  () => void
  onAgency: () => void
}

export default function SaleTypeModal({
  batch, onClose, onSingle, onGroup, onAgent, onAgency
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">New Ticket Sale</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {batch.airline} •{' '}
              {batch.route_from} → {batch.route_to} •{' '}
              {batch.seats_available} seats available
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Select sale type
          </p>

          {/* ── DIRECT TO CUSTOMER ─────────────────── */}
          <p className="text-xs text-gray-400 font-medium mt-1">
            Direct to customer
          </p>

          {/* Single ticket */}
          <button
            onClick={onSingle}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition text-left group"
          >
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition shrink-0">
              <User size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Single Ticket</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Ek passenger — walk-in, quick sale
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  1 seat
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  Retail: {formatCurrency(batch.retail_price, batch.currency)}
                </span>
              </div>
            </div>
            <span className="text-blue-300 text-lg shrink-0">→</span>
          </button>

          {/* Group / family */}
          <button
            onClick={onGroup}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition text-left group"
          >
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition shrink-0">
              <Users size={20} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Group / Family</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Multiple passengers — family, Umrah group
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                  Multiple seats
                </span>
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                  Adult/Child/Infant
                </span>
              </div>
            </div>
            <span className="text-purple-300 text-lg shrink-0">→</span>
          </button>

          {/* ── B2B SALES ──────────────────────────── */}
          <p className="text-xs text-gray-400 font-medium mt-4">
            B2B — sell to agents / agencies
          </p>

          {/* Sub-agent */}
          <button
            onClick={onAgent}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-green-300 hover:bg-green-50 transition text-left group"
          >
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition shrink-0">
              <Handshake size={20} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Sub-Agent Sale</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Apne registered sub-agent ko tickets bechein
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                  Agent price: {formatCurrency(batch.agent_price, batch.currency)}
                </span>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                  Credit allowed
                </span>
              </div>
            </div>
            <span className="text-green-300 text-lg shrink-0">→</span>
          </button>

          {/* Other agency */}
          <button
            onClick={onAgency}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition text-left group"
          >
            <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition shrink-0">
              <Building2 size={20} className="text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Other Agency</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Kisi doosri travel agency ko tickets bechein
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                  Agency price: {formatCurrency(batch.agency_price, batch.currency)}
                </span>
                <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                  Bulk qty
                </span>
              </div>
            </div>
            <span className="text-orange-300 text-lg shrink-0">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}