'use client'

import { Plus, Trash2, Plane, Clock } from 'lucide-react'

export type LegInput = {
  airline:         string
  flight_number:   string
  departure_city:  string
  arrival_city:    string
  departure_time:  string
  arrival_time:    string
  terminal:        string
  layover_minutes: string
}

export const emptyLeg = (): LegInput => ({
  airline:         '',
  flight_number:   '',
  departure_city:  '',
  arrival_city:    '',
  departure_time:  '',
  arrival_time:    '',
  terminal:        '',
  layover_minutes: '',
})

function formatLayover(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

type Props = {
  legs:           LegInput[]
  setLegs:        React.Dispatch<React.SetStateAction<LegInput[]>>
  defaultAirline?: string
  routeFrom?:     string
  routeTo?:       string
}

export default function FlightLegsEditor({
  legs, setLegs, defaultAirline, routeFrom, routeTo
}: Props) {

  function updateLeg(index: number, field: keyof LegInput, value: string) {
    setLegs(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addLeg() {
    const lastLeg = legs[legs.length - 1]
    setLegs(prev => [
      ...prev,
      {
        ...emptyLeg(),
        airline:        defaultAirline ?? '',
        // Auto-continue from previous leg's arrival city
        departure_city: lastLeg?.arrival_city ?? '',
      }
    ])
  }

  function removeLeg(index: number) {
    if (legs.length === 1) return
    setLegs(prev => prev.filter((_, i) => i !== index))
  }

  // Calculate layover automatically when times change
  function calcLayover(index: number) {
    const current = legs[index]
    const next    = legs[index + 1]
    if (!current?.arrival_time || !next?.departure_time) return null

    const arr = new Date(current.arrival_time).getTime()
    const dep = new Date(next.departure_time).getTime()
    const diffMinutes = Math.round((dep - arr) / 60000)
    return diffMinutes > 0 ? diffMinutes : null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane size={15} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm">
            Flight itinerary
          </h3>
          {legs.length > 1 && (
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              {legs.length} legs — connecting flight
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={addLeg}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
        >
          <Plus size={13} /> Add stopover leg
        </button>
      </div>

      <div className="space-y-3">
        {legs.map((leg, i) => {
          const autoLayover = calcLayover(i)
          const isLast = i === legs.length - 1

          return (
            <div key={i}>
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    {legs.length > 1 ? `Leg ${i + 1}` : 'Flight'}
                    {i === 0 && legs.length > 1 && ' (Outbound)'}
                    {isLast && legs.length > 1 && i > 0 && ' (Final)'}
                  </span>
                  {legs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLeg(i)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Airline
                    </label>
                    <input
                      value={leg.airline}
                      onChange={e => updateLeg(i, 'airline', e.target.value)}
                      placeholder="e.g. PIA"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Flight number
                    </label>
                    <input
                      value={leg.flight_number}
                      onChange={e => updateLeg(i, 'flight_number', e.target.value.toUpperCase())}
                      placeholder="e.g. PK-301"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Departure city
                    </label>
                    <input
                      value={leg.departure_city}
                      onChange={e => updateLeg(i, 'departure_city', e.target.value)}
                      placeholder="e.g. Karachi (KHI)"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Arrival city
                    </label>
                    <input
                      value={leg.arrival_city}
                      onChange={e => updateLeg(i, 'arrival_city', e.target.value)}
                      placeholder="e.g. Dubai (DXB)"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Departure time
                    </label>
                    <input
                      type="datetime-local"
                      value={leg.departure_time}
                      onChange={e => updateLeg(i, 'departure_time', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Arrival time
                    </label>
                    <input
                      type="datetime-local"
                      value={leg.arrival_time}
                      onChange={e => updateLeg(i, 'arrival_time', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Terminal
                    </label>
                    <input
                      value={leg.terminal}
                      onChange={e => updateLeg(i, 'terminal', e.target.value)}
                      placeholder="e.g. Terminal 1"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Layover indicator between legs */}
              {!isLast && (
                <div className="flex items-center gap-2 my-2 px-4">
                  <div className="flex-1 border-t border-dashed border-yellow-300" />
                  <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    <Clock size={11} />
                    {autoLayover !== null
                      ? `Layover: ${formatLayover(autoLayover)} in ${legs[i].arrival_city || 'transit'}`
                      : `Layover in ${legs[i].arrival_city || 'transit'} — set times to calculate`
                    }
                  </div>
                  <div className="flex-1 border-t border-dashed border-yellow-300" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Journey summary */}
      {legs.length > 1 && legs[0].departure_city && legs[legs.length - 1].arrival_city && (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
          <p className="text-blue-900 font-medium">
            ✈ Full journey: {legs[0].departure_city} → {legs[legs.length - 1].arrival_city}
          </p>
          <p className="text-blue-600 text-xs mt-1">
            Via {legs.slice(0, -1).map(l => l.arrival_city).filter(Boolean).join(', ')} •{' '}
            {legs.length} flight{legs.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}