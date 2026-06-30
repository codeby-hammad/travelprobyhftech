'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Info, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const AIRLINES = [
  'PIA', 'Emirates', 'Qatar Airways', 'Saudi Airlines',
  'Air Arabia', 'Flydubai', 'Turkish Airlines',
  'Etihad', 'Serene Air', 'AirSial', 'Other'
]

const CITIES = [
  'Karachi (KHI)', 'Lahore (LHE)', 'Islamabad (ISB)',
  'Peshawar (PEW)', 'Quetta (UET)', 'Multan (MUX)',
  'Jeddah (JED)', 'Madinah (MED)', 'Riyadh (RUH)',
  'Dubai (DXB)', 'Abu Dhabi (AUH)', 'Sharjah (SHJ)',
  'Doha (DOH)', 'Istanbul (IST)', 'Kuala Lumpur (KUL)',
  'Bangkok (BKK)', 'London (LHR)', 'Toronto (YYZ)',
]

export default function NewBatchForm({ suppliers }: { suppliers: any[] }) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [step,    setStep]    = useState<1 | 2>(1)

  const [form, setForm] = useState({
  
  journey_type:       'one_way',
  return_airline:     '',
  return_flight_no:   '',
  return_from:        '',
  return_to:          '',
  return_flight_date: '',
    airline:        '',
    custom_airline: '',
    flight_number:  '',
    route_from:     '',
    route_to:       '',
    flight_date:    '',
    return_date:    '',
    seat_class:     'economy',
    supplier_id:    '',
    purchased_from: '',
    purchase_date:  new Date().toISOString().split('T')[0],
    cost_per_seat:  '',
    total_seats:    '',
    currency:       'PKR',
    retail_price:   '',
    agent_price:    '',
    agency_price:   '',
    expiry_date:    '',
    notes:          '',
 
  })


  // Age category pricing
  const [agePricing, setAgePricing] = useState({
    adult_price:  '',
    child_price:  '',
    infant_price: '',
  })

  // Seat numbers — one per seat
  const [seatNumbers, setSeatNumbers] = useState<string[]>([])
  const [bulkSeats,   setBulkSeats]   = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }

      // Auto-suggest selling prices when cost entered
      if (name === 'cost_per_seat' && value) {
        const cost = parseFloat(value)
        if (!isNaN(cost)) {
          if (!prev.retail_price) next.retail_price  = Math.ceil(cost * 1.35).toString()
          if (!prev.agent_price)  next.agent_price   = Math.ceil(cost * 1.22).toString()
          if (!prev.agency_price) next.agency_price  = Math.ceil(cost * 1.15).toString()
        }
      }

      // Auto-suggest age pricing when retail price set
      if (name === 'retail_price' && value) {
        const retail = parseFloat(value)
        if (!isNaN(retail)) {
          setAgePricing({
            adult_price:  Math.ceil(retail).toString(),
            child_price:  Math.ceil(retail * 0.75).toString(),
            infant_price: Math.ceil(retail * 0.10).toString(),
          })
        }
      }

      return next
    })
  }

  // Generate seat number slots when total_seats changes
  function handleTotalSeatsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const count = parseInt(e.target.value || '0')
    setForm(prev => ({ ...prev, total_seats: e.target.value }))
    setSeatNumbers(Array.from({ length: count }, (_, i) => seatNumbers[i] ?? ''))
  }

  // Parse bulk seat entry e.g. "1A,1B,1C" or "1A 1B 1C"
  function parseBulkSeats() {
    const parsed = bulkSeats
      .split(/[\s,،\n]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)

    const count = parseInt(form.total_seats || '0')
    const filled = Array.from(
      { length: count },
      (_, i) => parsed[i] ?? seatNumbers[i] ?? ''
    )
    setSeatNumbers(filled)
    setBulkSeats('')
  }

  function updateSeat(index: number, value: string) {
    setSeatNumbers(prev => {
      const next = [...prev]
      next[index] = value.toUpperCase()
      return next
    })
  }

  // Calculated values
  const cost      = parseFloat(form.cost_per_seat || '0')
  const seats     = parseInt(form.total_seats     || '0')
  const retail    = parseFloat(form.retail_price  || '0')
  const totalInv  = cost * seats
  const maxProfit = (retail - cost) * seats
  const roi       = cost > 0 ? Math.round(((retail - cost) / cost) * 100 * 10) / 10 : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const airline = form.airline === 'Other' ? form.custom_airline : form.airline
    if (!airline) { setError('Please enter airline name'); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile  } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    const orgId = profile!.organization_id

    // Create batch
    const { data: batch, error: batchError } = await supabase
      .from('ticket_batches')
      .insert({
        organization_id: orgId,
        airline,
        flight_number:   form.flight_number   || null,
        route_from:      form.route_from,
        route_to:        form.route_to,
        flight_date:     form.flight_date,
        return_date:     form.return_date      || null,
         journey_type:       form.journey_type,
    return_airline:     form.return_airline     || null,
    return_flight_no:   form.return_flight_no   || null,
    return_from:        form.return_from         || null,
    return_to:          form.return_to           || null,
    return_flight_date: form.return_flight_date  || null,
        seat_class:      form.seat_class,
        supplier_id:     form.supplier_id      || null,
        purchased_from:  form.purchased_from   || null,
        purchase_date:   form.purchase_date,
        cost_per_seat:   parseFloat(form.cost_per_seat),
        total_seats:     parseInt(form.total_seats),
        currency:        form.currency,
        retail_price:    parseFloat(form.retail_price),
        agent_price:     parseFloat(form.agent_price),
        agency_price:    parseFloat(form.agency_price),
        expiry_date:     form.expiry_date      || null,
        notes:           form.notes            || null,
        created_by:      user!.id,
      })
      .select()
      .single()

    if (batchError) { setError(batchError.message); setLoading(false); return }

    // Update age-based pricing (auto-created by trigger, just update values)
    if (agePricing.adult_price) {
      await supabase
        .from('ticket_batch_pricing')
        .upsert([
          {
            batch_id:     batch.id,
            age_category: 'adult',
            price:        parseFloat(agePricing.adult_price),
            description:  'Adult fare (12+ years)',
          },
          {
            batch_id:     batch.id,
            age_category: 'child',
            price:        parseFloat(agePricing.child_price  || '0'),
            description:  'Child fare (2-11 years)',
          },
          {
            batch_id:     batch.id,
            age_category: 'infant',
            price:        parseFloat(agePricing.infant_price || '0'),
            description:  'Infant fare (0-23 months)',
          },
        ], { onConflict: 'batch_id,age_category' })
    }

    // Update seat numbers if provided
    if (seatNumbers.some(s => s.trim())) {
      const { data: createdSeats } = await supabase
        .from('ticket_seats')
        .select('id')
        .eq('batch_id', batch.id)
        .order('created_at')

      if (createdSeats) {
        for (let i = 0; i < createdSeats.length; i++) {
          if (seatNumbers[i]?.trim()) {
            await supabase
              .from('ticket_seats')
              .update({ seat_number: seatNumbers[i].trim() })
              .eq('id', createdSeats[i].id)
          }
        }
      }
    }

    router.push(`/dashboard/inventory/${batch.id}`)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/inventory" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buy Ticket Batch</h1>
          <p className="text-gray-500 text-sm">
            Bulk seats khareedein aur inventory mein add karein
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: 'Flight & pricing' },
          { n: 2, label: 'Seat numbers'     },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step === 2 && setStep(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                step === s.n
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                {s.n}
              </span>
              {s.label}
            </button>
            {i < 1 && <span className="text-gray-300">→</span>}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* ── STEP 1 ───────────────────────────────── */}
        {step === 1 && (
          <>
            {/* Flight info */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Flight Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Airline <span className="text-red-500">*</span>
                  </label>
                  <select name="airline" value={form.airline} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select airline...</option>
                    {AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {form.airline === 'Other' && (
                    <input
                      name="custom_airline" value={form.custom_airline} onChange={handleChange}
                      placeholder="Enter airline name"
                      className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flight number
                  </label>
                  <input name="flight_number" value={form.flight_number} onChange={handleChange}
                    placeholder="e.g. PK-301"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From <span className="text-red-500">*</span>
                  </label>
                  <select name="route_from" value={form.route_from} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select city...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To <span className="text-red-500">*</span>
                  </label>
                  <select name="route_to" value={form.route_to} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select city...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flight date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" name="flight_date" value={form.flight_date}
                    onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return date
                  </label>
                  <input type="date" name="return_date" value={form.return_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

{/* Journey type */}
<div className="col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Journey type
  </label>
  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
    {[
      { value: 'one_way',    label: '→',    desc: 'One way'    },
      { value: 'return',     label: '⇄',    desc: 'Return'     },
      { value: 'connecting', label: '→→',   desc: 'Connecting' },
      { value: 'open_jaw',   label: '⤡',    desc: 'Open jaw'   },
      { value: 'multi_city', label: '→→→',  desc: 'Multi-city' },
    ].map(j => (
      <button
        key={j.value}
        type="button"
        onClick={() => setForm(p => ({ ...p, journey_type: j.value }))}
        className={`p-3 rounded-xl border-2 text-center transition ${
          form.journey_type === j.value
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-100 hover:border-gray-200'
        }`}
      >
        <p className="text-lg font-bold text-gray-700">{j.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{j.desc}</p>
      </button>
    ))}
  </div>
</div>

{/* Return flight details — only show if return or open-jaw */}
{(form.journey_type === 'return' || form.journey_type === 'open_jaw') && (
  <div className="col-span-2">
    <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-green-800">
        {form.journey_type === 'return' ? '↩ Return flight details' : '↩ Return leg (different city)'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Return airline
          </label>
          <select name="return_airline" value={form.return_airline} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Same as outbound</option>
            {AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Return flight no.
          </label>
          <input name="return_flight_no" value={form.return_flight_no} onChange={handleChange}
            placeholder="e.g. PK-302"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Return from
          </label>
          <select name="return_from" value={form.return_from} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">
              {form.journey_type === 'return'
                ? `Same as destination (${form.route_to || '—'})`
                : 'Select different city...'}
            </option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Return to
          </label>
          <select name="return_to" value={form.return_to} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">
              {form.journey_type === 'return'
                ? `Same as origin (${form.route_from || '—'})`
                : 'Select city...'}
            </option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Return flight date
          </label>
          <input type="date" name="return_flight_date" value={form.return_flight_date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
    </div>
  </div>
)}

{/* Journey summary */}
{form.route_from && form.route_to && (
  <div className="col-span-2">
    <div className="bg-blue-50 rounded-xl p-3 text-sm">
      <p className="font-medium text-blue-900">
        {form.journey_type === 'one_way' &&
          `→ ${form.route_from} → ${form.route_to}`
        }
        {form.journey_type === 'return' &&
          `⇄ ${form.route_from} → ${form.route_to} → ${form.return_from || form.route_from}`
        }
        {form.journey_type === 'connecting' &&
          `→→ Multi-leg (add legs below)`
        }
        {form.journey_type === 'open_jaw' &&
          `⤡ ${form.route_from} → ${form.route_to} / ${form.return_from || '?'} → ${form.return_to || form.route_from}`
        }
        {form.journey_type === 'multi_city' &&
          `→→→ Multi-city (add legs below)`
        }
      </p>
      <p className="text-blue-600 text-xs mt-1 capitalize">
        {form.journey_type.replace('_', ' ')} ticket
      </p>
    </div>
  </div>
)}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select name="seat_class" value={form.seat_class} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry date
                  </label>
                  <input type="date" name="expiry_date" value={form.expiry_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Purchase info */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Purchase Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select name="supplier_id" value={form.supplier_id} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchased from
                  </label>
                  <input name="purchased_from" value={form.purchased_from} onChange={handleChange}
                    placeholder="e.g. PIA GSA Karachi"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase date
                  </label>
                  <input type="date" name="purchase_date" value={form.purchase_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select name="currency" value={form.currency} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>PKR</option>
                    <option>USD</option>
                    <option>SAR</option>
                    <option>AED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total seats <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min="1" name="total_seats"
                    value={form.total_seats}
                    onChange={handleTotalSeatsChange}
                    required placeholder="e.g. 50"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost per seat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min="0" name="cost_per_seat"
                    value={form.cost_per_seat} onChange={handleChange}
                    required placeholder="e.g. 45000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {totalInv > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Investment summary</p>
                  <p className="text-blue-700">
                    {seats} seats × {formatCurrency(cost)} ={' '}
                    <span className="font-bold">{formatCurrency(totalInv)}</span> total
                  </p>
                </div>
              )}
            </div>

            {/* Selling prices */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">
                Selling Prices (by buyer type)
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retail price
                    <span className="text-xs text-gray-400 block font-normal">Walk-in customers</span>
                  </label>
                  <input type="number" min="0" name="retail_price" value={form.retail_price}
                    onChange={handleChange} required placeholder="e.g. 65000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {retail > 0 && cost > 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      +{Math.round(((retail - cost) / cost) * 100)}% margin
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent price
                    <span className="text-xs text-gray-400 block font-normal">Sub-agents</span>
                  </label>
                  <input type="number" min="0" name="agent_price" value={form.agent_price}
                    onChange={handleChange} required placeholder="e.g. 58000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {parseFloat(form.agent_price) > 0 && cost > 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      +{Math.round(((parseFloat(form.agent_price) - cost) / cost) * 100)}% margin
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agency price
                    <span className="text-xs text-gray-400 block font-normal">Other agencies</span>
                  </label>
                  <input type="number" min="0" name="agency_price" value={form.agency_price}
                    onChange={handleChange} required placeholder="e.g. 55000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {parseFloat(form.agency_price) > 0 && cost > 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      +{Math.round(((parseFloat(form.agency_price) - cost) / cost) * 100)}% margin
                    </p>
                  )}
                </div>
              </div>

              {maxProfit > 0 && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-green-900 mb-1">Max profit projection</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-green-600">Max profit (retail)</p>
                      <p className="font-bold text-green-800">{formatCurrency(maxProfit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Profit per seat</p>
                      <p className="font-bold text-green-800">{formatCurrency(retail - cost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">ROI</p>
                      <p className="font-bold text-green-800">{roi}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Age category pricing */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">
                  Age Category Pricing
                </h2>
                <div className="group relative">
                  <Info size={14} className="text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-6 w-56 bg-gray-900 text-white text-xs p-3 rounded-lg opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none">
                    Used for group bookings with Adult/Child/Infant passengers.
                    Auto-filled from retail price (Adult 100%, Child 75%, Infant 10%).
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    key:   'adult_price',
                    label: '👨 Adult fare',
                    sub:   '12+ years',
                    pct:   '100%',
                  },
                  {
                    key:   'child_price',
                    label: '👦 Child fare',
                    sub:   '2–11 years',
                    pct:   '~75%',
                  },
                  {
                    key:   'infant_price',
                    label: '👶 Infant fare',
                    sub:   '0–23 months (lap)',
                    pct:   '~10%',
                  },
                ].map(cat => (
                  <div key={cat.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {cat.label}
                      <span className="text-xs text-gray-400 block font-normal">
                        {cat.sub} • {cat.pct} of adult
                      </span>
                    </label>
                    <input
                      type="number" min="0"
                      value={(agePricing as any)[cat.key]}
                      onChange={e => setAgePricing(prev => ({
                        ...prev, [cat.key]: e.target.value
                      }))}
                      placeholder="e.g. 65000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400">
                💡 These prices are used when selling group tickets with mixed age categories (Umrah families etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                placeholder="Any special terms or conditions..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex gap-3">
              {seats > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
                >
                  Next — Enter seat numbers →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Creating...' : 'Create batch'}
                </button>
              )}
              <Link href="/dashboard/inventory"
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm">
                Cancel
              </Link>
            </div>
          </>
        )}

        {/* ── STEP 2: SEAT NUMBERS ─────────────────── */}
        {step === 2 && (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Seat Numbers
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({seats} seats)
                  </span>
                </h2>
                <span className="text-xs text-gray-400">
                  Optional — you can enter later when selling
                </span>
              </div>

              {/* Bulk entry */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Bulk enter (paste all seat numbers)
                </p>
                <div className="flex gap-2">
                  <input
                    value={bulkSeats}
                    onChange={e => setBulkSeats(e.target.value)}
                    placeholder="e.g. 1A, 1B, 1C, 2A, 2B ... (comma or space separated)"
                    className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={parseBulkSeats}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-blue-500 mt-1">
                  Enter seat numbers separated by commas or spaces.
                  They will be assigned in order to each seat slot.
                </p>
              </div>

              {/* Individual seat inputs */}
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {seatNumbers.map((seatNum, i) => (
                  <div key={i}>
                    <p className="text-xs text-gray-400 text-center mb-0.5">
                      #{i + 1}
                    </p>
                    <input
                      value={seatNum}
                      onChange={e => updateSeat(i, e.target.value)}
                      placeholder="—"
                      maxLength={4}
                      className="w-full border border-gray-200 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 flex items-center gap-4">
                <span>
                  ✅ Filled: {seatNumbers.filter(s => s.trim()).length}
                </span>
                <span>
                  ⬜ Empty: {seatNumbers.filter(s => !s.trim()).length}
                </span>
                <span className="text-gray-400">
                  (Empty seats will get numbers when sold)
                </span>
              </div>
            </div>

            {/* Summary before creating */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Batch summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Route',         value: `${form.route_from} → ${form.route_to}` },
                  { label: 'Airline',       value: form.airline === 'Other' ? form.custom_airline : form.airline },
                  { label: 'Flight date',   value: form.flight_date },
                  { label: 'Total seats',   value: `${seats} seats` },
                  { label: 'Cost per seat', value: formatCurrency(cost) },
                  { label: 'Total invest',  value: formatCurrency(totalInv) },
                  { label: 'Retail price',  value: formatCurrency(retail) },
                  { label: 'Max profit',    value: formatCurrency(maxProfit) },
                ].map(row => (
                  <div key={row.label}>
                    <p className="text-xs text-gray-400">{row.label}</p>
                    <p className="font-medium text-gray-900">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Age pricing summary */}
              {agePricing.adult_price && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <p className="text-xs text-gray-500 mb-2">Age category pricing:</p>
                  <div className="flex gap-4 text-xs">
                    <span className="text-blue-700">
                      👨 Adult: {formatCurrency(parseFloat(agePricing.adult_price || '0'))}
                    </span>
                    <span className="text-purple-700">
                      👦 Child: {formatCurrency(parseFloat(agePricing.child_price || '0'))}
                    </span>
                    <span className="text-orange-700">
                      👶 Infant: {formatCurrency(parseFloat(agePricing.infant_price || '0'))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Creating batch...' : `✅ Create batch — ${seats} seats`}
              </button>
            </div>
          </>
        )}
      </form>
    </>
  )
}