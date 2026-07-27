'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Upload, X } from 'lucide-react'
import AirlineLogo from '@/components/shared/AirlineLogo'
import HotelPicker from '@/components/hotels/HotelPicker'

type Props = { pkg: any }

export default function PackageEditForm({ pkg }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  // Package hero image — same upload pattern as the agency logo in
  // OrganizationForm.tsx (select -> preview -> upload on submit)
  const [imageUrl, setImageUrl]         = useState<string | null>(pkg.image_url ?? null)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Package image must be an image file.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Package image must be under 4MB.')
      return
    }

    setError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImageSelection() {
    setImageFile(null)
    setImagePreview(null)
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return imageUrl

    setUploadingImage(true)
    try {
      const ext  = imageFile.name.split('.').pop()
      // Cache-bust with a timestamp, same reasoning as the logo upload —
      // otherwise the old image can keep showing at the same URL after upsert
      const path = `${pkg.organization_id}/${pkg.id}/image-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('package-images')
        .upload(path, imageFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('package-images').getPublicUrl(path)
      return data.publicUrl
    } finally {
      setUploadingImage(false)
    }
  }

  const [form, setForm] = useState({
    name:               pkg.name               ?? '',
    destination:        pkg.destination        ?? '',
    departure_city:     pkg.departure_city     ?? '',
    duration_days:      pkg.duration_days      ?? '',
    base_price:         pkg.base_price         ?? '',
    currency:           pkg.currency           ?? 'PKR',
    description:        pkg.description        ?? '',
    includes:           pkg.includes           ?? '',
    excludes:           pkg.excludes           ?? '',
    package_type:       pkg.package_type       ?? '',
    airline:            pkg.airline            ?? '',
    makkah_hotel:       pkg.makkah_hotel       ?? '',
    madinah_hotel:      pkg.madinah_hotel      ?? '',
    makkah_nights:      pkg.makkah_nights      ?? '',
    madinah_nights:     pkg.madinah_nights     ?? '',
    includes_flight:    pkg.includes_flight    ?? false,
    includes_hotel:     pkg.includes_hotel     ?? false,
    includes_visa:      pkg.includes_visa      ?? false,
    visa_included:      pkg.visa_included      ?? false,
    transport_included: pkg.transport_included ?? false,
    is_active:          pkg.is_active          ?? true,
    is_featured:        pkg.is_featured        ?? false,
    // Flight leg
    route_code:             pkg.route_code             ?? '',
    departure_city_code:    pkg.departure_city_code    ?? '',
    destination_code:       pkg.destination_code       ?? '',
    airline_iata_code:      pkg.airline_iata_code      ?? '',
    flight_number_out:      pkg.flight_number_out      ?? '',
    flight_number_return:   pkg.flight_number_return   ?? '',
    departure_date:         pkg.departure_date         ?? '',
    return_date:            pkg.return_date            ?? '',
    departure_time:         pkg.departure_time         ?? '',
    arrival_time:           pkg.arrival_time           ?? '',
    return_departure_time:  pkg.return_departure_time  ?? '',
    return_arrival_time:    pkg.return_arrival_time    ?? '',
    baggage_out:            pkg.baggage_out            ?? '',
    baggage_return:         pkg.baggage_return         ?? '',
    // Hotel distance
    makkah_hotel_distance:  pkg.makkah_hotel_distance  ?? '',
    madinah_hotel_distance: pkg.madinah_hotel_distance ?? '',
    // Seats + tiered pricing
    total_seats:  pkg.total_seats  ?? '',
    price_quad:   pkg.price_quad   ?? '',
    price_triple: pkg.price_triple ?? '',
    price_double: pkg.price_double ?? '',
  })

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    let finalImageUrl: string | null
    try {
      finalImageUrl = await uploadImageIfNeeded()
    } catch (err: any) {
      setError(err.message ?? 'Image upload failed.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('packages')
      .update({
        image_url:          finalImageUrl,
        name:               form.name,
        destination:        form.destination        || null,
        departure_city:     form.departure_city     || null,
        duration_days:      form.duration_days      ? Number(form.duration_days)  : null,
        base_price:         form.base_price         ? Number(form.base_price)     : null,
        currency:           form.currency,
        description:        form.description        || null,
        includes:           form.includes           || null,
        excludes:           form.excludes           || null,
        package_type:       form.package_type       || null,
        airline:            form.airline            || null,
        makkah_hotel:       form.makkah_hotel       || null,
        madinah_hotel:      form.madinah_hotel      || null,
        makkah_nights:      form.makkah_nights      ? Number(form.makkah_nights)  : null,
        madinah_nights:     form.madinah_nights     ? Number(form.madinah_nights) : null,
        includes_flight:    form.includes_flight,
        includes_hotel:     form.includes_hotel,
        includes_visa:      form.includes_visa,
        visa_included:      form.visa_included,
        transport_included: form.transport_included,
        is_active:          form.is_active,
        is_featured:        form.is_featured,
        // Flight leg
        route_code:             form.route_code             || null,
        departure_city_code:    form.departure_city_code    || null,
        destination_code:       form.destination_code       || null,
        airline_iata_code:      form.airline_iata_code      || null,
        flight_number_out:      form.flight_number_out      || null,
        flight_number_return:   form.flight_number_return   || null,
        departure_date:         form.departure_date         || null,
        return_date:            form.return_date            || null,
        departure_time:         form.departure_time         || null,
        arrival_time:           form.arrival_time           || null,
        return_departure_time:  form.return_departure_time  || null,
        return_arrival_time:    form.return_arrival_time    || null,
        baggage_out:            form.baggage_out            || null,
        baggage_return:         form.baggage_return         || null,
        // Hotel distance
        makkah_hotel_distance:  form.makkah_hotel_distance  || null,
        madinah_hotel_distance: form.madinah_hotel_distance || null,
        // Seats + tiered pricing
        total_seats:  form.total_seats  ? Number(form.total_seats)  : null,
        price_quad:   form.price_quad   ? Number(form.price_quad)   : null,
        price_triple: form.price_triple ? Number(form.price_triple) : null,
        price_double: form.price_double ? Number(form.price_double) : null,
        updated_at:         new Date().toISOString(),
      })
      .eq('id', pkg.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setImageUrl(finalImageUrl)
    setImageFile(null)
    setImagePreview(null)

    router.push('/dashboard/packages')
    router.refresh()
  }

  const inputClass = 'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1.5'

  const isUmrahOrHajj = form.package_type === 'umrah' || form.package_type === 'hajj'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Basic Info</h3>

        {/* Package image */}
        <div>
          <label className={labelClass}>Package image</label>
          <div className="flex items-center gap-4">
            <div className="w-28 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {(imagePreview ?? imageUrl) ? (
                <img src={(imagePreview ?? imageUrl) as string} alt="Package" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-gray-300 text-center px-2">No image yet</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 transition">
                <Upload size={13} />
                {imageUrl || imagePreview ? 'Change image' : 'Upload image'}
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={clearImageSelection}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Used as the package's card image on your public website. Landscape photos work best (e.g. 800×450).
          </p>
        </div>

        <div>
          <label className={labelClass}>Package Name *</label>
          <input
            name="name" value={form.name} onChange={handleChange} required
            placeholder="e.g. Premium 15-Day Umrah"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Package Type</label>
            <select name="package_type" value={form.package_type} onChange={handleChange} className={inputClass}>
              <option value="">Select type...</option>
              <option value="umrah">Umrah</option>
              <option value="hajj">Hajj</option>
              <option value="tour">International Tour</option>
              <option value="ticket">Air Ticket</option>
              <option value="hotel">Hotel</option>
              <option value="visa">Visa</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Destination</label>
            <input
              name="destination" value={form.destination} onChange={handleChange}
              placeholder="e.g. Makkah · Madinah"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Departure City</label>
            <input
              name="departure_city" value={form.departure_city} onChange={handleChange}
              placeholder="e.g. Lahore"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Duration (days)</label>
            <input
              name="duration_days" type="number" value={form.duration_days}
              onChange={handleChange} placeholder="e.g. 15" min="1"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Airline</label>
          <input
            name="airline" value={form.airline} onChange={handleChange}
            placeholder="e.g. PIA, Emirates, Turkish Airlines"
            className={inputClass}
          />
        </div>
      </div>

      {/* Tiered pricing */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Room-sharing pricing (per person)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sharing price (base)</label>
            <input
              name="base_price" type="number" value={form.base_price}
              onChange={handleChange} placeholder="e.g. 263752" min="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select name="currency" value={form.currency} onChange={handleChange} className={inputClass}>
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="SAR">SAR</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Quad price</label>
            <input
              name="price_quad" type="number" value={form.price_quad}
              onChange={handleChange} placeholder="e.g. 269540" min="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Triple price</label>
            <input
              name="price_triple" type="number" value={form.price_triple}
              onChange={handleChange} placeholder="e.g. 277520" min="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Double price</label>
            <input
              name="price_double" type="number" value={form.price_double}
              onChange={handleChange} placeholder="e.g. 293480" min="0"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Total seats available</label>
          <input
            name="total_seats" type="number" value={form.total_seats}
            onChange={handleChange} placeholder="e.g. 40" min="0"
            className={inputClass}
          />
        </div>
      </div>

      {/* Umrah / Hajj Hotel Details */}
      {isUmrahOrHajj && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Hotel Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Makkah Hotel</label>
              <HotelPicker
                city="makkah"
                nameValue={form.makkah_hotel}
                onNameChange={v => setForm(p => ({ ...p, makkah_hotel: v }))}
                onDistanceAutofill={d => setForm(p => ({ ...p, makkah_hotel_distance: d }))}
                namePlaceholder="e.g. Hilton Makkah"
              />
            </div>
            <div>
              <label className={labelClass}>Makkah Nights</label>
              <input
                name="makkah_nights" type="number" value={form.makkah_nights}
                onChange={handleChange} placeholder="e.g. 8" min="0"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Makkah Hotel Distance</label>
            <input
              name="makkah_hotel_distance" value={form.makkah_hotel_distance} onChange={handleChange}
              placeholder="e.g. 450M Haram facing front row"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Madinah Hotel</label>
              <HotelPicker
                city="madinah"
                nameValue={form.madinah_hotel}
                onNameChange={v => setForm(p => ({ ...p, madinah_hotel: v }))}
                onDistanceAutofill={d => setForm(p => ({ ...p, madinah_hotel_distance: d }))}
                namePlaceholder="e.g. Anwar Al Madinah"
              />
            </div>
            <div>
              <label className={labelClass}>Madinah Nights</label>
              <input
                name="madinah_nights" type="number" value={form.madinah_nights}
                onChange={handleChange} placeholder="e.g. 7" min="0"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Madinah Hotel Distance</label>
            <input
              name="madinah_hotel_distance" value={form.madinah_hotel_distance} onChange={handleChange}
              placeholder="e.g. 1200M shuttle Awali side"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Flight leg */}
      {isUmrahOrHajj && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Flight Leg</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Route Code</label>
              <input name="route_code" value={form.route_code} onChange={handleChange}
                placeholder="e.g. MUX-JED-MUX" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Departure Airport Code</label>
              <input name="departure_city_code" value={form.departure_city_code} onChange={handleChange}
                placeholder="e.g. MUX" maxLength={3} className={inputClass + ' uppercase'} />
            </div>
            <div>
              <label className={labelClass}>Destination Airport Code</label>
              <input name="destination_code" value={form.destination_code} onChange={handleChange}
                placeholder="e.g. JED" maxLength={3} className={inputClass + ' uppercase'} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Airline IATA Code</label>
              <input name="airline_iata_code" value={form.airline_iata_code} onChange={handleChange}
                placeholder="e.g. SV" maxLength={3} className={inputClass + ' uppercase'} />
            </div>
            <div>
              <label className={labelClass}>Outbound Flight #</label>
              <input name="flight_number_out" value={form.flight_number_out} onChange={handleChange}
                placeholder="e.g. SV801" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Return Flight #</label>
              <input name="flight_number_return" value={form.flight_number_return} onChange={handleChange}
                placeholder="e.g. SV800" className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AirlineLogo airlineName={form.airline} iataCode={form.airline_iata_code} size={40} />
            <p className="text-[11px] text-gray-400">Logo preview — based on IATA code, or airline name if left blank</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Departure Date</label>
              <input name="departure_date" type="date" value={form.departure_date} onChange={handleChange}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Return Date</label>
              <input name="return_date" type="date" value={form.return_date} onChange={handleChange}
                className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Dep. Time</label>
              <input name="departure_time" value={form.departure_time} onChange={handleChange}
                placeholder="16:45" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Arr. Time</label>
              <input name="arrival_time" value={form.arrival_time} onChange={handleChange}
                placeholder="19:30" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Return Dep.</label>
              <input name="return_departure_time" value={form.return_departure_time} onChange={handleChange}
                placeholder="08:30" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Return Arr.</label>
              <input name="return_arrival_time" value={form.return_arrival_time} onChange={handleChange}
                placeholder="15:05" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Outbound Baggage</label>
              <input name="baggage_out" value={form.baggage_out} onChange={handleChange}
                placeholder="e.g. 1PC X 23 KG | Meal" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Return Baggage</label>
              <input name="baggage_return" value={form.baggage_return} onChange={handleChange}
                placeholder="e.g. 2PC X 23 KG | Meal" className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Description & Inclusions</h3>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description" value={form.description} onChange={handleChange}
            rows={3} placeholder="Package highlights, overview..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Includes</label>
          <textarea
            name="includes" value={form.includes} onChange={handleChange}
            rows={3} placeholder="What's included in this package..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Excludes</label>
          <textarea
            name="excludes" value={form.excludes} onChange={handleChange}
            rows={2} placeholder="What's not included..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Inclusions toggles */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Inclusions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'includes_flight',    label: '✈️ Flight included'    },
            { name: 'includes_hotel',     label: '🏨 Hotel included'     },
            { name: 'includes_visa',      label: '📋 Visa included'      },
            { name: 'visa_included',      label: '🛂 Visa (alt flag)'    },
            { name: 'transport_included', label: '🚌 Transport included' },
          ].map(item => (
            <label key={item.name} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name={item.name}
                checked={form[item.name as keyof typeof form] as boolean}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Visibility</h3>
        <div className="space-y-3">
          {[
            { name: 'is_active',   label: '✅ Active — visible on public website' },
            { name: 'is_featured', label: '⭐ Featured — shown first on website'  },
          ].map(item => (
            <label key={item.name} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name={item.name}
                checked={form[item.name as keyof typeof form] as boolean}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/packages')}
          className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploadingImage}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 transition"
        >
          {(saving || uploadingImage) ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {uploadingImage ? 'Uploading image...' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}