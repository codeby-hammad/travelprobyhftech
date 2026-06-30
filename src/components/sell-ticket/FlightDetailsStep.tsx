'use client'

import { Plus, Trash2, Clock } from 'lucide-react'
import type { SaleData, FlightLeg } from './SellTicketWizard'
import { formatCurrency } from '@/lib/utils'

const AIRLINES = [
  'PIA','Emirates','Qatar Airways','Saudi Airlines','Air Arabia',
  'Flydubai','Turkish Airlines','Etihad','Serene Air','AirSial',
  'British Airways','Lufthansa','Air France','KLM','Other',
]

const CITIES = [
  'Karachi (KHI)','Lahore (LHE)','Islamabad (ISB)','Peshawar (PEW)',
  'Quetta (UET)','Multan (MUX)','Faisalabad (LYP)',
  'Jeddah (JED)','Madinah (MED)','Riyadh (RUH)','Dubai (DXB)',
  'Abu Dhabi (AUH)','Sharjah (SHJ)','Doha (DOH)','Istanbul (IST)',
  'Kuala Lumpur (KUL)','Bangkok (BKK)','London (LHR)','Toronto (YYZ)',
  'New York (JFK)','Paris (CDG)','Frankfurt (FRA)',
]

type Props = {
  data:   SaleData
  update: (p: Partial<SaleData>) => void
  onNext: () => void
  onBack: () => void
}

