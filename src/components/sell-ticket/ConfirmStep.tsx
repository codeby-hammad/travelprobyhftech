'use client'

import { useState }     from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { SaleData } from './SellTicketWizard'
import { AlertCircle }  from 'lucide-react'

type Props = {
  data:           SaleData
  update:         (p: Partial<SaleData>) => void
  organizationId: string
  clients:        any[]
  subAgents:      any[]
  onBack:         () => void
  onDone:         (sale: any) => void
}

export default function ConfirmStep({
  data, organizationId, clients, subAgents, onBack, onDone
}: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const cost   = parseFloat(data.cost_price || '0')
  const sell   = parseFloat(data.sold_price || '0')
  const profit = sell - cost

  // Build route summary
  const routeSummary = (() => {
    if (data.journey_type === 'one_way') {
      return `${data.outbound.departure_city} → ${data.outbound.arrival_city}`
    }
    if (data.journey_type === 'return') {
      return `${data.outbound.departure_city} ⇄ ${data.outbound.arrival_city}`
    }
    if (data.journey_type === 'connecting' || data.journey_type === 'multi_city') {
      if (data.legs.length > 0) {
        const cities = [
          data.legs[0].departure_city,
          ...data.legs.map(l => l.arrival_city),
        ].filter(Boolean)
        return cities.join(' → ')
      }
    }
    if (data.journey_type === 'open_jaw') {
      return `${data.outbound.departure_city} → ${data.outbound.arrival_city} / ${data.return_leg.departure_city} → ${data.return_leg.arrival_city}`
    }
    return '—'
  })()

  const clientName = data.client_id
    ? clients.find(c => c.id === data.client_id)?.full_name
    : data.sub_agent_id
      ? subAgents.find(a => a.id === data.sub_agent_id)?.name
      : data.buyer_name

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    // Generate receipt + eticket
    const [{ data: receiptNum }, { data: etNum }] = await Promise.all([
      supabase.rpc('generate_daily_receipt').match(() => ({ data: null })),
      supabase.rpc('generate_eticket_number', {
        airline_code: data.outbound.airline || data.legs[0]?.airline || 'TK'
      }).match(() => ({ data: null })),
    ])

    // Main airline/route from first leg
    const mainAirline = data.journey_type === 'connecting' || data.journey_type === 'multi_city'
      ? data.legs[0]?.airline
      : data.outbound.airline

    const { data: sale, error: saleErr } = await supabase
      .from('daily_ticket_sales')
      .insert({
        organization_id:   organizationId,
        journey_type:      data.journey_type,
        sold_to_type:      data.sold_to_type,
        client_id:         data.client_id      || null,
        sub_agent_id:      data.sub_agent_id   || null,
        buyer_name:        data.buyer_name.toUpperCase().trim(),
        buyer_phone:       data.buyer_phone     || null,
        buyer_passport:    data.buyer_passport  || null,
        buyer_nationality: data.buyer_nationality || null,
        buyer_dob:         data.buyer_dob       || null,
        buyer_gender:      data.buyer_gender,
        age_category:      data.age_category,
        airline:           mainAirline || 'N/A',
        flight_number:     data.outbound.flight_number || data.legs[0]?.flight_number || null,
        route_from:        data.outbound.departure_city || data.legs[0]?.departure_city || '',
        route_to:          data.outbound.arrival_city   || data.legs[data.legs.length-1]?.arrival_city || '',
        flight_date:       data.outbound.departure_time
          ? data.outbound.departure_time.split('T')[0]
          : data.legs[0]?.departure_time?.split('T')[0] || null,
        departure_time:    data.outbound.departure_time || data.legs[0]?.departure_time || null,
        arrival_time:      data.outbound.arrival_time   || data.legs[0]?.arrival_time   || null,
        seat_class:        data.seat_class,
        seat_number:       data.seat_number     || null,
        pnr:               data.outbound.pnr    || data.legs[0]?.pnr || null,
        baggage_kg:        parseInt(data.baggage_kg || '23'),
        terminal:          data.outbound.terminal || null,
        // Return leg
        return_airline:     data.return_leg.airline     || null,
        return_flight_no:   data.return_leg.flight_number || null,
        return_from:        data.return_leg.departure_city || null,
        return_to:          data.return_leg.arrival_city   || null,
        return_date:        data.return_leg.departure_time
          ? data.return_leg.departure_time.split('T')[0] : null,
        return_departure:   data.return_leg.departure_time || null,
        return_arrival:     data.return_leg.arrival_time   || null,
        return_pnr:         data.return_leg.pnr            || null,
        return_seat_number: null,
        // Pricing
        cost_price:         cost,
        sold_price:         sell,
        currency:           data.currency,
        payment_method:     data.payment_method,
        payment_status:     data.payment_status,
        sale_date:          data.sale_date,
        receipt_number:     receiptNum || null,
        eticket_number:     etNum      || null,
        notes:              data.notes || null,
        created_by:         user!.id,
      })
      .select()
      .single()

    if (saleErr) { setError(saleErr.message); setLoading(false); return }

    // Save connecting legs
    if (
      (data.journey_type === 'connecting' || data.journey_type === 'multi_city') &&
      data.legs.filter(l => l.departure_city && l.arrival_city).length > 0
    ) {
      const validLegs = data.legs.filter(l => l.departure_city && l.arrival_city)
      await supabase.from('daily_sale_legs').insert(
        validLegs.map((leg, i) => ({
          daily_sale_id:   sale.id,
          leg_number:      i + 1,
          airline:         leg.airline,
          flight_number:   leg.flight_number  || null,
          departure_city:  leg.departure_city,
          arrival_city:    leg.arrival_city,
          departure_time:  leg.departure_time || null,
          arrival_time:    leg.arrival_time   || null,
          pnr:             leg.pnr            || null,
          terminal:        leg.terminal       || null,
          seat_number:     leg.seat_number    || null,  
          layover_minutes: i < validLegs.length - 1 &&
            validLegs[i].arrival_time && validLegs[i+1].departure_time
            ? Math.round(
                (new Date(validLegs[i+1].departure_time).getTime() -
                 new Date(validLegs[i].arrival_time).getTime()) / 60000
              )
            : null,
        }))
      )
    }

    setLoading(false)
    onDone(sale)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Confirm & save</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 mb-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="space-y-4">

          {/* Journey */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-400 uppercase font-medium mb-1">Flight</p>
            <p className="font-bold text-blue-900 text-lg">{routeSummary}</p>
            <p className="text-blue-600 text-sm mt-0.5 capitalize">
              {data.journey_type.replace('_', ' ')} •{' '}
              {data.outbound.airline || data.legs[0]?.airline || '—'} •{' '}
              {data.seat_class}
            </p>
            {data.outbound.pnr && (
              <p className="text-xs text-blue-400 mt-1 font-mono">PNR: {data.outbound.pnr}</p>
            )}
          </div>

          {/* Passenger */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">Passenger</p>
            <p className="font-bold text-gray-900">{data.buyer_name || '—'}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-500">
              {data.buyer_passport && <span>Passport: {data.buyer_passport}</span>}
              {data.buyer_phone    && <span>📱 {data.buyer_phone}</span>}
              <span className="capitalize">{data.age_category}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">Cost</p>
              <p className="font-bold text-gray-900">{formatCurrency(cost, data.currency)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">Selling price</p>
              <p className="font-bold text-gray-900">{formatCurrency(sell, data.currency)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-400">Profit</p>
              <p className={`font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit, data.currency)}
              </p>
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-600 px-1">
            <span>
              Payment: <span className="font-medium capitalize">
                {data.payment_method.replace('_', ' ')}
              </span>
            </span>
            <span className={
              data.payment_status === 'received' ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'
            }>
              {data.payment_status === 'received' ? '✅ Received' : '⏳ Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm">
          ← Back
        </button>
        <button onClick={handleConfirm} disabled={loading}
          className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">
          {loading ? 'Saving...' : `✅ Confirm sale — ${formatCurrency(sell, data.currency)}`}
        </button>
      </div>
    </div>
  )
}