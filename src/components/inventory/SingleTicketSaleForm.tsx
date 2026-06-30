'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, User, Receipt } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Props = {
  batch:    any
  pricing:  any[]
  clients:  any[]
  seats:    any[]   // available seats
  onClose:  () => void
  onBack:   () => void
  organization: any
}

function getAgeCategory(dob: string): 'adult' | 'child' | 'infant' {
  if (!dob) return 'adult'
  const months = (new Date().getFullYear() - new Date(dob).getFullYear()) * 12 +
                 (new Date().getMonth()    - new Date(dob).getMonth())
  if (months < 24)  return 'infant'
  if (months < 144) return 'child'
  return 'adult'
}

const ageCatLabel: Record<string, string> = {
  adult:  'ADT — Adult (12+)',
  child:  'CHD — Child (2-11)',
  infant: 'INF — Infant (0-23m)',
}

export default function SingleTicketSaleForm({
  batch, pricing, clients, seats, onClose, onBack, organization
}: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState<any>(null)   // holds completed sale data

  const [form, setForm] = useState({
    // Passenger
    full_name:       '',
    passport_number: '',
    nationality:     'Pakistani',
    date_of_birth:   '',
    gender:          'male',
    age_category:    'adult' as 'adult' | 'child' | 'infant',
    // Sale
    client_id:       '',
    sold_to_type:    'customer',
    sub_agent_id:    '',
    buyer_name:      '',
    pnr:             '',
    seat_number:     '',
    payment_method:  'cash',
    payment_status:  'received',
    sold_date:       new Date().toISOString().split('T')[0],
    notes:           '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Auto-detect age category from DOB
      if (name === 'date_of_birth' && value) {
        next.age_category = getAgeCategory(value)
      }
      return next
    })
  }

  // Fill from CRM
  function fillFromClient(clientId: string) {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    setForm(prev => ({
      ...prev,
      client_id:       clientId,
      full_name:       client.full_name        ?? prev.full_name,
      passport_number: client.passport_number  ?? prev.passport_number,
      nationality:     client.nationality      ?? prev.nationality,
      date_of_birth:   client.date_of_birth    ?? prev.date_of_birth,
      age_category:    client.date_of_birth
        ? getAgeCategory(client.date_of_birth)
        : prev.age_category,
    }))
  }

  // Get price for selected age category
  function getPrice(): number {
    const found = pricing.find(p => p.age_category === form.age_category)
    return found ? Number(found.price) : Number(batch.retail_price)
  }

  const ticketPrice = getPrice()
  const firstAvailableSeat = seats[0]

  async function handleSell(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) {
      setError('Passenger name is required')
      return
    }
    if (!firstAvailableSeat && form.age_category !== 'infant') {
      setError('No available seats in this batch')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile  } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    const orgId = profile!.organization_id

    // Generate receipt + e-ticket
    const [{ data: receiptNum }, { data: etNum }] = await Promise.all([
      supabase.rpc('generate_receipt_number'),
      supabase.rpc('generate_eticket_number', { airline_code: batch.airline }),
    ])

    // Determine which seat to use
    const seatToUse = form.age_category !== 'infant' ? firstAvailableSeat : null

    // Mark seat as sold
    if (seatToUse) {
      await supabase
        .from('ticket_seats')
        .update({
          status:         'sold',
          sold_to_type:   form.sold_to_type,
          client_id:      form.client_id     || null,
          sub_agent_id:   form.sub_agent_id  || null,
          buyer_name:     form.full_name.toUpperCase(),
          sold_price:     ticketPrice,
          sold_date:      form.sold_date,
          seat_number:    form.seat_number   || seatToUse.seat_number || null,
          pnr:            form.pnr           || null,
          payment_method: form.payment_method,
          payment_status: form.payment_status,
          receipt_number: receiptNum         || null,
          notes:          form.notes         || null,
        })
        .eq('id', seatToUse.id)
    }

    // Create passenger record
    const { data: passenger } = await supabase
      .from('ticket_passengers')
      .insert({
        organization_id: orgId,
        batch_id:        batch.id,
        seat_id:         seatToUse?.id        ?? null,
        full_name:       form.full_name.toUpperCase().trim(),
        passport_number: form.passport_number  || null,
        nationality:     form.nationality      || null,
        date_of_birth:   form.date_of_birth    || null,
        gender:          form.gender,
        age_category:    form.age_category,
        pnr:             form.pnr              || null,
        eticket_number:  etNum                 || null,
        seat_number:     form.seat_number || seatToUse?.seat_number || null,
        ticket_price:    ticketPrice,
        currency:        batch.currency,
        baggage_kg:      form.age_category === 'infant' ? 10 : 23,
        client_id:       form.client_id        || null,
        payment_status:  form.payment_status,
        notes:           form.notes            || null,
        created_by:      user!.id,
      })
      .select()
      .single()

    setLoading(false)
    setDone({
      passenger,
      seat:          seatToUse,
      receiptNum,
      etNum,
      ticketPrice,
    })
    router.refresh()
  }

  // ── DONE STATE — show receipt summary ──────────────
  if (done) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-green-600 px-6 py-5 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt size={28} className="text-white" />
            </div>
            <h2 className="font-bold text-white text-xl">Ticket Sold!</h2>
            <p className="text-green-200 text-sm mt-1">
              {done.receiptNum}
            </p>
          </div>

          <div className="p-6 space-y-3">
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              {[
                { label: 'Passenger',    value: form.full_name.toUpperCase() },
                { label: 'Route',        value: `${batch.route_from} → ${batch.route_to}` },
                { label: 'Airline',      value: batch.airline                              },
                { label: 'Flight date',  value: formatDate(batch.flight_date)              },
                { label: 'Seat',         value: done.seat?.seat_number ?? form.seat_number ?? (form.age_category === 'infant' ? 'LAP (Infant)' : 'Auto-assigned') },
                { label: 'E-Ticket',     value: done.etNum    ?? '—'                       },
                { label: 'PNR',          value: form.pnr      || '—'                       },
                { label: 'Category',     value: ageCatLabel[form.age_category]             },
                { label: 'Amount paid',  value: formatCurrency(done.ticketPrice, batch.currency) },
                { label: 'Payment',      value: form.payment_method.replace('_', ' ')      },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Done
              </button>
              <button
                onClick={() => {
                  // Reset to sell another
                  setDone(null)
                  setForm({
                    full_name:       '',
                    passport_number: '',
                    nationality:     'Pakistani',
                    date_of_birth:   '',
                    gender:          'male',
                    age_category:    'adult',
                    client_id:       '',
                    sold_to_type:    'customer',
                    sub_agent_id:    '',
                    buyer_name:      '',
                    pnr:             '',
                    seat_number:     '',
                    payment_method:  'cash',
                    payment_status:  'received',
                    sold_date:       new Date().toISOString().split('T')[0],
                    notes:           '',
                  })
                }}
                className="py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Sell another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN FORM ───────────────────────────────────────
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
                <User size={16} className="text-blue-600" />
                Single Ticket Sale
              </h2>
              <p className="text-xs text-gray-400">
                {batch.airline} • {batch.route_from} → {batch.route_to} •{' '}
                {formatDate(batch.flight_date)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="single-sale-form" onSubmit={handleSell} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Fare info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3">
                {(['adult','child','infant'] as const).map(cat => (
                  <div key={cat} className={`rounded-lg p-3 text-center border-2 transition cursor-pointer ${
                    form.age_category === cat
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-100 hover:border-blue-200'
                  }`}
                    onClick={() => setForm(p => ({ ...p, age_category: cat }))}
                  >
                    <p className={`text-xs font-medium ${form.age_category === cat ? 'text-blue-100' : 'text-gray-400'}`}>
                      {cat === 'adult' ? '👨 Adult' : cat === 'child' ? '👦 Child' : '👶 Infant'}
                    </p>
                    <p className={`font-black text-sm mt-0.5 ${form.age_category === cat ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(
                        Number(pricing.find(p => p.age_category === cat)?.price ?? (
                          cat === 'adult'  ? batch.retail_price :
                          cat === 'child'  ? batch.retail_price * 0.75 :
                                             batch.retail_price * 0.10
                        )),
                        batch.currency
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-500 mt-2 text-center">
                Click to select age category — price auto-updates
              </p>
            </div>

            {/* Passenger details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Passenger details</h3>

              {/* Fill from CRM */}
              <select
                value={form.client_id}
                onChange={e => fillFromClient(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Fill from CRM (optional)...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full name (as on passport) <span className="text-red-500">*</span>
                </label>
                <input
                  name="full_name"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="AHMED KHAN"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {form.date_of_birth && (
                    <p className="text-xs text-blue-600 mt-0.5 font-medium">
                      Auto: {ageCatLabel[form.age_category]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Passport number
                  </label>
                  <input
                    name="passport_number"
                    value={form.passport_number}
                    onChange={handleChange}
                    placeholder="AB1234567"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nationality
                  </label>
                  <input
                    name="nationality"
                    value={form.nationality}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Ticket details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Ticket details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Seat number
                  </label>
                  <input
                    name="seat_number"
                    value={form.seat_number}
                    onChange={handleChange}
                    placeholder={
                      form.age_category === 'infant'
                        ? 'N/A — infant on lap'
                        : firstAvailableSeat?.seat_number ?? 'Auto-assigned'
                    }
                    disabled={form.age_category === 'infant'}
                    className={`w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      form.age_category === 'infant' ? 'bg-gray-50 text-gray-400' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">PNR</label>
                  <input
                    name="pnr"
                    value={form.pnr}
                    onChange={handleChange}
                    placeholder="e.g. ABC123"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                  />
                </div>
              </div>
              {form.age_category === 'infant' && (
                <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  👶 Infant travels on parent's lap — no seat required. Baggage: 10kg
                </p>
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
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online</option>
                    <option value="credit">On credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="payment_status"
                    value={form.payment_status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="received">✅ Received</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sale date
                  </label>
                  <input
                    type="date"
                    name="sold_date"
                    value={form.sold_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Optional..."
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">Ticket fare</p>
              <p className="text-xl font-black text-blue-600">
                {formatCurrency(ticketPrice, batch.currency)}
              </p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>{ageCatLabel[form.age_category]}</p>
              <p>{batch.seats_available ?? seats.length} seats remaining</p>
            </div>
          </div>
          <button
            type="submit"
            form="single-sale-form"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Receipt size={16} />
            {loading
              ? 'Processing...'
              : `Sell Ticket — ${formatCurrency(ticketPrice, batch.currency)}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}