function LegForm({
  leg,
  label,
  color = 'blue',
  showSeatNo = false,
  onChange,
}: {
  leg:        FlightLeg
  label:      string
  color?:     string
  showSeatNo?: boolean
  onChange:   (field: keyof FlightLeg, value: string) => void
}) {
  const border = color === 'green'
    ? 'border-green-100 bg-green-50'
    : 'border-blue-100 bg-blue-50'

  return (
    <div className={`border rounded-xl p-4 ${border}`}>
      {label && <p className="font-semibold text-gray-800 text-sm mb-3">{label}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Airline</label>
          <select value={leg.airline} onChange={e => onChange('airline', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select airline...</option>
            {AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Flight no.</label>
          <input value={leg.flight_number}
            onChange={e => onChange('flight_number', e.target.value.toUpperCase())}
            placeholder="e.g. PK-301"
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <select value={leg.departure_city} onChange={e => onChange('departure_city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select city...</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <select value={leg.arrival_city} onChange={e => onChange('arrival_city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select city...</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Departure</label>
          <input type="datetime-local" value={leg.departure_time}
            onChange={e => onChange('departure_time', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Arrival</label>
          <input type="datetime-local" value={leg.arrival_time}
            onChange={e => onChange('arrival_time', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">PNR</label>
          <input value={leg.pnr} onChange={e => onChange('pnr', e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono uppercase" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Terminal</label>
          <input value={leg.terminal} onChange={e => onChange('terminal', e.target.value)}
            placeholder="e.g. T1"
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>

        {/* Seat number — shown per leg for connecting/multi-city */}
        {showSeatNo && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Seat no.</label>
            <input value={leg.seat_number ?? ''} onChange={e => onChange('seat_number' as keyof FlightLeg, e.target.value.toUpperCase())}
              placeholder="e.g. 24A"
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
          </div>
        )}
      </div>
    </div>
  )
}

function calcLayover(leg1: FlightLeg, leg2: FlightLeg): string | null {
  if (!leg1.arrival_time || !leg2.departure_time) return null
  const diff = Math.round(
    (new Date(leg2.departure_time).getTime() - new Date(leg1.arrival_time).getTime()) / 60000
  )
  if (diff <= 0) return null
  return diff >= 60
    ? `${Math.floor(diff/60)}h ${diff%60 > 0 ? diff%60+'m' : ''}`.trim()
    : `${diff}m`
}

export default function FlightDetailsStep({ data, update, onNext, onBack }: Props) {
  function updateOutbound(field: keyof FlightLeg, value: string) {
    update({ outbound: { ...data.outbound, [field]: value } })
  }

  function updateReturn(field: keyof FlightLeg, value: string) {
    update({ return_leg: { ...data.return_leg, [field]: value } })
  }

  function updateLeg(index: number, field: keyof FlightLeg, value: string) {
    const next = [...data.legs]
    next[index] = { ...next[index], [field]: value }
    update({ legs: next })
  }

  function addLeg() {
    const lastLeg = data.legs[data.legs.length - 1]
    update({
      legs: [
        ...data.legs,
        { ...emptyLeg(), departure_city: lastLeg.arrival_city }
      ]
    })
  }

  function removeLeg(index: number) {
    update({ legs: data.legs.filter((_, i) => i !== index) })
  }

 const emptyLeg = (): FlightLeg => ({
  airline:         '',
  flight_number:   '',
  departure_city:  '',
  arrival_city:    '',
  departure_time:  '',
  arrival_time:    '',
  terminal:        '',
  pnr:             '',
  layover_minutes: '',
  seat_number:     '',   // ADD THIS
})
  const isValid = (() => {
    
    if (data.journey_type === 'return') {
      return data.outbound.airline && data.outbound.departure_city && data.outbound.arrival_city
    }
    if (data.journey_type === 'connecting' || data.journey_type === 'multi_city') {
      return data.legs.every(l => l.airline && l.departure_city && l.arrival_city)
    }
    if (data.journey_type === 'open_jaw') {
      return data.outbound.airline && data.outbound.departure_city &&
             data.outbound.arrival_city && data.return_leg.departure_city
    }
    return true
  })()

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900">Flight details</h2>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {data.journey_type.replace('_', ' ')} ticket
            </p>
          </div>

          {/* Seat info */}
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select value={data.seat_class}
                onChange={e => update({ seat_class: e.target.value })}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Seat no.</label>
              <input value={data.seat_number}
                onChange={e => update({ seat_number: e.target.value.toUpperCase() })}
                placeholder="e.g. 24A"
                className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Baggage</label>
              <select value={data.baggage_kg}
                onChange={e => update({ baggage_kg: e.target.value })}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[7,10,15,20,23,25,30,32].map(k => (
                  <option key={k} value={k}>{k}kg</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ONE WAY */}
       {data.journey_type === 'one_way' && (
  <LegForm leg={data.outbound} label="✈ Outbound flight"
    showSeatNo={false} onChange={updateOutbound} />
)}

        {/* Return */}
{data.journey_type === 'return' && (
  <div className="space-y-3">
    <LegForm leg={data.outbound} label="✈ Outbound flight"
      showSeatNo={true} onChange={updateOutbound} />
    <LegForm leg={data.return_leg} label="↩ Return flight" color="green"
      showSeatNo={true} onChange={updateReturn} />
  </div>
)}

{/* Open jaw */}
{data.journey_type === 'open_jaw' && (
  <div className="space-y-3">
    <LegForm leg={data.outbound} label="✈ Outbound flight"
      showSeatNo={true} onChange={updateOutbound} />
    <LegForm leg={data.return_leg} label="↩ Return (different city)" color="green"
      showSeatNo={true} onChange={updateReturn} />
  </div>
)}
        {/* CONNECTING or MULTI-CITY */}
        {(data.journey_type === 'connecting' || data.journey_type === 'multi_city') && (
  <div className="space-y-2">
    {data.legs.map((leg, i) => (
      <div key={i}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-gray-500">
            {data.journey_type === 'connecting'
              ? `Leg ${i+1} of ${data.legs.length}`
              : `Flight ${i+1}`
            }
          </p>
          {data.legs.length > 1 && (
            <button onClick={() => removeLeg(i)}
              className="text-xs text-red-400 hover:text-red-600">
              Remove
            </button>
          )}
        </div>
        <LegForm
          leg={leg}
          label=""
          showSeatNo={true}   
          onChange={(field, value) => updateLeg(i, field, value)}
        />
                {/* Layover badge */}
                {i < data.legs.length - 1 && (() => {
                  const layover = calcLayover(data.legs[i], data.legs[i+1])
                  return (
                    <div className="flex items-center gap-2 py-1.5">
                      <div className="flex-1 border-t border-dashed border-yellow-200" />
                      <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full">
                        <Clock size={11} />
                        {layover
                          ? `Layover: ${layover} in ${data.legs[i].arrival_city || 'transit'}`
                          : `Layover in ${data.legs[i].arrival_city || 'transit'}`
                        }
                      </div>
                      <div className="flex-1 border-t border-dashed border-yellow-200" />
                    </div>
                  )
                })()}
              </div>
            ))}
            <button onClick={addLeg}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition">
              <Plus size={15} />
              Add {data.journey_type === 'connecting' ? 'connecting leg' : 'city'}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm">
          ← Back
        </button>
        <button onClick={onNext} disabled={!isValid}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          Next → Passenger details
        </button>
      </div>
    </div>
  )
}