'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Ticket } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import FlightLegsEditor, { emptyLeg, type LegInput } from './FlightLegsEditor'

type Props = {
  seat:      any
  batch:     any
  clients:   any[]
  subAgents: any[]
  onClose:   () => void
}

export default function SellSeatModal({
  seat, batch, clients, subAgents, onClose
}: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [spotLegs, setSpotLegs] = useState<LegInput[]>([emptyLeg()])
  const [priceOverridden, setPriceOverridden] = useState(false)

  const [form, setForm] = useState({
    sold_to_type:    'customer',
    client_id:       '',
    sub_agent_id:    '',
    buyer_name:      '',
    sold_price:      batch.retail_price?.toString() ?? '',
    seat_number:     seat.seat_number ?? '',
    pnr:             seat.pnr ?? '',
    payment_method:  'cash',
    payment_status:  'received',
    sold_date:       new Date().toISOString().split('T')[0],
    notes:           '',
    is_spot:         'false',
    spot_cost:       '',
    spot_airline:    batch.airline ?? '',
    spot_route:      `${batch.route_from} → ${batch.route_to}`,
  })

  const priceDefaults: Record<string, string | undefined> = {
    customer:    batch.retail_price?.toString(),
    sub_agent:   batch.agent_price?.toString(),
    agency:      batch.agency_price?.toString(),
    own_booking: batch.cost_per_seat?.toString(),
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }

      // Auto-adjust price based on buyer type — resets any manual override
      // since switching buyer type implies wanting the new tier's default
      if (name === 'sold_to_type') {
        next.sold_price = priceDefaults[value] ?? prev.sold_price
        setPriceOverridden(false)
      }

      if (name === 'sold_price') {
        setPriceOverridden(true)
      }

      return next
    })
  }

  function resetPriceToDefault() {
    setForm(p => ({ ...p, sold_price: priceDefaults[form.sold_to_type] ?? p.sold_price }))
    setPriceOverridden(false)
  }

  const soldPrice = parseFloat(form.sold_price || '0')
  const profit    = soldPrice - Number(batch.cost_per_seat)

  async function handleSell() {
    if (form.sold_to_type === 'customer' && !form.client_id && !form.buyer_name) {
      setError('Please select a client or enter buyer name')
      return
    }
    setLoading(true)
    setError(null)

    // Generate receipt number
    const { data: receiptNum } = await supabase.rpc('generate_receipt_number')

    const { error } = await supabase
      .from('ticket_seats')
      .update({
        status:          'sold',
        sold_to_type:    form.sold_to_type,
        client_id:       form.client_id      || null,
        sub_agent_id:    form.sub_agent_id   || null,
        buyer_name:      form.buyer_name     || null,
        sold_price:      parseFloat(form.sold_price),
        sold_date:       form.sold_date,
        seat_number:     form.seat_number    || null,
        pnr:             form.pnr            || null,
        payment_method:  form.payment_method,
        payment_status:  form.payment_status,
        notes:           form.notes          || null,
        receipt_number:  receiptNum          || null,
        // Spot purchase fields
        is_spot_purchase: form.is_spot === 'true',
        spot_cost:        form.is_spot === 'true' && form.spot_cost
                            ? parseFloat(form.spot_cost)
                            : null,
        spot_airline:     form.is_spot === 'true' ? form.spot_airline || null : null,
        spot_route:       form.is_spot === 'true' ? form.spot_route   || null : null,
      })
      .eq('id', seat.id)

    if (error) { setError(error.message); setLoading(false); return }

    // Save flight legs for spot purchase
    if (form.is_spot === 'true') {
      const validLegs = spotLegs.filter(l => l.departure_city && l.arrival_city)
      if (validLegs.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        const legsToInsert = validLegs.map((leg, i) => ({
          organization_id: batch.organization_id,
          seat_id:         seat.id,
          leg_number:      i + 1,
          airline:         leg.airline || form.spot_airline,
          flight_number:   leg.flight_number || null,
          departure_city:  leg.departure_city,
          arrival_city:    leg.arrival_city,
          departure_time:  leg.departure_time || null,
          arrival_time:    leg.arrival_time   || null,
          terminal:        leg.terminal       || null,
          layover_minutes: i < validLegs.length - 1 && validLegs[i].arrival_time && validLegs[i+1].departure_time
            ? Math.round(
                (new Date(validLegs[i+1].departure_time).getTime() -
                 new Date(validLegs[i].arrival_time).getTime()) / 60000
              )
            : null,
        }))
        await supabase.from('ticket_flight_legs').insert(legsToInsert)
      }
    }

    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Ticket size={16} className="text-blue-600" />
            Sell seat
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Batch info */}
          <div className="bg-blue-50 rounded-xl p-3 text-sm">
            <p className="font-semibold text-blue-900">
              {batch.airline} — {batch.route_from} → {batch.route_to}
            </p>
            <p className="text-blue-600 text-xs mt-0.5">
              {batch.flight_date} • {batch.seat_class} class
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sell to
            </label>
            <select name="sold_to_type" value={form.sold_to_type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="customer">👤 Walk-in customer</option>
              <option value="sub_agent">🤝 Sub-agent</option>
              <option value="agency">🏢 Other agency</option>
              <option value="own_booking">📋 Link to own booking</option>
            </select>
          </div>

          {form.sold_to_type === 'customer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select client
              </label>
              <select name="client_id" value={form.client_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select from CRM...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} {c.phone ? `— ${c.phone}` : ''}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Or enter name manually:</p>
              <input
                name="buyer_name"
                value={form.buyer_name}
                onChange={handleChange}
                placeholder="Buyer full name"
                className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {form.sold_to_type === 'sub_agent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-agent
              </label>
              <select name="sub_agent_id" value={form.sub_agent_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select sub-agent...</option>
                {subAgents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — Balance: {formatCurrency(a.current_balance)} / Limit: {formatCurrency(a.credit_limit)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(form.sold_to_type === 'agency' || form.sold_to_type === 'own_booking') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.sold_to_type === 'agency' ? 'Agency name' : 'Booking reference'}
              </label>
              <input
                name="buyer_name"
                value={form.buyer_name}
                onChange={handleChange}
                placeholder={form.sold_to_type === 'agency' ? 'Agency name...' : 'Booking ref...'}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seat no.</label>
              <input name="seat_number" value={form.seat_number} onChange={handleChange}
                placeholder="e.g. 24A"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PNR</label>
              <input name="pnr" value={form.pnr} onChange={handleChange}
                placeholder="e.g. ABC123"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
          </div>

          {/* Spot purchase toggle */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_spot === 'true'}
                onChange={e => setForm(p => ({
                  ...p,
                  is_spot:   e.target.checked.toString(),
                  spot_cost: e.target.checked ? '' : '',
                }))}
                className="rounded accent-yellow-500"
              />
              <span className="text-sm font-medium text-yellow-800">
                🎫 Spot purchase — Client ne abhi paisa diya, ticket abhi khareedna hai
              </span>
            </label>

            {form.is_spot === 'true' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Airline se cost (PKR)
                  </label>
                  <input
                    type="number" min="0"
                    value={form.spot_cost}
                    onChange={e => setForm(p => ({ ...p, spot_cost: e.target.value }))}
                    placeholder="e.g. 45000"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                  {form.spot_cost && form.sold_price && (
                    <p className={`text-xs mt-1 font-medium ${
                      parseFloat(form.sold_price) - parseFloat(form.spot_cost) >= 0
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Profit: {formatCurrency(
                        parseFloat(form.sold_price) - parseFloat(form.spot_cost)
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Airline name
                  </label>
                  <input
                    value={form.spot_airline}
                    onChange={e => setForm(p => ({ ...p, spot_airline: e.target.value }))}
                    placeholder="e.g. PIA"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>
              </div>
            )}

            {form.is_spot === 'true' && (
              <div className="mt-4 pt-4 border-t border-yellow-200">
                <FlightLegsEditor
                  legs={spotLegs}
                  setLegs={setSpotLegs}
                  defaultAirline={form.spot_airline}
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Selling price ({batch.currency})
              </label>
              {priceOverridden ? (
                <button
                  type="button"
                  onClick={resetPriceToDefault}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Reset to default
                </button>
              ) : (
                <span className="text-xs text-gray-400">Auto-filled — edit to override</span>
              )}
            </div>
            <input type="number" min="0" name="sold_price" value={form.sold_price}
              onChange={handleChange}
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                priceOverridden ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
              }`} />
            {profit !== 0 && (
              <p className={`text-xs mt-1 font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profit >= 0 ? '✅' : '⚠️'} Profit on this seat:{' '}
                {profit >= 0 ? '+' : ''}{formatCurrency(profit, batch.currency)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment method
              </label>
              <select name="payment_method" value={form.payment_method} onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cheque">Cheque</option>
                <option value="credit">On credit</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment received?
              </label>
              <select name="payment_status" value={form.payment_status} onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="received">✅ Received</option>
                <option value="pending">⏳ Pending</option>
                <option value="overdue">🔴 Overdue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale date</label>
              <input type="date" name="sold_date" value={form.sold_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input name="notes" value={form.notes} onChange={handleChange}
                placeholder="Optional..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <button
            onClick={handleSell}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Ticket size={16} />
            {loading ? 'Selling...' : `Sell seat — ${formatCurrency(soldPrice, batch.currency)}`}
          </button>
        </div>
      </div>
    </div>
  )
}