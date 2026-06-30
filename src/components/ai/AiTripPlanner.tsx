'use client'

import { useState } from 'react'
import { Sparkles, Globe, Calendar, Users, Wallet,
         MapPin, Plane, Hotel, Download, Copy,
         Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import ItineraryResult from './ItineraryResult'

const DESTINATIONS = [
  'Dubai, UAE', 'Istanbul, Turkey', 'Kuala Lumpur, Malaysia',
  'Bangkok, Thailand', 'Baku, Azerbaijan', 'London, UK',
  'Paris, France', 'Maldives', 'Cairo, Egypt', 'Riyadh, Saudi Arabia',
  'Rome, Italy', 'Barcelona, Spain', 'Singapore', 'Tokyo, Japan',
  'New York, USA', 'Toronto, Canada', 'Sydney, Australia',
]

const DEPARTURE_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad'
]

export default function AiTripPlanner() {
  const [language,        setLanguage]        = useState<'en' | 'ur'>('en')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [itinerary,       setItinerary]       = useState<any>(null)
  const [activeDay,       setActiveDay]       = useState(1)

  const [form, setForm] = useState({
    destination:     '',
    customDest:      '',
    days:            '7',
    travelers:       '2',
    budget:          '',
    travelStyle:     'family',
    departureCity:   'Karachi',
    tripType:        'leisure',
    specialRequests: '',
    includeHotels:   true,
    includeFlights:  true,
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    const dest = form.destination === 'custom' ? form.customDest : form.destination
    if (!dest) { setError('Please select or enter a destination'); return }

    setLoading(true)
    setError(null)
    setItinerary(null)

    const res = await fetch('/api/ai/trip-planner', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        destination:     dest,
        days:            parseInt(form.days),
        travelers:       parseInt(form.travelers),
        budget:          form.budget || null,
        travelStyle:     form.travelStyle,
        departureCity:   form.departureCity,
        tripType:        form.tripType,
        specialRequests: form.specialRequests || null,
        includeHotels:   form.includeHotels,
        includeFlights:  form.includeFlights,
        language,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    setItinerary(data.itinerary)
    setActiveDay(1)
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AI Trip Planner</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Generate complete day-by-day itineraries instantly with AI
          </p>
        </div>

        {/* Language toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              language === 'en'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ur')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              language === 'ur'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            اردو
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleGenerate} className="space-y-4">

            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Globe size={16} className="text-purple-600" />
                {language === 'ur' ? 'سفر کی تفصیلات' : 'Trip details'}
              </h2>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ur' ? 'منزل' : 'Destination'}
                </label>
                <select
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">
                    {language === 'ur' ? 'منزل چنیں...' : 'Select destination...'}
                  </option>
                  {DESTINATIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="custom">
                    {language === 'ur' ? '✏️ اپنی منزل لکھیں' : '✏️ Type custom destination'}
                  </option>
                </select>
                {form.destination === 'custom' && (
                  <input
                    name="customDest"
                    value={form.customDest}
                    onChange={handleChange}
                    placeholder={language === 'ur' ? 'منزل کا نام لکھیں...' : 'Enter destination...'}
                    className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>

              {/* Days + Travelers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={13} className="inline mr-1" />
                    {language === 'ur' ? 'دن' : 'Days'}
                  </label>
                  <input
                    name="days"
                    type="number"
                    min="1"
                    max="30"
                    value={form.days}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Users size={13} className="inline mr-1" />
                    {language === 'ur' ? 'مسافر' : 'Travelers'}
                  </label>
                  <input
                    name="travelers"
                    type="number"
                    min="1"
                    max="50"
                    value={form.travelers}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Wallet size={13} className="inline mr-1" />
                  {language === 'ur' ? 'بجٹ (PKR)' : 'Budget (PKR)'}
                </label>
                <input
                  name="budget"
                  type="number"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder={language === 'ur' ? 'مثال: 300000' : 'e.g. 300000'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Departure city */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={13} className="inline mr-1" />
                  {language === 'ur' ? 'روانگی کا شہر' : 'Departure city'}
                </label>
                <select
                  name="departureCity"
                  value={form.departureCity}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {DEPARTURE_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Trip type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ur' ? 'سفر کی قسم' : 'Trip type'}
                </label>
                <select
                  name="tripType"
                  value={form.tripType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="leisure">{language === 'ur' ? '🏖️ سیاحت' : '🏖️ Leisure'}</option>
                  <option value="umrah">{language === 'ur' ? '🕋 عمرہ' : '🕋 Umrah'}</option>
                  <option value="honeymoon">{language === 'ur' ? '💑 ہنی مون' : '💑 Honeymoon'}</option>
                  <option value="business">{language === 'ur' ? '💼 کاروبار' : '💼 Business'}</option>
                  <option value="family">{language === 'ur' ? '👨‍👩‍👧‍👦 خاندانی' : '👨‍👩‍👧‍👦 Family'}</option>
                  <option value="adventure">{language === 'ur' ? '🏔️ ایڈونچر' : '🏔️ Adventure'}</option>
                  <option value="educational">{language === 'ur' ? '📚 تعلیمی' : '📚 Educational'}</option>
                </select>
              </div>

              {/* Travel style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ur' ? 'سفر کا انداز' : 'Travel style'}
                </label>
                <select
                  name="travelStyle"
                  value={form.travelStyle}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="budget">{language === 'ur' ? '💰 کم خرچ' : '💰 Budget'}</option>
                  <option value="moderate">{language === 'ur' ? '👌 معتدل' : '👌 Moderate'}</option>
                  <option value="luxury">{language === 'ur' ? '✨ پُرتعیش' : '✨ Luxury'}</option>
                  <option value="family">{language === 'ur' ? '👪 خاندانی' : '👪 Family-friendly'}</option>
                  <option value="halal">{language === 'ur' ? '☪️ حلال' : '☪️ Halal-focused'}</option>
                </select>
              </div>

              {/* Special requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ur' ? 'خصوصی درخواستیں' : 'Special requests'}
                </label>
                <textarea
                  name="specialRequests"
                  value={form.specialRequests}
                  onChange={handleChange}
                  rows={2}
                  placeholder={
                    language === 'ur'
                      ? 'مثال: وہیل چیئر کی سہولت، حلال کھانا...'
                      : 'e.g. wheelchair access, halal food only, no alcohol venues...'
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    name="includeFlights"
                    checked={form.includeFlights}
                    onChange={handleChange}
                    className="rounded accent-purple-600"
                  />
                  <Plane size={13} />
                  {language === 'ur' ? 'پروازیں' : 'Flights'}
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    name="includeHotels"
                    checked={form.includeHotels}
                    onChange={handleChange}
                    className="rounded accent-purple-600"
                  />
                  <Hotel size={13} />
                  {language === 'ur' ? 'ہوٹل' : 'Hotels'}
                </label>
              </div>
            </div>

            {/* Generate button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: loading
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #7c3aed, #2563eb)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  {language === 'ur' ? 'منصوبہ بن رہا ہے...' : 'Generating itinerary...'}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {language === 'ur' ? 'AI سے منصوبہ بنائیں' : 'Generate with AI'}
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Right — Result */}
        <div className="lg:col-span-2">
          {!itinerary && !loading && (
            <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-100 border-dashed min-h-96">
              <div className="text-center px-8">
                <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={36} className="text-purple-500" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {language === 'ur' ? 'AI سفری منصوبہ ساز' : 'AI Trip Planner'}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {language === 'ur'
                    ? 'بائیں طرف تفصیلات بھریں اور AI آپ کے لیے مکمل روزانہ کا منصوبہ بنائے گا'
                    : 'Fill in the details on the left and AI will generate a complete day-by-day itinerary with hotels, activities, costs, and tips'}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-gray-500">
                  {[
                    { icon: '📅', text: language === 'ur' ? 'روز مرہ کا منصوبہ'     : 'Day-by-day plan'     },
                    { icon: '🏨', text: language === 'ur' ? 'ہوٹل کی سفارشات'     : 'Hotel suggestions'  },
                    { icon: '💰', text: language === 'ur' ? 'خرچے کا تخمینہ'       : 'Cost estimates'     },
                    { icon: '✈️', text: language === 'ur' ? 'پرواز کی معلومات'     : 'Flight information' },
                    { icon: '🛂', text: language === 'ur' ? 'ویزا کی معلومات'      : 'Visa information'   },
                    { icon: '💡', text: language === 'ur' ? 'مفید مشورے'           : 'Pro travel tips'    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-100 min-h-96">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                  <Sparkles size={28} className="text-white animate-pulse" />
                </div>
                <p className="font-semibold text-gray-900 mb-2">
                  {language === 'ur' ? 'AI منصوبہ بنا رہا ہے...' : 'AI is crafting your itinerary...'}
                </p>
                <p className="text-gray-500 text-sm">
                  {language === 'ur' ? 'براہ کرم انتظار کریں' : 'This takes about 15-20 seconds'}
                </p>
                <div className="flex justify-center gap-1 mt-4">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {itinerary && !loading && (
            <ItineraryResult
              itinerary={itinerary}
              language={language}
              activeDay={activeDay}
              setActiveDay={setActiveDay}
              booking={null}
            />
          )}
        </div>
      </div>
    </div>
  )
}