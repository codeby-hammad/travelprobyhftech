'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { SaleData } from './SellTicketWizard'
import TicketReceiptPDF from './TicketReceiptPDF'
import { MessageCircle, Plus, Check } from 'lucide-react'

type Props = {
  sale:         any
  data:         SaleData
  organization: any
  onSellAnother: () => void
}

export default function SaleSuccess({ sale, data, organization, onSellAnother }: Props) {
  const [whatsappSent, setWhatsappSent] = useState(false)

  const cost   = parseFloat(data.cost_price || '0')
  const sell   = parseFloat(data.sold_price || '0')
  const profit = sell - cost

  // Build route summary for display
  const routeSummary = (() => {
    if (data.journey_type === 'one_way')
      return `${data.outbound.departure_city} → ${data.outbound.arrival_city}`
    if (data.journey_type === 'return')
      return `${data.outbound.departure_city} ⇄ ${data.outbound.arrival_city}`
    if (data.journey_type === 'connecting' || data.journey_type === 'multi_city') {
      const cities = [
        data.legs[0]?.departure_city,
        ...data.legs.map(l => l.arrival_city),
      ].filter(Boolean)
      return cities.join(' → ')
    }
    if (data.journey_type === 'open_jaw')
      return `${data.outbound.departure_city} → ${data.outbound.arrival_city} / ${data.return_leg.departure_city} → ${data.return_leg.arrival_city || data.outbound.departure_city}`
    return '—'
  })()

  // WhatsApp message
  function openWhatsApp() {
    if (!data.buyer_phone) return
    const phone = data.buyer_phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')
    const finalPhone = phone.startsWith('0')
      ? '92' + phone.slice(1)
      : phone.startsWith('92')
        ? phone
        : '92' + phone

    const msg = [
      `✈ Ticket Confirmation`,
      `${organization?.name}`,
      ``,
      `Receipt: ${sale.receipt_number ?? 'N/A'}`,
      `E-Ticket: ${sale.eticket_number ?? 'N/A'}`,
      ``,
      `Passenger: ${data.buyer_name}`,
      `Route: ${routeSummary}`,
      `Airline: ${data.outbound.airline || data.legs[0]?.airline || '—'}`,
      data.outbound.pnr ? `PNR: ${data.outbound.pnr}` : '',
      data.seat_number  ? `Seat: ${data.seat_number}` : '',
      `Date: ${data.outbound.departure_time
        ? formatDate(data.outbound.departure_time.split('T')[0])
        : data.legs[0]?.departure_time
          ? formatDate(data.legs[0].departure_time.split('T')[0])
          : '—'
      }`,
      `Class: ${data.seat_class}`,
      `Baggage: ${data.baggage_kg}kg`,
      ``,
      `Amount paid: ${formatCurrency(sell, data.currency)}`,
      `Payment: ${data.payment_method.replace('_', ' ')}`,
      ``,
      `Safe travels! — ${organization?.name}`,
    ].filter(line => line !== null && line !== undefined).join('\n')

    window.open(
      `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`,
      '_blank'
    )
    setWhatsappSent(true)
  }

  return (
    <div className="space-y-5">

      {/* Success banner */}
      <div className="bg-green-600 rounded-2xl p-6 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black">Ticket Sold!</h2>
        <p className="text-green-200 mt-1">
          {sale.receipt_number && `Receipt: ${sale.receipt_number}`}
          {sale.eticket_number && ` • E-Ticket: ${sale.eticket_number}`}
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Sale summary</h3>

        <div className="bg-blue-50 rounded-xl p-3">
          <p className="font-bold text-blue-900">{routeSummary}</p>
          <p className="text-blue-600 text-xs mt-0.5 capitalize">
            {data.journey_type.replace('_', ' ')} •{' '}
            {data.outbound.airline || data.legs[0]?.airline} •{' '}
            {data.seat_class}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: 'Passenger',     value: data.buyer_name },
            { label: 'Passport',      value: data.buyer_passport || '—' },
            { label: 'PNR',           value: data.outbound.pnr || data.legs[0]?.pnr || '—' },
            { label: 'Seat',          value: data.seat_number || '—' },
            { label: 'Amount paid',   value: formatCurrency(sell, data.currency) },
            { label: 'Profit',        value: formatCurrency(profit, data.currency) },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs text-gray-400">{row.label}</p>
              <p className="font-medium text-gray-900">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Send to customer:</p>

        {/* WhatsApp */}
        {data.buyer_phone ? (
          <button
            onClick={openWhatsApp}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${
              whatsappSent
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <MessageCircle size={18} />
            {whatsappSent
              ? '✓ WhatsApp opened — send the message'
              : `Send via WhatsApp — ${data.buyer_phone}`
            }
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 text-gray-400 text-sm border border-gray-100">
            <MessageCircle size={18} />
            No phone number — WhatsApp not available
          </div>
        )}

        {/* PDF — same component used later on the Sales Slips list, so a
            reprint months from now looks identical to this one */}
        <TicketReceiptPDF
          sale={sale}
          legs={(data.journey_type === 'connecting' || data.journey_type === 'multi_city') ? data.legs : undefined}
          organization={organization}
        />
      </div>

      {/* Sell another */}
      <button
        onClick={onSellAnother}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition text-sm font-medium"
      >
        <Plus size={16} />
        Sell another ticket
      </button>
    </div>
  )
}