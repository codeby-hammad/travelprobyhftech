'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react'
import { autofillTripDetailsFromPackage } from '@/app/actions/autofillTripDetails'

type Props = {
  clients:  any[]
  packages: any[]
}

const VISA_OPTIONS = [
  { value: 'pending',   label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved',  label: 'Approved' },
  { value: 'rejected',  label: 'Rejected' },
]

const ROOM_TIERS = [
  { value: 'sharing', label: 'Sharing',  priceField: 'base_price'    },
  { value: 'quad',    label: 'Quad',     priceField: 'price_quad'    },
  { value: 'triple',  label: 'Triple',   priceField: 'price_triple'  },
  { value: 'double',  label: 'Double',   priceField: 'price_double'  },
]

function tierPrice(pkg: any, tier: string): number {
  if (!pkg) return 0
  const field = ROOM_TIERS.find(t => t.value === tier)?.priceField ?? 'base_price'
  return Number(pkg[field] ?? pkg.base_price ?? 0)
}

// The tier most passengers picked — used as the single room type stamped
// on the booking's autofilled hotel rows, since hotel_details holds one
// row per city per booking, not one per passenger.
function mostCommonTier(passengers: { room_type: string }[]): string {
  const counts: Record<string, number> = {}
  passengers.forEach(p => { counts[p.room_type] = (counts[p.room_type] ?? 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'quad'
}

export default function NewGroupForm({ clients, packages }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    group_name:      '',
    group_leader_id: '',
    package_id:      '',
    travel_date:     '',
    return_date:     '',
    currency:        'PKR',
    notes:           '',
    group_type:      'custom',   // 'custom' | 'umrah' | 'hajj'
    maktab_number:   '',
  })

  const isUmrah = form.group_type === 'umrah' || form.group_type === 'hajj'
  const selectedPkg = packages.find(p => p.id === form.package_id) ?? null

  const availableTiers = ROOM_TIERS.filter(
    t => selectedPkg && (selectedPkg[t.priceField] ?? (t.value === 'sharing' ? selectedPkg.base_price : null)) != null
  )

  // Passenger list — each has a client_id, room tier, and individual amount
  const [passengers, setPassengers] = useState([
    {
      client_id: '', room_type: 'quad', total_amount: '', paid_amount: '0', notes: '',
      visa_status: 'pending', visa_number: '', room_number: '', bus_number: '',
    }
  ])

function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Auto-fill each passenger's price from the newly selected package's
    // tier pricing, keeping whatever room_type they already had selected
  if (name === 'package_id' && value) {
      const pkg = packages.find(p => p.id === value)
      if (pkg) {
        setForm(prev => ({
          ...prev,
          package_id:   value,
          currency:     pkg.currency ?? prev.currency,
          travel_date:  pkg.departure_date ? pkg.departure_date.slice(0, 10) : prev.travel_date,
          return_date:  pkg.return_date    ? pkg.return_date.slice(0, 10)    : prev.return_date,
        }))
        setPassengers(prev => prev.map(p => ({
          ...p,
          total_amount: tierPrice(pkg, p.room_type).toString(),
        })))
      }
    }
  }

  function updatePassenger(index: number, field: string, value: string) {
    setPassengers(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }

      // Re-price this passenger if their room tier changed and a package is selected
      if (field === 'room_type' && selectedPkg) {
        next[index].total_amount = tierPrice(selectedPkg, value).toString()
      }
      return next
    })
  }

  function addPassenger() {
    const defaultTier = availableTiers[0]?.value ?? 'quad'
    setPassengers(prev => [
      ...prev,
      {
        client_id: '', room_type: defaultTier,
        total_amount: selectedPkg ? tierPrice(selectedPkg, defaultTier).toString() : '',
        paid_amount: '0', notes: '',
        visa_status: 'pending', visa_number: '', room_number: '', bus_number: '',
      }
    ])
  }

  function removePassenger(index: number) {
    if (passengers.length === 1) return
    setPassengers(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (passengers.some(p => !p.client_id)) {
      setError('Please select a client for every passenger')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not signed in')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.organization_id) {
      setError('Could not determine your organization')
      setLoading(false)
      return
    }

    const orgId = profile.organization_id

    // Always derive the booking total from the live sum of passenger amounts
    const computedTotal = passengers.reduce((s, p) => s + parseFloat(p.total_amount || '0'), 0)
    const computedPaid  = passengers.reduce((s, p) => s + parseFloat(p.paid_amount  || '0'), 0)

    // Room type folded into notes — same convention the single "Book Now"
    // flow uses, so the booking page's extractRoomType() picks it up too
    const groupRoomType = mostCommonTier(passengers)
    const roomTypeNote = form.package_id ? `Room type: ${groupRoomType}` : null

    // Step 1 — Create the main booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        organization_id: orgId,
        agent_id:        user.id,
        client_id:       form.group_leader_id || passengers[0].client_id,
        package_id:      form.package_id      || null,
        travel_date:     form.travel_date     || null,
        return_date:     form.return_date     || null,
        num_passengers:  passengers.length,
        total_amount:    computedTotal,
        paid_amount:     computedPaid,
        currency:        form.currency,
        status:          'inquiry',
        notes:           [roomTypeNote, form.notes || null].filter(Boolean).join('\n') || null,
      })
      .select()
      .single()

    if (bookingError) { setError(bookingError.message); setLoading(false); return }

    // Step 2 — Create group booking record
    const { data: group, error: groupError } = await supabase
      .from('group_bookings')
      .insert({
        organization_id: orgId,
        booking_id:      booking.id,
        group_name:      form.group_name,
        group_leader_id: form.group_leader_id || null,
        total_pax:       passengers.length,
        notes:           form.notes           || null,
        group_type:      form.group_type,
        maktab_number:   isUmrah ? (form.maktab_number || null) : null,
      })
      .select()
      .single()

    if (groupError) { setError(groupError.message); setLoading(false); return }

    // Step 3 — Add all passengers
    const { error: passengersError } = await supabase
      .from('group_passengers')
      .insert(
        passengers.map(p => ({
          organization_id:  orgId,
          group_booking_id: group.id,
          client_id:        p.client_id,
          total_amount:     parseFloat(p.total_amount || '0'),
          paid_amount:      parseFloat(p.paid_amount  || '0'),
          notes:            p.notes                   || null,
          visa_status:      isUmrah ? p.visa_status           : 'pending',
          visa_number:      isUmrah ? (p.visa_number || null) : null,
          room_number:      isUmrah ? (p.room_number || null) : null,
          bus_number:       isUmrah ? (p.bus_number  || null) : null,
        }))
      )

    if (passengersError) { setError(passengersError.message); setLoading(false); return }

    // Step 4 — Autofill flight/hotel/umrah from the package, same action
    // the single-booking flow uses. Non-fatal: a group booking still gets
    // created even if this fails, staff can just click the button manually.
    if (form.package_id) {
      await autofillTripDetailsFromPackage({
        bookingId:      booking.id,
        organizationId: orgId,
        packageId:      form.package_id,
        roomType:       groupRoomType,
        maktabNumber:   isUmrah ? (form.maktab_number || null) : null,
      })
    }

    // Land on the same booking detail page the single-booking flow uses —
    // same Package & Trip Details card, same Voucher download button
    router.push(`/dashboard/bookings/${booking.id}`)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/groups" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New group booking</h1>
          <p className="text-gray-500 text-sm">Add multiple passengers under one booking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Group info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Group information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group type</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'custom', label: 'Custom / Tour' },
                { value: 'umrah',  label: 'Umrah' },
                { value: 'hajj',   label: 'Hajj' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, group_type: opt.value }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                    form.group_type === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group name <span className="text-red-500">*</span>
              </label>
              <input name="group_name" required value={form.group_name} onChange={handleChange}
                placeholder="e.g. Ahmed Family Umrah Group"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group leader</label>
              <select name="group_leader_id" value={form.group_leader_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select leader...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
              {!form.group_leader_id && passengers[0]?.client_id && (
                <p className="text-xs text-amber-600 mt-1">
                  No leader selected — {clients.find(c => c.id === passengers[0].client_id)?.full_name ?? 'Passenger 1'} will
                  be used as the primary contact on this booking.
                </p>
              )}
              {!form.group_leader_id && !passengers[0]?.client_id && (
                <p className="text-xs text-gray-400 mt-1">
                  No leader selected yet — pick one, or the first passenger you add will become the primary contact.
                </p>
              )}
            </div>

            {isUmrah && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maktab Number</label>
                <input name="maktab_number" value={form.maktab_number} onChange={handleChange}
                  placeholder="e.g. 12"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
              <select name="package_id" value={form.package_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">No package / custom</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.destination}</option>
                ))}
              </select>

              {selectedPkg && (
                <>
                  <p className="text-xs text-emerald-600 mt-1">
                    Flight, hotel & Umrah details will be auto-filled from this package once the group is created.
                  </p>

                  {availableTiers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableTiers.map(t => (
                        <div
                          key={t.value}
                          className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1"
                        >
                          <span className="text-xs font-semibold text-emerald-700 capitalize">{t.label}</span>
                          <span className="text-xs text-emerald-600">
                            {form.currency} {tierPrice(selectedPkg, t.value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Travel date</label>
              <input type="date" name="travel_date" value={form.travel_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return date</label>
              <input type="date" name="return_date" value={form.return_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* Passengers */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={16} />
              Passengers
              <span className="text-blue-600 font-bold">{passengers.length}</span>
            </h2>
            <button type="button" onClick={addPassenger}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
              <Plus size={14} /> Add passenger
            </button>
          </div>

          <div className="space-y-3">
            {passengers.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Passenger {i + 1}
                    {form.group_leader_id === p.client_id && p.client_id && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Leader
                      </span>
                    )}
                  </span>
                  {passengers.length > 1 && (
                    <button type="button" onClick={() => removePassenger(i)}
                      className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select value={p.client_id}
                      onChange={e => updatePassenger(i, 'client_id', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">Select client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedPkg && availableTiers.length > 0 && (
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Room tier</label>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTiers.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => updatePassenger(i, 'room_type', t.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize transition ${
                              p.room_type === t.value
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {t.label} — {tierPrice(selectedPkg, t.value).toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount ({form.currency})
                    </label>
                    <input type="number" min="0" value={p.total_amount}
                      onChange={e => updatePassenger(i, 'total_amount', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Paid so far</label>
                    <input type="number" min="0" value={p.paid_amount}
                      onChange={e => updatePassenger(i, 'paid_amount', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>

                  {isUmrah && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Visa Status</label>
                        <select value={p.visa_status}
                          onChange={e => updatePassenger(i, 'visa_status', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                          {VISA_OPTIONS.map(v => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Visa Number</label>
                        <input value={p.visa_number}
                          onChange={e => updatePassenger(i, 'visa_number', e.target.value)}
                          placeholder="Optional"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Room Number</label>
                        <input value={p.room_number}
                          onChange={e => updatePassenger(i, 'room_number', e.target.value)}
                          placeholder="e.g. 101"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Bus Number</label>
                        <input value={p.bus_number}
                          onChange={e => updatePassenger(i, 'bus_number', e.target.value)}
                          placeholder="e.g. Bus 2"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Total ({passengers.length} passengers)
            </span>
            <span className="font-bold text-gray-900">
              {form.currency}{' '}
              {passengers.reduce((s, p) => s + parseFloat(p.total_amount || '0'), 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Creating group booking...' : 'Create group booking'}
          </button>
          <Link href="/dashboard/groups"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}