'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Props = {
  booking:      any
  organization: any
  flights:      any[]
  hotels:       any[]
  umrah:        any
  payments:     any[]
  visas:        any[]
}

export default function VoucherDownload({
  booking,
  organization,
  flights,
  hotels,
  umrah,
  payments,
  visas,
}: Props) {
  const [ready,      setReady]      = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { setReady(true) }, [])

  async function handleDownload() {
    setGenerating(true)
    try {
      const { pdf }    = await import('@react-pdf/renderer')
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
      console.error('PDF error:', err)
      alert('Could not generate PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const client  = booking?.client  ?? {}
  const pkg     = booking?.package ?? {}
  const paidAmt = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)
  const balance = Number(booking?.total_amount ?? 0) - paidAmt

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-50  text-green-700',
    completed: 'bg-blue-50   text-blue-700',
    cancelled: 'bg-red-50    text-red-700',
    inquiry:   'bg-yellow-50 text-yellow-700',
    quoted:    'bg-purple-50 text-purple-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/dashboard/bookings/${booking?.id}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to booking
          </Link>
          {ready && (
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shadow-sm"
            >
              {generating
                ? <Loader2 size={15} className="animate-spin" />
                : <Download size={15} />
              }
              {generating ? 'Generating PDF...' : 'Download Voucher PDF'}
            </button>
          )}
        </div>

        {/* Preview card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-[#1e3a5f] px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg">{organization?.name}</p>
              {organization?.phone && (
                <p className="text-white/60 text-xs mt-0.5">{organization.phone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">BOOKING VOUCHER</p>
              <p className="text-white/60 text-xs mt-0.5">{booking?.booking_ref}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">

            {/* Client + Booking row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Client
                </p>
                <p className="font-semibold text-gray-900">{client?.full_name ?? '—'}</p>
                {client?.phone && <p className="text-sm text-gray-500 mt-0.5">{client.phone}</p>}
                {client?.passport_number && (
                  <p className="text-xs text-gray-400 mt-0.5">Passport: {client.passport_number}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Booking
                </p>
                <p className="font-semibold text-gray-900">{pkg?.name ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-0.5">{pkg?.destination ?? '—'}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  statusColors[booking?.status] ?? 'bg-gray-100 text-gray-600'
                }`}>
                  {booking?.status}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Travel Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {booking?.travel_date
                    ? new Date(booking.travel_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Return Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {booking?.return_date
                    ? new Date(booking.return_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Passengers</p>
                <p className="text-sm font-medium text-gray-900">{booking?.num_passengers ?? '—'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Flights summary */}
            {flights?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Flights ({flights.length})
                </p>
                <div className="space-y-2">
                  {flights.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {f.airline} {f.flight_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {f.departure_city ?? f.from_city} → {f.arrival_city ?? f.to_city}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotels summary */}
            {hotels?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Hotels ({hotels.length})
                </p>
                <div className="space-y-2">
                  {hotels.map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{h.hotel_name}</p>
                      <p className="text-xs text-gray-500">{h.city} · {h.nights} nights</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100" />

            {/* Payment summary */}
            <div className="bg-green-50 rounded-xl border border-green-100 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold text-gray-900">
                  {booking?.currency ?? 'PKR'} {Number(booking?.total_amount ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-semibold text-green-700">
                  {booking?.currency ?? 'PKR'} {paidAmt.toLocaleString()}
                </span>
              </div>
              {balance > 0 ? (
                <div className="flex justify-between text-sm pt-1 border-t border-green-200">
                  <span className="text-red-600 font-medium">Balance Due</span>
                  <span className="font-bold text-red-600">
                    {booking?.currency ?? 'PKR'} {balance.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-sm pt-1 border-t border-green-200">
                  <span className="text-green-700 font-medium">Payment Status</span>
                  <span className="font-bold text-green-700">FULLY PAID ✓</span>
                </div>
              )}
            </div>

          </div>

          {/* Download CTA at bottom */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <FileText size={15} />
              <span className="text-xs">PDF includes all flights, hotels, Umrah & visa details</span>
            </div>
            {ready && (
              <button
                onClick={handleDownload}
                disabled={generating}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
              >
                {generating
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Download size={13} />
                }
                {generating ? 'Generating...' : 'Download PDF'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}