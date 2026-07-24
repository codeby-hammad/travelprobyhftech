'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Package as PackageIcon } from 'lucide-react'
import type { Client, Package } from '@/types'

const ROOM_TYPE_LABELS: Record<string, string> = {
  sharing: 'Sharing',
  quad:    'Quad',
  triple:  'Triple',
  double:  'Double',
}

function getPriceForRoomType(pkg: any, roomType: string): number {
  switch (roomType) {
    case 'quad':   return pkg.price_quad   ?? pkg.base_price
    case 'triple': return pkg.price_triple ?? pkg.base_price
    case 'double': return pkg.price_double ?? pkg.base_price
    default:       return pkg.base_price
  }
}

export default function NewBookingPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase      = createClient()

  const [clients,  setClients]  = useState<Client[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Room type carried over from the packages page's "Book Now" link —
  // not a bookings table column, so we keep it as local state and fold it
  // into notes on submit rather than trying to insert it directly.
  const [roomType, setRoomType] = useState<string>(searchParams.get('room_type') ?? 'sharing')
  const prefilledPackageId = searchParams.get('package_id')

  const [form, setForm] = useState({
    client_id:      '',
    package_id:     '',
    travel_date:    '',
    return_date:    '',
    num_passengers: '1',
    total_amount:   '',
    paid_amount:    '0',
    currency:       'PKR',
    status:         'inquiry',
    notes:          '',
  })

  // Load clients and packages when page opens
  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('clients').select('*').order('full_name'),
        supabase.from('packages').select('*').eq('is_active', true).order('name'),
      ])
      setClients(c ?? [])
      setPackages(p ?? [])

      // If we arrived via a package's "Book Now" link, pre-fill everything
      // now that we actually have the package data to pull the price from
      if (prefilledPackageId) {
        const pkg = (p ?? []).find((pkg: any) => pkg.id === prefilledPackageId)
        if (pkg) {
          const price = getPriceForRoomType(pkg, roomType)
          setForm(prev => ({
            ...prev,
            package_id:   pkg.id,
            total_amount: price != null ? String(price) : '',
            currency:     pkg.currency,
            travel_date:  (pkg as any).departure_date ?? '',
            return_date:  (pkg as any).return_date    ?? '',
          }))
        }
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedPackage: any = packages.find(p => p.id === form.package_id)

  // Recompute price whenever room type or passenger count changes, so the
  // total stays correct if the agent adjusts either after landing here
  useEffect(() => {
    if (!selectedPackage) return
    const price = getPriceForRoomType(selectedPackage, roomType)
    if (price == null) return
    const total = price * parseInt(form.num_passengers || '1')
    setForm(prev => ({ ...prev, total_amount: String(total) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType, form.num_passengers, selectedPackage?.id])

  // When a package is selected manually, auto-fill the price
  function handlePackageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const pkgId = e.target.value
    setForm(prev => ({ ...prev, package_id: pkgId }))
    if (pkgId) {
      const pkg: any = packages.find(p => p.id === pkgId)
      if (pkg) {
        const price = getPriceForRoomType(pkg, roomType)
        const total = (price ?? pkg.base_price) * parseInt(form.num_passengers || '1')
        setForm(prev => ({
          ...prev,
          package_id:   pkgId,
          total_amount: total.toString(),
          currency:     pkg.currency,
        }))
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    // Fold the room type into notes, since bookings has no dedicated column
    // for it — keeps the info visible on the booking without a schema change
    const roomTypeNote = form.package_id
      ? `Room type: ${ROOM_TYPE_LABELS[roomType] ?? roomType}`
      : null
    const combinedNotes = [roomTypeNote, form.notes || null].filter(Boolean).join('\n')

    const { error } = await supabase.from('bookings').insert({
      organization_id: profile!.organization_id,
      agent_id:        user!.id,
      client_id:       form.client_id,
      package_id:      form.package_id  || null,
      travel_date:     form.travel_date || null,
      return_date:     form.return_date || null,
      num_passengers:  parseInt(form.num_passengers),
      total_amount:    parseFloat(form.total_amount || '0'),
      paid_amount:     parseFloat(form.paid_amount  || '0'),
      currency:        form.currency,
      status:          form.status,
      notes:           combinedNotes || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/bookings')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/bookings" className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New booking</h1>
          <p className="text-gray-500 text-sm">Fill in the booking details below</p>
        </div>
      </div>

      {/* Pre-filled package summary — only shows when arriving via a package's Book Now link */}
      {selectedPackage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
            <PackageIcon size={16} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900">
              Booking from: {selectedPackage.name}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {ROOM_TYPE_LABELS[roomType] ?? roomType} room · {selectedPackage.currency} {getPriceForRoomType(selectedPackage, roomType)?.toLocaleString()} per person
            </p>
            <div className="flex gap-1.5 mt-2">
              {Object.keys(ROOM_TYPE_LABELS).map(rt => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setRoomType(rt)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    roomType === rt
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {ROOM_TYPE_LABELS[rt]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client <span className="text-red-500">*</span>
          </label>
          <select name="client_id" required value={form.client_id} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select a client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.full_name} {c.phone ? `— ${c.phone}` : ''}</option>
            ))}
          </select>
          {clients.length === 0 && (
            <p className="text-xs text-orange-500 mt-1">
              No clients yet.{' '}
              <Link href="/dashboard/clients/new" className="underline">Add a client first</Link>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
          <select name="package_id" value={form.package_id} onChange={handlePackageChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No package / custom booking</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.destination} ({p.duration_days}d)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
            <input type="number" name="num_passengers" min="1" value={form.num_passengers} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="inquiry">Inquiry</option>
              <option value="quoted">Quoted</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total amount</label>
            <input type="number" name="total_amount" min="0" value={form.total_amount} onChange={handleChange}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paid so far</label>
            <input type="number" name="paid_amount" min="0" value={form.paid_amount} onChange={handleChange}
              placeholder="0"
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
              <option>EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            placeholder="Any special requirements, visa notes, hotel preferences..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          {selectedPackage && (
            <p className="text-xs text-gray-400 mt-1">
              "{ROOM_TYPE_LABELS[roomType] ?? roomType} room" will be added to notes automatically.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? 'Creating...' : 'Create booking'}
          </button>
          <Link href="/dashboard/bookings"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}