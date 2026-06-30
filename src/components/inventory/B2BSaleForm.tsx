'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Handshake, Building2, AlertCircle, Check } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type SaleMode = 'sub_agent' | 'agency'

type Props = {
  batch:        any
  seats:        any[]   // available seats
  subAgents:    any[]
  mode:         SaleMode
  organization: any
  onClose:      () => void
  onBack:       () => void
}

export default function B2BSaleForm({
  batch, seats, subAgents, mode, organization, onClose, onBack
}: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [done,    setDone]    = useState(false)

  const defaultPrice = mode === 'sub_agent'
    ? batch.agent_price?.toString()
    : batch.agency_price?.toString()

  const [form, setForm] = useState({
    sub_agent_id:   '',
    agency_name:    '',
    contact_person: '',
    phone:          '',
    qty:            '1',
    price_per_seat: defaultPrice ?? '',
    payment_method: 'cash',
    payment_status: 'received',
    pnr:            '',
    sale_date:      new Date().toISOString().split('T')[0],
    notes:          '',
    currency:       batch.currency ?? 'PKR',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const qty        = parseInt(form.qty     || '1')
  const priceEach  = parseFloat(form.price_per_seat || '0')
  const totalPrice = qty * priceEach
  const totalCost  = qty * Number(batch.cost_per_seat)
  const profit     = totalPrice - totalCost

  // Selected sub-agent credit check
  const selectedAgent = subAgents.find(a => a.id === form.sub_agent_id)
  const agentBalance  = selectedAgent ? Number(selectedAgent.current_balance) : 0
  const agentLimit    = selectedAgent ? Number(selectedAgent.credit_limit)    : 0
  const wouldExceed   = form.payment_status !== 'received' &&
                        selectedAgent &&
                        (agentBalance + totalPrice) > agentLimit

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mode === 'sub_agent' && !form.sub_agent_id) {
      setError('Please select a sub-agent')
      return
    }
    if (mode === 'agency' && !form.agency_name.trim()) {
      setError('Please enter agency name')
      return
    }
    if (qty > seats.length) {
      setError(`Only ${seats.length} seats available, you requested ${qty}`)
      return
    }
    if (wouldExceed) {
      setError(
        `This will exceed ${selectedAgent?.name}'s credit limit. ` +
        `Current balance: ${formatCurrency(agentBalance)}, ` +
        `Limit: ${formatCurrency(agentLimit)}`
      )
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    // Sell the required number of seats
    const seatsToSell = seats.slice(0, qty)
    const buyerName   = mode === 'sub_agent'
      ? selectedAgent?.name
      : form.agency_name.trim()

    for (const seat of seatsToSell) {
      const { data: receiptNum } = await supabase.rpc('generate_receipt_number')

      await supabase
        .from('ticket_seats')
        .update({
          status:          'sold',
          sold_to_type:    mode === 'sub_agent' ? 'sub_agent' : 'agency',
          sub_agent_id:    mode === 'sub_agent' ? form.sub_agent_id : null,
          buyer_name:      buyerName,
          sold_price:      priceEach,
          sold_date:       form.sale_date,
          pnr:             form.pnr || null,
          payment_method:  form.payment_method,
          payment_status:  form.payment_status,
          receipt_number:  receiptNum || null,
          notes:           form.notes || null,
        })
        .eq('id', seat.id)
    }

    // Update sub-agent balance if on credit
    if (
      mode === 'sub_agent' &&
      form.sub_agent_id &&
      form.payment_status !== 'received'
    ) {
      await supabase
        .from('sub_agents')
        .update({
          current_balance: agentBalance + totalPrice,
        })
        .eq('id', form.sub_agent_id)
    }

    setLoading(false)
    setDone(true)
    router.refresh()
  }

  // ── DONE STATE ──────────────────────────────────────
  if (done) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className={`px-6 py-5 text-center ${
            mode === 'sub_agent' ? 'bg-green-600' : 'bg-orange-600'
          }`}>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-white" />
            </div>
            <h2 className="font-bold text-white text-xl">Sale Complete!</h2>
            <p className="text-white/70 text-sm mt-1">
              {qty} seat{qty > 1 ? 's' : ''} sold —{' '}
              {formatCurrency(totalPrice, batch.currency)}
            </p>
          </div>

          <div className="p-6 space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              {[
                {
                  label: mode === 'sub_agent' ? 'Sub-agent' : 'Agency',
                  value: mode === 'sub_agent'
                    ? selectedAgent?.name
                    : form.agency_name,
                },
                {
                  label: 'Route',
                  value: `${batch.route_from} → ${batch.route_to}`,
                },
                { label: 'Airline',     value: batch.airline                          },
                { label: 'Seats sold',  value: `${qty} seat${qty > 1 ? 's' : ''}`   },
                { label: 'Price/seat',  value: formatCurrency(priceEach, batch.currency) },
                { label: 'Total',       value: formatCurrency(totalPrice, batch.currency) },
                { label: 'Profit',      value: formatCurrency(profit, batch.currency)     },
                { label: 'Payment',     value: form.payment_status === 'received'
                    ? '✅ Received'
                    : '⏳ On credit'
                },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>

            {form.payment_status !== 'received' && mode === 'sub_agent' && selectedAgent && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-700">
                ⚠️ {selectedAgent.name}'s new balance:{' '}
                <span className="font-bold">
                  {formatCurrency(agentBalance + totalPrice)}
                </span>{' '}
                / Limit: {formatCurrency(agentLimit)}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN FORM ───────────────────────────────────────
  const isAgent = mode === 'sub_agent'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">
              ←
            </button>
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                {isAgent
                  ? <Handshake size={16} className="text-green-600" />
                  : <Building2  size={16} className="text-orange-600" />
                }
                {isAgent ? 'Sub-Agent Sale' : 'Agency Sale'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {batch.airline} • {batch.route_from} → {batch.route_to} •{' '}
                {seats.length} seats available
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="b2b-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700
                px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Buyer info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                {isAgent ? 'Sub-agent details' : 'Agency details'}
              </h3>

              {isAgent ? (
                <>
                  <select
                    name="sub_agent_id"
                    value={form.sub_agent_id}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2
                      text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select sub-agent...</option>
                    {subAgents.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Balance: {formatCurrency(a.current_balance)} /
                        Limit: {formatCurrency(a.credit_limit)}
                      </option>
                    ))}
                  </select>

                  {selectedAgent && (
                    <div className={`rounded-xl p-3 text-xs ${
                      wouldExceed
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-100'
                    }`}>
                      <p className={`font-semibold mb-1 ${
                        wouldExceed ? 'text-red-800' : 'text-green-800'
                      }`}>
                        {selectedAgent.name} — Credit status
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-gray-400">Current balance</p>
                          <p className="font-bold text-gray-800">
                            {formatCurrency(agentBalance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">This sale</p>
                          <p className="font-bold text-orange-600">
                            +{formatCurrency(totalPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Credit limit</p>
                          <p className="font-bold text-gray-800">
                            {formatCurrency(agentLimit)}
                          </p>
                        </div>
                      </div>

                      {/* Credit bar */}
                      <div className="mt-2">
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div className="h-full flex">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{
                                width: agentLimit > 0
                                  ? `${Math.min((agentBalance / agentLimit) * 100, 100)}%`
                                  : '0%'
                              }}
                            />
                            {form.payment_status !== 'received' && (
                              <div
                                className={`h-full transition-all ${
                                  wouldExceed ? 'bg-red-500' : 'bg-yellow-400'
                                }`}
                                style={{
                                  width: agentLimit > 0
                                    ? `${Math.min((totalPrice / agentLimit) * 100, 100)}%`
                                    : '0%'
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <p className={`text-xs mt-1 ${
                          wouldExceed ? 'text-red-600 font-medium' : 'text-gray-400'
                        }`}>
                          {agentLimit > 0
                            ? `${Math.round(((agentBalance + (form.payment_status !== 'received' ? totalPrice : 0)) / agentLimit) * 100)}% of limit used`
                            : 'No credit limit set'
                          }
                          {wouldExceed && ' — WILL EXCEED LIMIT'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Agency name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="agency_name"
                      value={form.agency_name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Sunrise Travels Lahore"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2
                        text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contact person
                    </label>
                    <input
                      name="contact_person"
                      value={form.contact_person}
                      onChange={handleChange}
                      placeholder="Name..."
                      className="w-full border border-gray-300 rounded-xl px-3 py-2
                        text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+92 300..."
                      className="w-full border border-gray-300 rounded-xl px-3 py-2
                        text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Seats & pricing */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                Seats & pricing
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Number of seats <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={seats.length}
                    name="qty"
                    value={form.qty}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">
                    Max: {seats.length} available
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price per seat ({form.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="price_per_seat"
                    value={form.price_per_seat}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">
                    Default: {isAgent
                      ? formatCurrency(batch.agent_price,  batch.currency)
                      : formatCurrency(batch.agency_price, batch.currency)
                    }
                  </p>
                </div>
              </div>

              {/* Which seats will be assigned */}
              {seats.length > 0 && qty > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-2">
                    Seats to be assigned:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {seats.slice(0, qty).map((seat, i) => (
                      <span key={seat.id}
                        className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-mono font-bold">
                        {seat.seat_number ?? `#${i+1}`}
                      </span>
                    ))}
                    {qty > seats.length && (
                      <span className="text-xs text-red-500 font-medium">
                        ⚠ Not enough seats!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Payment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit">On credit</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment status
                  </label>
                  <select
                    name="payment_status"
                    value={form.payment_status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="received">✅ Received</option>
                    <option value="pending">⏳ On credit / pending</option>
                    <option value="overdue">🔴 Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PNR (optional)
                  </label>
                  <input
                    name="pnr"
                    value={form.pnr}
                    onChange={handleChange}
                    placeholder="e.g. ABC123"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                      font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sale date
                  </label>
                  <input
                    type="date"
                    name="sale_date"
                    value={form.sale_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2
                    text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Fixed footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">
                {qty} seat{qty > 1 ? 's' : ''} ×{' '}
                {formatCurrency(priceEach, batch.currency)}
              </p>
              <p className="text-xl font-black text-gray-900">
                {formatCurrency(totalPrice, batch.currency)}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Profit: {profit >= 0 ? '+' : ''}{formatCurrency(profit, batch.currency)}
              </p>
              <p className="text-gray-400 mt-0.5">
                {qty > 0 && `${Math.round((profit / (totalCost || 1)) * 100)}% ROI`}
              </p>
            </div>
          </div>
          <button
            type="submit"
            form="b2b-form"
            disabled={loading || qty > seats.length}
            className={`w-full text-white py-3 rounded-xl font-bold transition
              disabled:opacity-50 flex items-center justify-center gap-2 ${
              isAgent
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isAgent
              ? <Handshake size={16} />
              : <Building2  size={16} />
            }
            {loading
              ? 'Processing...'
              : `Confirm — ${formatCurrency(totalPrice, batch.currency)}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}