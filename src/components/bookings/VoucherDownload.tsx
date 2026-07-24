'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2, FileText, Plane, Building2, User, CreditCard, ShieldCheck, Users } from 'lucide-react'

type Props = {
  booking:      any
  organization: any
  flights:      any[]
  hotels:       any[]
  umrah:        any
  payments:     any[]
  visas:        any[]
  group?:       any
}

function fmtDate(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function VoucherDownload({
  booking,
  organization,
  flights,
  hotels,
  umrah,
  payments,
  visas,
  group,
}: Props) {
  const [ready,      setReady]      = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { setReady(true) }, [])

  async function handleDownload() {
    setGenerating(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { default: BookingVoucherPDF } = await import('./BookingVoucherPDF')

      const blob = await pdf(
        <BookingVoucherPDF
          booking={booking}
          organization={organization}
          flights={flights}
          hotels={hotels}
          umrah={umrah}
          payments={payments}
          visas={visas}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `Voucher-${booking?.booking_ref ?? booking?.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Could not generate PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownloadAll() {
    if (!group?.passengers?.length) return
    setGenerating(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { default: GroupVoucherPDF } = await import('./GroupVoucherPDF')

      const blob = await pdf(
        <GroupVoucherPDF
          booking={booking}
          organization={organization}
          flights={flights}
          hotels={hotels}
          umrah={umrah}
          payments={payments}
          visas={visas}
          passengers={group.passengers}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `Group-Vouchers-${booking?.booking_ref ?? booking?.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Group PDF generation error:', err)
      alert('Could not generate group PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownloadPassenger(passenger: any) {
    setGenerating(true)
    try {
      const { pdf, Document } = await import('@react-pdf/renderer')
      const { VoucherPageContent } = await import('./BookingVoucherPDF')

      const blob = await pdf(
        <Document title={`Voucher — ${passenger.client?.full_name ?? ''}`}>
          <VoucherPageContent
            booking={booking}
            organization={organization}
            flights={flights}
            hotels={hotels}
            umrah={umrah}
            payments={payments}
            visas={visas}
            passengerOverride={{
              client:        passenger.client,
              total_amount:  Number(passenger.total_amount ?? 0),
              paid_amount:   Number(passenger.paid_amount ?? 0),
              flight_number: passenger.flight_number,
              pnr:           passenger.pnr,
              seat_no:       passenger.seat_no,
            }}
          />
        </Document>
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `Voucher-${passenger.client?.full_name ?? passenger.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Passenger PDF generation error:', err)
      alert('Could not generate this passenger\'s PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (!ready) return null

  const client     = booking?.client ?? {}
  const pkg        = booking?.package ?? {}
  const paidAmount = payments?.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0) ?? 0
  const balance    = Number(booking?.total_amount ?? 0) - paidAmount
  const isGroup    = !!group?.passengers?.length

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    completed: 'bg-blue-50    text-blue-700    border-blue-100',
    cancelled: 'bg-red-50     text-red-700     border-red-100',
    inquiry:   'bg-amber-50   text-amber-700   border-amber-100',
    quoted:    'bg-purple-50  text-purple-700  border-purple-100',
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">
      <div className="max-w-3xl mx-auto">

        {/* ── Letterhead ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#284a72] px-7 py-6 flex items-center justify-between">
            <div>
              <p className="text-white text-lg font-bold tracking-tight">
                {organization?.name ?? 'Travel Agency'}
              </p>
              <p className="text-white/50 text-[11px] mt-0.5">
                {organization?.phone ?? ''}{organization?.phone && organization?.email ? ' · ' : ''}{organization?.email ?? ''}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg mb-1.5">
                <FileText size={14} className="text-white/80" />
                <span className="text-white text-[11px] font-semibold tracking-widest uppercase">Booking Voucher</span>
              </div>
              <p className="text-white/70 text-xs font-mono">{booking?.booking_ref}</p>
            </div>
          </div>

          <div className="px-7 py-4 flex items-center justify-between border-b border-gray-50">
            <span className={`inline-flex text-xs px-3 py-1 rounded-full font-semibold capitalize border ${statusColors[booking?.status] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
              {booking?.status ?? '—'}
            </span>
            <span className="text-xs text-gray-400">Issued {fmtDate(booking?.created_at)}</span>
          </div>
        </div>

        {/* ── Client + Package ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-[#1e3a5f]" />
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {isGroup ? 'Group Leader' : 'Client'}
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{client?.full_name ?? '—'}</p>
            {client?.phone && <p className="text-xs text-gray-500 mt-0.5">{client.phone}</p>}
            {client?.email && <p className="text-xs text-gray-500">{client.email}</p>}
            {client?.passport_number && (
              <p className="text-xs text-gray-400 mt-2 font-mono">Passport: {client.passport_number}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Plane size={14} className="text-[#1e3a5f]" />
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Package</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{pkg?.name ?? 'Custom booking'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{pkg?.destination ?? booking?.destination ?? '—'}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span>Travel: {fmtDate(booking?.travel_date)}</span>
              <span>Return: {fmtDate(booking?.return_date)}</span>
            </div>
          </div>
        </div>

        {/* ── Group passengers — only shown for group bookings ──── */}
        {isGroup && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[#1e3a5f]" />
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Group passengers ({group.passengers.length})
                </p>
              </div>
              <button
                onClick={handleDownloadAll}
                disabled={generating}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                Download all vouchers
              </button>
            </div>
            <div className="space-y-1.5">
              {group.passengers.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <span className="text-gray-700">{p.client?.full_name ?? '—'}</span>
                    {(p.flight_number || p.pnr || p.seat_no) && (
                      <span className="text-[11px] text-gray-400 ml-2">
                        {[p.flight_number, p.pnr, p.seat_no].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownloadPassenger(p)}
                    disabled={generating}
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50 shrink-0 ml-3"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Flights ────────────────────────────────────────────── */}
        {flights?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Plane size={14} className="text-[#1e3a5f]" />
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Flight details</p>
              {isGroup && (
                <span className="text-[10px] text-gray-400 font-normal normal-case">
                  (shared — individual overrides shown in per-passenger vouchers)
                </span>
              )}
            </div>
            <div className="space-y-3">
              {flights.map((f: any) => (
                <div key={f.id} className="border border-gray-50 bg-gray-50/60 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-900">
                      {f.airline ?? 'Airline TBD'} · {f.flight_number ?? '—'}
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {f.trip_type ?? ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-900">{f.departure_city ?? '—'}</p>
                      <p className="text-gray-400">{fmtDateTime(f.departure_time)}</p>
                    </div>
                    <div className="flex-1 mx-3 h-px bg-gray-200 relative">
                      <Plane size={11} className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-gray-300 rotate-90" />
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{f.arrival_city ?? '—'}</p>
                      <p className="text-gray-400">{fmtDateTime(f.arrival_time)}</p>
                    </div>
                  </div>
                  {(f.baggage_kg || f.seat_class || f.pnr || f.seat_no) && (
                    <div className="flex gap-3 mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                      {f.seat_class && <span>Class: {f.seat_class}</span>}
                      {f.seat_no && <span>Seat: {f.seat_no}</span>}
                      {f.baggage_kg && <span>Baggage: {f.baggage_kg}kg</span>}
                      {f.pnr && <span>PNR: {f.pnr}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Hotels ─────────────────────────────────────────────── */}
        {hotels?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={14} className="text-[#1e3a5f]" />
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Hotel details</p>
              {isGroup && (
                <span className="text-[10px] text-gray-400 font-normal normal-case">(shared across group)</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {hotels.map((h: any) => (
                <div key={h.id} className="border border-gray-50 bg-gray-50/60 rounded-xl p-4">
                  <p className="text-sm font-bold text-gray-900 capitalize">{h.city}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{h.hotel_name}</p>
                  {h.distance_haram && <p className="text-[11px] text-gray-400">{h.distance_haram}</p>}
                  <div className="flex gap-3 mt-2 text-[11px] text-gray-400">
                    <span>{fmtDate(h.check_in)} → {fmtDate(h.check_out)}</span>
                    {h.nights != null && <span>{h.nights} nights</span>}
                  </div>
                  {h.room_type && (
                    <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md capitalize">
                      {h.room_type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Umrah details ──────────────────────────────────────── */}
        {umrah && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">🕋</span>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Umrah details</p>
              {isGroup && (
                <span className="text-[10px] text-gray-400 font-normal normal-case">(shared across group)</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[11px] text-gray-400">Umrah Type</p>
                <p className="font-medium text-gray-900 capitalize">{umrah.umrah_type ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Maktab No</p>
                <p className="font-medium text-gray-900">{umrah.maktab_number ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Group Leader</p>
                <p className="font-medium text-gray-900">{umrah.group_leader ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Departure City</p>
                <p className="font-medium text-gray-900">{umrah.departure_city ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Ihram Point</p>
                <p className="font-medium text-gray-900">{umrah.ihram_point ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Transport</p>
                <p className="font-medium text-gray-900 capitalize">{umrah.transport_type ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Makkah Nights</p>
                <p className="font-medium text-gray-900">{umrah.makkah_nights ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Madinah Nights</p>
                <p className="font-medium text-gray-900">{umrah.madinah_nights ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Ziarat</p>
                <p className="font-medium text-gray-900">
                  {[umrah.ziarat_makkah && 'Makkah', umrah.ziarat_madinah && 'Madinah'].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            </div>
            {umrah.special_requests && (
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-50">{umrah.special_requests}</p>
            )}
          </div>
        )}

        {/* ── Visas ──────────────────────────────────────────────── */}
        {visas?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={14} className="text-[#1e3a5f]" />
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Visa information</p>
            </div>
            <div className="space-y-2">
              {visas.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900">{v.visa_type ?? 'Visa'} · {v.destination ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      No: {v.visa_number ?? '—'}
                      {v.embassy && ` · ${v.embassy}`}
                      {v.expiry_date && ` · Expires ${fmtDate(v.expiry_date)}`}
                    </p>
                  </div>
                  <span className="text-xs font-semibold capitalize text-gray-600">{v.status ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Payment summary ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} className="text-[#1e3a5f]" />
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Payment summary</p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Payment progress</span>
            <span className={balance <= 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {balance <= 0
                ? 'Fully paid'
                : `Balance: ${booking?.currency ?? 'PKR'} ${balance.toLocaleString()}`
              }
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, Number(booking?.total_amount) > 0
                  ? (paidAmount / Number(booking.total_amount)) * 100
                  : 0
                )}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5 mb-4">
            <span>Paid: {booking?.currency ?? 'PKR'} {paidAmount.toLocaleString()}</span>
            <span>Total: {booking?.currency ?? 'PKR'} {Number(booking?.total_amount ?? 0).toLocaleString()}</span>
          </div>

          {payments?.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-gray-50">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {p.method?.replace('_', ' ')} · {fmtDate(p.paid_at)}
                    {p.reference_no && ` · Ref: ${p.reference_no}`}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {booking?.currency ?? 'PKR'} {Number(p.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Download ───────────────────────────────────────────── */}
        <button
          onClick={handleDownload}
          disabled={generating}
          className="w-full flex items-center justify-center gap-3 bg-[#1e3a5f] hover:bg-[#162d4a] text-white py-4 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm"
        >
          {generating
            ? <Loader2 size={18} className="animate-spin" />
            : <Download size={18} />
          }
          {generating
            ? 'Generating PDF — please wait...'
            : isGroup
              ? 'Download Group Leader Voucher PDF'
              : 'Download Booking Voucher PDF'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          {isGroup
            ? 'This downloads a single voucher for the group leader. Use the passenger list above for individual vouchers.'
            : 'PDF includes all booking details, flights, hotels, and payment summary'}
        </p>
      </div>
    </div>
  )
}