'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { createClient }        from '@/lib/supabase/client'
import {
  ArrowLeft, Plus, Trash2,
  Users, Plane, AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { BatchPricing } from '@/types'

type Passenger = {
  full_name:       string
  passport_number: string
  nationality:     string
  date_of_birth:   string
  gender:          string
  age_category:    'adult' | 'child' | 'infant'
  seat_number:     string
  pnr:             string
  notes:           string
  client_id:       string
}

const emptyPassenger = (index: number = 0, seats: any[] = []): Passenger => {
  const nonInfantsBefore = index  // for first passenger, index 0 = first available seat
  const autoSeat = seats[nonInfantsBefore]?.seat_number ?? ''
  return {
    full_name:       '',
    passport_number: '',
    nationality:     'Pakistani',
    date_of_birth:   '',
    gender:          'male',
    age_category:    'adult',
    seat_number:     autoSeat,
    pnr:             '',
    notes:           '',
    client_id:       '',
  }
}

// Calculate age category from date of birth
function getAgeCategory(dob: string): 'adult' | 'child' | 'infant' {
  if (!dob) return 'adult'
  const today    = new Date()
  const birth    = new Date(dob)
  const months   = (today.getFullYear() - birth.getFullYear()) * 12 +
                   (today.getMonth()    - birth.getMonth())
  if (months < 24)  return 'infant'
  if (months < 144) return 'child'   // 12 years = 144 months
  return 'adult'
}

function getAgeCategoryLabel(cat: string) {
  return cat === 'adult'  ? 'Adult (12+ years)'    :
         cat === 'child'  ? 'Child (2-11 years)'   :
                             'Infant (0-23 months)'
}

type Props = {
  batch:          any
  pricing:        BatchPricing[]
  clients:        any[]
  availableSeats: any[]
}

export default function GroupSaleForm({
  batch, pricing, clients, availableSeats
}: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [passengers, setPassengers] = useState<Passenger[]>([
  emptyPassenger(0, availableSeats)
])

  const [groupForm, setGroupForm] = useState({
    pnr:            '',
    buyer_name:     '',
    buyer_phone:    '',
    lead_client_id: '',
    payment_method: 'cash',
    payment_status: 'received',
    sale_date:      new Date().toISOString().split('T')[0],
    notes:          '',
  })

  // Get price for age category
  function getPrice(cat: 'adult' | 'child' | 'infant'): number {
    const found = pricing.find(p => p.age_category === cat)
    return found ? Number(found.price) : Number(batch.retail_price)
  }

  function updatePassenger(
  index: number,
  field: keyof Passenger,
  value: string
) {
  setPassengers(prev => {
    const next = [...prev]
    next[index] = { ...next[index], [field]: value }

    // Auto-detect age category from DOB
    if (field === 'date_of_birth' && value) {
      next[index].age_category = getAgeCategory(value)
    }

    // When age category changes to infant — clear seat
    // When changes FROM infant — auto-assign next available seat
    if (field === 'age_category') {
      if (value === 'infant') {
        next[index].seat_number = ''
      } else if (next[index].seat_number === '') {
        // Count non-infant passengers before this index
        const nonInfantsBefore = next
          .slice(0, index)
          .filter(p => p.age_category !== 'infant').length
        next[index].seat_number = availableSeats[nonInfantsBefore]?.seat_number ?? ''
      }
    }

    return next
  })
}

function addPassenger() {
  setPassengers(prev => {
    // Count how many non-infant passengers exist to get correct seat index
    const nonInfantCount = prev.filter(p => p.age_category !== 'infant').length
    const autoSeat = availableSeats[nonInfantCount]?.seat_number ?? ''
    return [
      ...prev,
      emptyPassenger(nonInfantCount, availableSeats),
    ]
  })
}

  // Fill from client CRM
  function fillFromClient(index: number, clientId: string) {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    setPassengers(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        client_id:       clientId,
        full_name:       client.full_name       ?? '',
        passport_number: client.passport_number ?? '',
        nationality:     client.nationality     ?? 'Pakistani',
        date_of_birth:   client.date_of_birth   ?? '',
        age_category:    client.date_of_birth
          ? getAgeCategory(client.date_of_birth)
          : 'adult',
      }
      return next
    })
  }

  // Calculate totals
  const totalAmount = passengers.reduce(
    (sum, p) => sum + getPrice(p.age_category), 0
  )

  const adultCount  = passengers.filter(p => p.age_category === 'adult').length
  const childCount  = passengers.filter(p => p.age_category === 'child').length
  const infantCount = passengers.filter(p => p.age_category === 'infant').length

  // Seats needed (infants don't need seats)
  const seatsNeeded = passengers.filter(p => p.age_category !== 'infant').length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validation
    const invalid = passengers.find(p => !p.full_name.trim())
    if (invalid) {
      setError('All passengers must have a full name')
      return
    }

    if (seatsNeeded > availableSeats.length) {
      setError(`Not enough seats. Need ${seatsNeeded}, only ${availableSeats.length} available.`)
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

    // Step 1 — Create group sale record
    const { data: groupSale, error: groupError } = await supabase
      .from('ticket_group_sales')
      .insert({
        organization_id: orgId,
        batch_id:        batch.id,
        pnr:             groupForm.pnr             || null,
        lead_client_id:  groupForm.lead_client_id  || null,
        buyer_name:      groupForm.buyer_name       || null,
        buyer_phone:     groupForm.buyer_phone      || null,
        adult_count:     adultCount,
        child_count:     childCount,
        infant_count:    infantCount,
        total_amount:    totalAmount,
        paid_amount:     groupForm.payment_status === 'received' ? totalAmount : 0,
        currency:        batch.currency,
        payment_method:  groupForm.payment_method,
        payment_status:  groupForm.payment_status,
        sale_date:       groupForm.sale_date,
        notes:           groupForm.notes            || null,
        created_by:      user!.id,
      })
      .select()
      .single()

    if (groupError) {
      setError(groupError.message)
      setLoading(false)
      return
    }

    // Step 2 — Assign seats to non-infant passengers
    const seatsToUse = availableSeats.slice(0, seatsNeeded)
    let   seatIndex  = 0

    // Step 3 — Create passenger records and mark seats as sold
    for (const pax of passengers) {
      const needsSeat = pax.age_category !== 'infant'
      const seat      = needsSeat ? seatsToUse[seatIndex] : null
      if  (needsSeat) seatIndex++

      // Generate e-ticket number
      const { data: etNum } = await supabase
        .rpc('generate_eticket_number', { airline_code: batch.airline })

      // Create passenger record
      const { data: passenger } = await supabase
        .from('ticket_passengers')
        .insert({
          organization_id: orgId,
          batch_id:        batch.id,
          seat_id:         seat?.id       ?? null,
          full_name:       pax.full_name.toUpperCase().trim(),
          passport_number: pax.passport_number || null,
          nationality:     pax.nationality     || null,
          date_of_birth:   pax.date_of_birth   || null,
          gender:          pax.gender,
          age_category:    pax.age_category,
          pnr:             groupForm.pnr        || null,
          eticket_number:  etNum               || null,
          seat_number:     pax.seat_number || seat?.seat_number || null,
          ticket_price:    getPrice(pax.age_category),
          currency:        batch.currency,
          baggage_kg:      pax.age_category === 'infant' ? 10 : batch.baggage_kg ?? 23,
          group_sale_id:   groupSale.id,
          client_id:       pax.client_id      || null,
          payment_status:  groupForm.payment_status === 'received' ? 'received' : 'pending',
          notes:           pax.notes          || null,
          created_by:      user!.id,
        })
        .select()
        .single()

      // Mark seat as sold
      if (seat) {
        await supabase
          .from('ticket_seats')
          .update({
            status:          'sold',
            sold_to_type:    'customer',
            client_id:       pax.client_id      || null,
            buyer_name:      pax.full_name.toUpperCase(),
            sold_price:      getPrice(pax.age_category),
            sold_date:       groupForm.sale_date,
            seat_number:     pax.seat_number || seat.seat_number || null,
            pnr:             groupForm.pnr   || null,
            payment_method:  groupForm.payment_method,
            payment_status:  groupForm.payment_status === 'received'
                               ? 'received' : 'pending',
          })
          .eq('id', seat.id)
      }
    }

    setLoading(false)
    router.push(`/dashboard/inventory/${batch.id}/group-sale/${groupSale.id}`)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/inventory/${batch.id}`}
          className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group ticket sale</h1>
          <p className="text-gray-500 text-sm">
            {batch.airline} — {batch.route_from} → {batch.route_to} •{' '}
            {new Date(batch.flight_date).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
          </p>
        </div>
      </div>

      {/* Pricing info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
        <p className="font-semibold text-blue-900 text-sm mb-2 flex items-center gap-2">
          <Plane size={14} /> Fare breakdown
        </p>
        <div className="grid grid-cols-3 gap-4">
          {(['adult','child','infant'] as const).map(cat => (
            <div key={cat} className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">{getAgeCategoryLabel(cat)}</p>
              <p className="text-lg font-black text-blue-700 mt-1">
                {formatCurrency(getPrice(cat), batch.currency)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-500 mt-2">
          ✈ {availableSeats.length} seats available •
          Infants travel on lap (no seat required)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Group info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            Group / booking details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PNR (group booking code)
              </label>
              <input
                value={groupForm.pnr}
                onChange={e => setGroupForm(p => ({ ...p, pnr: e.target.value }))}
                placeholder="e.g. ABC123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Lead passenger / contact
              </label>
              <select
                value={groupForm.lead_client_id}
                onChange={e => setGroupForm(p => ({ ...p, lead_client_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select from CRM...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contact phone
              </label>
              <input
                value={groupForm.buyer_phone}
                onChange={e => setGroupForm(p => ({ ...p, buyer_phone: e.target.value }))}
                placeholder="+92 300 1234567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sale date
              </label>
              <input
                type="date"
                value={groupForm.sale_date}
                onChange={e => setGroupForm(p => ({ ...p, sale_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment method
              </label>
              <select
                value={groupForm.payment_method}
                onChange={e => setGroupForm(p => ({ ...p, payment_method: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment status
              </label>
              <select
                value={groupForm.payment_status}
                onChange={e => setGroupForm(p => ({ ...p, payment_status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="received">✅ Received in full</option>
                <option value="partial">⏳ Partial payment</option>
                <option value="pending">⏳ Not paid yet</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={groupForm.notes}
              onChange={e => setGroupForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Special requests, meal preferences, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={16} className="text-purple-600" />
              Passengers
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {passengers.length}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setPassengers(p => [...p, emptyPassenger()])}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition"
            >
              <Plus size={13} /> Add passenger
            </button>
          </div>


          {/* Seat assignment preview */}
{availableSeats.length > 0 && (
  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
    <p className="text-xs font-semibold text-blue-800 mb-2">
      Batch seat numbers (auto-assigned in order):
    </p>
    <div className="flex flex-wrap gap-1.5">
      {availableSeats.slice(0, passengers.filter(p => p.age_category !== 'infant').length + 3).map((seat, i) => {
        const isAssigned = i < passengers.filter(p => p.age_category !== 'infant').length
        return (
          <span key={seat.id} className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
            isAssigned
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border border-blue-200'
          }`}>
            {seat.seat_number ?? `#${i+1}`}
          </span>
        )
      })}
      {availableSeats.length > passengers.length + 3 && (
        <span className="text-xs text-blue-400">
          +{availableSeats.length - passengers.length - 3} more available
        </span>
      )}
    </div>
  </div>
)}

          <div className="space-y-4">
            {passengers.map((pax, i) => (
              <div key={i}
                className={`border rounded-xl p-4 ${
                  pax.age_category === 'adult'  ? 'border-blue-100   bg-blue-50/30'   :
                  pax.age_category === 'child'  ? 'border-purple-100 bg-purple-50/30' :
                                                   'border-orange-100 bg-orange-50/30'
                }`}>
                {/* Passenger header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      pax.age_category === 'adult'  ? 'bg-blue-100   text-blue-700'   :
                      pax.age_category === 'child'  ? 'bg-purple-100 text-purple-700' :
                                                       'bg-orange-100 text-orange-700'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      Passenger {i + 1}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      pax.age_category === 'adult'  ? 'bg-blue-100   text-blue-700'   :
                      pax.age_category === 'child'  ? 'bg-purple-100 text-purple-700' :
                                                       'bg-orange-100 text-orange-700'
                    }`}>
                      {pax.age_category === 'adult'  ? '👨 Adult'  :
                       pax.age_category === 'child'  ? '👦 Child'  :
                                                        '👶 Infant'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatCurrency(getPrice(pax.age_category), batch.currency)}
                    </span>
                     {/* ADD THIS — seat badge */}
    {pax.age_category !== 'infant' && (() => {
      const seatIndex = passengers.slice(0, i).filter(x => x.age_category !== 'infant').length
      const assignedSeat = pax.seat_number || availableSeats[seatIndex]?.seat_number
      return assignedSeat ? (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-bold">
          Seat {assignedSeat}
        </span>
      ) : null
    })()}

    {pax.age_category === 'infant' && (
      <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">
        LAP
      </span>
    )}



                  </div>
                  <div className="flex items-center gap-2">
                    {/* Fill from CRM */}
                    <select
                      value={pax.client_id}
                      onChange={e => fillFromClient(i, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                    >
                      <option value="">Fill from CRM...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPassengers(p => p.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Passenger fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full name (as on passport) <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={pax.full_name}
                      onChange={e => updatePassenger(i, 'full_name', e.target.value.toUpperCase())}
                      placeholder="AHMED KHAN"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={pax.gender}
                      onChange={e => updatePassenger(i, 'gender', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date of birth
                    </label>
                    <input
                      type="date"
                      value={pax.date_of_birth}
                      onChange={e => updatePassenger(i, 'date_of_birth', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {pax.date_of_birth && (
                      <p className={`text-xs mt-0.5 font-medium ${
                        pax.age_category === 'adult'  ? 'text-blue-600'   :
                        pax.age_category === 'child'  ? 'text-purple-600' :
                                                         'text-orange-600'
                      }`}>
                        Auto-detected: {getAgeCategoryLabel(pax.age_category)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Age category
                    </label>
                    <select
                      value={pax.age_category}
                      onChange={e => updatePassenger(i, 'age_category', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="adult">ADT — Adult (12+)</option>
                      <option value="child">CHD — Child (2-11)</option>
                      <option value="infant">INF — Infant (0-23m)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Passport number
                    </label>
                    <input
                      value={pax.passport_number}
                      onChange={e => updatePassenger(i, 'passport_number', e.target.value.toUpperCase())}
                      placeholder="AB1234567"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nationality
                    </label>
                    <input
                      value={pax.nationality}
                      onChange={e => updatePassenger(i, 'nationality', e.target.value)}
                      placeholder="Pakistani"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Seat number
                    </label>
                    <input
                      value={pax.seat_number}
                      onChange={e => updatePassenger(i, 'seat_number', e.target.value.toUpperCase())}
                      placeholder={pax.age_category === 'infant' ? 'N/A (lap)' : 'e.g. 24A'}
                      disabled={pax.age_category === 'infant'}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        pax.age_category === 'infant' ? 'bg-gray-50 text-gray-400' : ''
                      }`}
                    />
                  </div>
                </div>

                {pax.age_category === 'infant' && (
                  <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                    👶 Infants travel on parent's lap — no seat required. Baggage: 10kg
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Booking summary</h2>
          <div className="space-y-2 text-sm">
            {adultCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {adultCount} Adult{adultCount > 1 ? 's' : ''} × {formatCurrency(getPrice('adult'))}
                </span>
                <span className="font-medium">
                  {formatCurrency(adultCount * getPrice('adult'))}
                </span>
              </div>
            )}
            {childCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {childCount} Child{childCount > 1 ? 'ren' : ''} × {formatCurrency(getPrice('child'))}
                </span>
                <span className="font-medium">
                  {formatCurrency(childCount * getPrice('child'))}
                </span>
              </div>
            )}
            {infantCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {infantCount} Infant{infantCount > 1 ? 's' : ''} × {formatCurrency(getPrice('infant'))}
                </span>
                <span className="font-medium">
                  {formatCurrency(infantCount * getPrice('infant'))}
                </span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
              <span className="text-gray-900">
                Total — {passengers.length} passenger{passengers.length > 1 ? 's' : ''}
              </span>
              <span className="text-blue-600">
                {formatCurrency(totalAmount, batch.currency)}
              </span>
            </div>
          </div>

          {/* Seat availability warning */}
          {seatsNeeded > availableSeats.length && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={13} />
              Need {seatsNeeded} seats but only {availableSeats.length} available
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || seatsNeeded > availableSeats.length}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Plane size={16} />
            {loading ? 'Processing...' : `Confirm sale — ${formatCurrency(totalAmount, batch.currency)}`}
          </button>
          <Link
            href={`/dashboard/inventory/${batch.id}`}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}