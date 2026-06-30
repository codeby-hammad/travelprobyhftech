'use client'

import type { SaleData, AgeCategory } from './SellTicketWizard'

function getAgeCategory(dob: string): AgeCategory {
  if (!dob) return 'adult'
  const months = (new Date().getFullYear() - new Date(dob).getFullYear()) * 12 +
                 (new Date().getMonth()    - new Date(dob).getMonth())
  if (months < 24)  return 'infant'
  if (months < 144) return 'child'
  return 'adult'
}

type Props = {
  data:      SaleData
  update:    (p: Partial<SaleData>) => void
  clients:   any[]
  subAgents: any[]
  onNext:    () => void
  onBack:    () => void
}

export default function PassengerStep({
  data, update, clients, subAgents, onNext, onBack
}: Props) {

  function fillFromClient(clientId: string) {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    update({
      client_id:         clientId,
      buyer_name:        client.full_name        ?? data.buyer_name,
      buyer_phone:       client.phone            ?? data.buyer_phone,
      buyer_passport:    client.passport_number  ?? data.buyer_passport,
      buyer_nationality: client.nationality      ?? data.buyer_nationality,
      buyer_dob:         client.date_of_birth    ?? data.buyer_dob,
      buyer_gender:      data.buyer_gender,
      age_category:      client.date_of_birth
        ? getAgeCategory(client.date_of_birth)
        : data.age_category,
    })
  }

  const isValid = data.buyer_name.trim().length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <div>
        <h2 className="font-bold text-gray-900">Passenger details</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Passenger ka naam exactly passport ke mutabiq likhein
        </p>
      </div>

      {/* Sell to */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selling to
        </label>
        <div className="flex gap-2">
          {[
            { value: 'customer',  label: '👤 Walk-in customer' },
            { value: 'sub_agent', label: '🤝 Sub-agent'        },
            { value: 'agency',    label: '🏢 Other agency'     },
          ].map(opt => (
            <button key={opt.value} type="button"
              onClick={() => update({ sold_to_type: opt.value })}
              className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium transition ${
                data.sold_to_type === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-100 text-gray-500 hover:border-gray-200'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fill from CRM */}
      {data.sold_to_type === 'customer' && (
        <select value={data.client_id}
          onChange={e => fillFromClient(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Auto-fill from CRM (optional)...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
      )}

      {data.sold_to_type === 'sub_agent' && (
        <select value={data.sub_agent_id}
          onChange={e => update({ sub_agent_id: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select sub-agent...</option>
          {subAgents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      )}

      {/* Age category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Age category
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'adult',  icon: '👨', label: 'Adult',  sub: '12+ years'    },
            { value: 'child',  icon: '👦', label: 'Child',  sub: '2-11 years'   },
            { value: 'infant', icon: '👶', label: 'Infant', sub: '0-23 months'  },
          ] as { value: AgeCategory; icon: string; label: string; sub: string }[]).map(cat => (
            <button key={cat.value} type="button"
              onClick={() => update({ age_category: cat.value })}
              className={`p-3 rounded-xl border-2 text-center transition ${
                data.age_category === cat.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}>
              <p className="text-xl">{cat.icon}</p>
              <p className="text-xs font-semibold text-gray-900 mt-1">{cat.label}</p>
              <p className="text-xs text-gray-400">{cat.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Passenger fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full name (as on passport) <span className="text-red-500">*</span>
          </label>
          <input
            value={data.buyer_name}
            onChange={e => update({ buyer_name: e.target.value.toUpperCase() })}
            placeholder="AHMED KHAN"
            required
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of birth
          </label>
          <input type="date"
            value={data.buyer_dob}
            onChange={e => {
              update({
                buyer_dob:    e.target.value,
                age_category: getAgeCategory(e.target.value),
              })
            }}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {data.buyer_dob && (
            <p className="text-xs text-blue-600 mt-0.5 font-medium">
              Auto: {data.age_category}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select value={data.buyer_gender}
            onChange={e => update({ buyer_gender: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passport number
          </label>
          <input
            value={data.buyer_passport}
            onChange={e => update({ buyer_passport: e.target.value.toUpperCase() })}
            placeholder="AB1234567"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nationality
          </label>
          <input
            value={data.buyer_nationality}
            onChange={e => update({ buyer_nationality: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            value={data.buyer_phone}
            onChange={e => update({ buyer_phone: e.target.value })}
            placeholder="+92 300 1234567"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {data.age_category === 'infant' && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm text-orange-700">
          👶 Infant travels on parent's lap — no seat required. Baggage: 10kg
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm">
          ← Back
        </button>
        <button onClick={onNext} disabled={!isValid}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          Next → Pricing
        </button>
      </div>
    </div>
  )
}