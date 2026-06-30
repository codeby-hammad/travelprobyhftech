'use client'

import { useState } from 'react'
import { Zap, Plane } from 'lucide-react'
import JourneyTypeStep   from './JourneyTypeStep'
import FlightDetailsStep from './FlightDetailsStep'
import PassengerStep     from './PassengerStep'
import PricingStep       from './PricingStep'
import ConfirmStep       from './ConfirmStep'
import SaleSuccess       from './SaleSuccess'

export type JourneyType = 'one_way' | 'return' | 'connecting' | 'open_jaw' | 'multi_city'
export type AgeCategory = 'adult' | 'child' | 'infant'

export type FlightLeg = {
  airline:         string
  flight_number:   string
  departure_city:  string
  arrival_city:    string
  departure_time:  string
  arrival_time:    string
  terminal:        string
  pnr:             string
  layover_minutes: string
  seat_number:     string
}

export type SaleData = {
  // Step 1 — journey type
  journey_type: JourneyType

  // Step 2 — flight details
  outbound:  FlightLeg
  return_leg: FlightLeg
  legs:      FlightLeg[]   // for connecting/multi-city
  seat_class:   string
  seat_number:  string
  baggage_kg:   string

  // Step 3 — passenger
  sold_to_type:     string
  client_id:        string
  sub_agent_id:     string
  buyer_name:       string
  buyer_phone:      string
  buyer_passport:   string
  buyer_nationality:string
  buyer_dob:        string
  buyer_gender:     string
  age_category:     AgeCategory

  // Step 4 — pricing
  cost_price:     string
  sold_price:     string
  currency:       string
  payment_method: string
  payment_status: string
  sale_date:      string
  notes:          string
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
  seat_number:     '',  
})

const initialData: SaleData = {
  journey_type:      'one_way',
  outbound:          emptyLeg(),
  return_leg:        emptyLeg(),
  legs:              [emptyLeg()],
  seat_class:        'economy',
  seat_number:       '',
  baggage_kg:        '23',
  sold_to_type:      'customer',
  client_id:         '',
  sub_agent_id:      '',
  buyer_name:        '',
  buyer_phone:       '',
  buyer_passport:    '',
  buyer_nationality: 'Pakistani',
  buyer_dob:         '',
  buyer_gender:      'male',
  age_category:      'adult',
  cost_price:        '',
  sold_price:        '',
  currency:          'PKR',
  payment_method:    'cash',
  payment_status:    'received',
  sale_date:         new Date().toISOString().split('T')[0],
  notes:             '',
}

type Props = {
  organizationId: string
  organization:   any
  clients:        any[]
  subAgents:      any[]
}

const STEPS = [
  { n: 1, label: 'Journey type' },
  { n: 2, label: 'Flight details' },
  { n: 3, label: 'Passenger'  },
  { n: 4, label: 'Pricing'    },
  { n: 5, label: 'Confirm'    },
]

export default function SellTicketWizard({
  organizationId, organization, clients, subAgents
}: Props) {
  const [step,       setStep]       = useState(1)
  const [data,       setData]       = useState<SaleData>(initialData)
  const [completedSale, setCompletedSale] = useState<any>(null)

  function update(partial: Partial<SaleData>) {
    setData(prev => ({ ...prev, ...partial }))
  }

  if (completedSale) {
    return (
      <SaleSuccess
        sale={completedSale}
        data={data}
        organization={organization}
        onSellAnother={() => {
          setData(initialData)
          setStep(1)
          setCompletedSale(null)
        }}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap size={22} className="text-green-600" />
          Sell Ticket
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Walk-in customer — GDS/airline website se book karein
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              step === s.n
                ? 'bg-blue-600 text-white'
                : step > s.n
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                step === s.n ? 'bg-white/30 text-white' :
                step > s.n  ? 'bg-green-100 text-green-600' :
                               'bg-gray-200 text-gray-400'
              }`}>
                {step > s.n ? '✓' : s.n}
              </span>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px ${step > s.n ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 1 && (
        <JourneyTypeStep
          data={data}
          update={update}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <FlightDetailsStep
          data={data}
          update={update}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <PassengerStep
          data={data}
          update={update}
          clients={clients}
          subAgents={subAgents}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <PricingStep
          data={data}
          update={update}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <ConfirmStep
          data={data}
          update={update}
          organizationId={organizationId}
          clients={clients}
          subAgents={subAgents}
          onBack={() => setStep(4)}
          onDone={sale => setCompletedSale(sale)}
        />
      )}
    </div>
  )
}