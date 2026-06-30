'use client'

import type { SaleData, JourneyType } from './SellTicketWizard'

const JOURNEY_TYPES: {
  value:  JourneyType
  icon:   string
  label:  string
  urdu:   string
  desc:   string
  color:  string
}[] = [
  {
    value: 'one_way',
    icon:  '→',
    label: 'One Way',
    urdu:  'ایک طرفہ',
    desc:  'Single flight, one destination',
    color: 'blue',
  },
  {
    value: 'return',
    icon:  '⇄',
    label: 'Return',
    urdu:  'واپسی',
    desc:  'Go and come back — same or different airline',
    color: 'green',
  },
  {
    value: 'connecting',
    icon:  '→→',
    label: 'Connecting',
    urdu:  'کنیکٹنگ',
    desc:  'One journey, stopover at middle airport',
    color: 'purple',
  },
  {
    value: 'open_jaw',
    icon:  '⤡',
    label: 'Open Jaw',
    urdu:  'اوپن جاء',
    desc:  'Fly to one city, return from different city',
    color: 'orange',
  },
  {
    value: 'multi_city',
    icon:  '→→→',
    label: 'Multi-city',
    urdu:  'کئی شہر',
    desc:  'Visit multiple cities on one ticket',
    color: 'red',
  },
]

const colorMap: Record<string, string> = {
  blue:   'border-blue-300   bg-blue-50   text-blue-900',
  green:  'border-green-300  bg-green-50  text-green-900',
  purple: 'border-purple-300 bg-purple-50 text-purple-900',
  orange: 'border-orange-300 bg-orange-50 text-orange-900',
  red:    'border-red-300    bg-red-50    text-red-900',
}

type Props = {
  data:   SaleData
  update: (p: Partial<SaleData>) => void
  onNext: () => void
}

export default function JourneyTypeStep({ data, update, onNext }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="font-bold text-gray-900 mb-1">Journey type</h2>
      <p className="text-gray-500 text-sm mb-5">
        Yeh ticket kaisa safar hai?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {JOURNEY_TYPES.map(jt => (
          <button
            key={jt.value}
            onClick={() => update({ journey_type: jt.value })}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${
              data.journey_type === jt.value
                ? colorMap[jt.color]
                : 'border-gray-100 hover:border-gray-200 bg-white'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shrink-0 ${
              data.journey_type === jt.value
                ? 'bg-white/60'
                : 'bg-gray-50 text-gray-600'
            }`}>
              {jt.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm">{jt.label}</p>
                <p className="text-xs opacity-60" dir="rtl">{jt.urdu}</p>
              </div>
              <p className="text-xs opacity-70 mt-0.5">{jt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
      >
        Next → Flight details
      </button>
    </div>
  )
}