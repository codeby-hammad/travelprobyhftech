'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy, Check, ChevronDown, ChevronUp,
  Plane, Hotel, MapPin, Clock, Wallet,
  Star, Info, Package, Download, Plus
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import SaveItineraryModal from './SaveItineraryModal'

type Props = {
  itinerary:    any
  language:     'en' | 'ur'
  activeDay:    number
  setActiveDay: (d: number) => void
  booking:      any
}

export default function ItineraryResult({
  itinerary,
  language,
  activeDay,
  setActiveDay,
  booking,
}: Props) {
  const [copied,     setCopied]     = useState(false)
  const [showSave,   setShowSave]   = useState(false)
  const [expandAll,  setExpandAll]  = useState(false)

  const isUrdu = language === 'ur'

  async function copyItinerary() {
    const text = buildPlainText(itinerary, isUrdu)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const currentDay = itinerary.days?.find((d: any) => d.day === activeDay)

  return (
    <div className="space-y-4" dir={isUrdu ? 'rtl' : 'ltr'}>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6"
        style={{ background: 'linear-gradient(135deg, #f5f3ff, #eff6ff)' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {itinerary.title}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {itinerary.summary}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={copyItinerary}
              className="flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied
                ? (isUrdu ? 'کاپی ہوگیا' : 'Copied!')
                : (isUrdu ? 'کاپی'       : 'Copy')
              }
            </button>
            <button
              onClick={() => setShowSave(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
            >
              <Plus size={14} />
              {isUrdu ? 'بکنگ بنائیں' : 'Create booking'}
            </button>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            {
              icon:  MapPin,
              label: isUrdu ? 'منزل'       : 'Destination',
              value: itinerary.destination,
              color: 'text-purple-600',
            },
            {
              icon:  Clock,
              label: isUrdu ? 'مدت'        : 'Duration',
              value: `${itinerary.duration} ${isUrdu ? 'دن' : 'days'}`,
              color: 'text-blue-600',
            },
            {
              icon:  Wallet,
              label: isUrdu ? 'بجٹ کا تخمینہ' : 'Est. budget',
              value: `${formatCurrency(itinerary.totalBudgetMin)} – ${formatCurrency(itinerary.totalBudgetMax)}`,
              color: 'text-green-600',
            },
            {
              icon:  Info,
              label: isUrdu ? 'بہترین وقت'  : 'Best time',
              value: itinerary.bestTime ?? '—',
              color: 'text-orange-600',
            },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-3 border border-white/50">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon size={13} className={stat.color} />
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="text-xs font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Flight info */}
      {itinerary.flightInfo && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plane size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">
              {isUrdu ? 'پرواز کی معلومات' : 'Flight information'}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              { label: isUrdu ? 'ایئرلائن'   : 'Airline',    value: itinerary.flightInfo.airline   },
              { label: isUrdu ? 'پرواز کا وقت' : 'Duration', value: itinerary.flightInfo.duration  },
              { label: isUrdu ? 'تخمینی خرچ' : 'Est. cost',  value: formatCurrency(itinerary.flightInfo.estimatedCost) },
              { label: isUrdu ? 'نوٹس'        : 'Notes',     value: itinerary.flightInfo.notes     },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                <p className="font-medium text-gray-800 text-xs">{item.value ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day tabs */}
      {itinerary.days?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Day selector */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                {isUrdu ? 'روزانہ کا منصوبہ' : 'Daily itinerary'}
              </h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {itinerary.days.map((d: any) => (
                <button
                  key={d.day}
                  onClick={() => setActiveDay(d.day)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${
                    activeDay === d.day
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={activeDay === d.day
                    ? { background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }
                    : {}
                  }
                >
                  {isUrdu ? `دن ${d.day}` : `Day ${d.day}`}
                </button>
              ))}
            </div>
          </div>

          {/* Active day content */}
          {currentDay && (
            <div className="p-5">
              <div className="mb-4">
                <h4 className="font-bold text-gray-900 text-base">{currentDay.title}</h4>
                <p className="text-gray-500 text-sm mt-1">{currentDay.description}</p>
                {currentDay.estimatedDayCost > 0 && (
                  <span className="inline-block mt-2 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {isUrdu ? 'دن کا خرچ: ' : 'Day cost: '}
                    {formatCurrency(currentDay.estimatedDayCost)}
                  </span>
                )}
              </div>

              {/* Activities */}
              {currentDay.activities?.length > 0 && (
                <div className="space-y-3 mb-5">
                  {currentDay.activities.map((act: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-shrink-0">
                        <div className="w-14 text-center">
                          <span className="text-xs font-mono text-purple-600 font-semibold">
                            {act.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{act.activity}</p>
                        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                          {act.description}
                        </p>
                        {act.tips && (
                          <p className="text-purple-600 text-xs mt-1">
                            💡 {act.tips}
                          </p>
                        )}
                        {act.cost > 0 && (
                          <span className="inline-block mt-1 text-xs text-green-600 font-medium">
                            {formatCurrency(act.cost)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hotel for this day */}
                {currentDay.hotel && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Hotel size={14} className="text-orange-600" />
                      <span className="text-xs font-semibold text-orange-800">
                        {isUrdu ? 'آج کا ہوٹل' : "Tonight's hotel"}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {currentDay.hotel.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currentDay.hotel.area}
                      {currentDay.hotel.stars && (
                        <span className="ml-2">{'⭐'.repeat(currentDay.hotel.stars)}</span>
                      )}
                    </p>
                    {currentDay.hotel.estimatedCost > 0 && (
                      <p className="text-xs text-orange-600 font-medium mt-1">
                        {formatCurrency(currentDay.hotel.estimatedCost)} / {isUrdu ? 'رات' : 'night'}
                      </p>
                    )}
                    {currentDay.hotel.distanceHaram && (
                      <p className="text-xs text-green-600 mt-1">
                        🕋 {currentDay.hotel.distanceHaram}
                      </p>
                    )}
                  </div>
                )}

                {/* Meals */}
                {currentDay.meals && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🍽️</span>
                      <span className="text-xs font-semibold text-blue-800">
                        {isUrdu ? 'کھانے کی سفارشات' : 'Meal suggestions'}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { key: 'breakfast', icon: '☀️', label: isUrdu ? 'ناشتہ'          : 'Breakfast' },
                        { key: 'lunch',     icon: '🌤️', label: isUrdu ? 'دوپہر کا کھانا' : 'Lunch'     },
                        { key: 'dinner',    icon: '🌙', label: isUrdu ? 'رات کا کھانا'   : 'Dinner'    },
                      ].map(meal => currentDay.meals[meal.key] && (
                        <div key={meal.key} className="flex items-start gap-2">
                          <span className="text-xs mt-0.5">{meal.icon}</span>
                          <div>
                            <span className="text-xs text-blue-600 font-medium">{meal.label}: </span>
                            <span className="text-xs text-gray-600">{currentDay.meals[meal.key]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hotels summary */}
      {itinerary.hotels?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Hotel size={16} className="text-orange-600" />
            <h3 className="font-semibold text-gray-900 text-sm">
              {isUrdu ? 'ہوٹلوں کا خلاصہ' : 'Hotels summary'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {itinerary.hotels.map((h: any, i: number) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{h.name}</p>
                    <p className="text-xs text-gray-500">{h.city}</p>
                  </div>
                  {h.stars && (
                    <div className="flex">
                      {Array.from({ length: h.stars }).map((_, j) => (
                        <Star key={j} size={10} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {h.nights} {isUrdu ? 'راتیں' : 'nights'}
                  </span>
                  <span className="text-orange-600 font-medium">
                    {formatCurrency(h.estimatedCostPerNight)}/{isUrdu ? 'رات' : 'night'}
                  </span>
                </div>
                {h.highlights && (
                  <p className="text-xs text-gray-400 mt-1">{h.highlights}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom info — visa, includes, packing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Visa info */}
        {itinerary.visaInfo && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span>🛂</span>
              <h3 className="font-semibold text-gray-900 text-sm">
                {isUrdu ? 'ویزا کی معلومات' : 'Visa info'}
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-gray-400">{isUrdu ? 'ویزا کی قسم' : 'Type'}</p>
                <p className="font-medium text-gray-800">{itinerary.visaInfo.type}</p>
              </div>
              <div>
                <p className="text-gray-400">{isUrdu ? 'پروسیسنگ کا وقت' : 'Processing'}</p>
                <p className="font-medium text-gray-800">{itinerary.visaInfo.processingTime}</p>
              </div>
              {itinerary.visaInfo.estimatedFee > 0 && (
                <div>
                  <p className="text-gray-400">{isUrdu ? 'فیس' : 'Fee'}</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(itinerary.visaInfo.estimatedFee)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Included services */}
        {itinerary.includedServices?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span>✅</span>
              <h3 className="font-semibold text-gray-900 text-sm">
                {isUrdu ? 'شامل خدمات' : 'Included'}
              </h3>
            </div>
            <div className="space-y-1.5">
              {itinerary.includedServices.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <span className="text-xs text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packing list */}
        {itinerary.packingList?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span>🎒</span>
              <h3 className="font-semibold text-gray-900 text-sm">
                {isUrdu ? 'ضروری سامان' : 'Packing list'}
              </h3>
            </div>
            <div className="space-y-1.5">
              {itinerary.packingList.slice(0, 8).map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 text-xs mt-0.5">•</span>
                  <span className="text-xs text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Important notes */}
      {itinerary.importantNotes?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>⚠️</span>
            <h3 className="font-semibold text-yellow-800 text-sm">
              {isUrdu ? 'اہم ہدایات' : 'Important notes'}
            </h3>
          </div>
          <div className="space-y-1.5">
            {itinerary.importantNotes.map((note: string, i: number) => (
              <p key={i} className="text-xs text-yellow-700">• {note}</p>
            ))}
          </div>
        </div>
      )}

      {/* Save modal */}
      {showSave && (
        <SaveItineraryModal
          itinerary={itinerary}
          onClose={() => setShowSave(false)}
        />
      )}
    </div>
  )
}

// Build plain text version for copy/WhatsApp
function buildPlainText(itinerary: any, isUrdu: boolean): string {
  const lines: string[] = []

  lines.push(`✈️ ${itinerary.title}`)
  lines.push('─'.repeat(40))
  lines.push(itinerary.summary)
  lines.push('')
  lines.push(`📍 ${isUrdu ? 'منزل' : 'Destination'}: ${itinerary.destination}`)
  lines.push(`📅 ${isUrdu ? 'مدت' : 'Duration'}: ${itinerary.duration} ${isUrdu ? 'دن' : 'days'}`)
  lines.push(`💰 ${isUrdu ? 'بجٹ' : 'Budget'}: PKR ${itinerary.totalBudgetMin?.toLocaleString()} – PKR ${itinerary.totalBudgetMax?.toLocaleString()}`)
  lines.push('')

  itinerary.days?.forEach((day: any) => {
    lines.push(`${isUrdu ? '📅 دن' : '📅 Day'} ${day.day}: ${day.title}`)
    lines.push(day.description)
    day.activities?.forEach((act: any) => {
      lines.push(`  ${act.time} - ${act.activity}`)
      if (act.tips) lines.push(`  💡 ${act.tips}`)
    })
    if (day.hotel) lines.push(`  🏨 ${day.hotel.name}`)
    lines.push('')
  })

  return lines.join('\n')
}