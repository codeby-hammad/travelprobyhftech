import { createClient }        from '@/lib/supabase/server'
import { notFound }            from 'next/navigation'
import Link                    from 'next/link'
import { ArrowLeft, Download, Pencil } from 'lucide-react'
import { formatCurrency, formatDate }  from '@/lib/utils'
import PaymentForm             from '@/components/bookings/PaymentForm'
import BookingStatusBadge      from '@/components/bookings/BookingStatusBadge'
import FlightDetailsSection    from '@/components/bookings/FlightDetailsSection'
import HotelDetailsSection     from '@/components/bookings/HotelDetailsSection'
import UmrahDetailsSection     from '@/components/bookings/UmrahDetailsSection'
import NotificationButton      from '@/components/notifications/NotificationButton'
import ExpenseSection          from '@/components/bookings/ExpenseSection'
import ProfitSummaryCard       from '@/components/bookings/ProfitSummaryCard'

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: booking  },
    { data: payments },
    { data: flights  },
    { data: hotels   },
    { data: umrah    },
    { data: expenses },
    { data: suppliers },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, client:clients(*), package:packages(*), agent:profiles(full_name)')
      .eq('id', id)
      .single(),
    supabase
      .from('payments')
      .select('*')
      .eq('booking_id', id)
      .order('paid_at', { ascending: false }),
    supabase
      .from('flight_details')
      .select('*')
      .eq('booking_id', id)
      .order('departure_time'),
    supabase
      .from('hotel_details')
      .select('*')
      .eq('booking_id', id)
      .order('check_in'),
    supabase
      .from('umrah_details')
      .select('*')
      .eq('booking_id', id)
      .maybeSingle(),
    supabase
      .from('booking_expenses')
      .select('*, supplier:suppliers(name, type)')
      .eq('booking_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('suppliers')
      .select('id, name, type')
      .order('name'),
  ])

  if (!booking) notFound()

  const balance     = booking.total_amount - booking.paid_amount
  const totalCost   = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0
  const unpaidCosts = expenses?.filter(e => !e.is_paid).reduce((s, e) => s + Number(e.amount), 0) ?? 0

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/bookings" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                {booking.booking_ref}
              </h1>
              <BookingStatusBadge status={booking.status} />
              {umrah && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  🕋 Umrah
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Created {formatDate(booking.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <NotificationButton booking={booking} client={booking.client} />
          <Link
            href={`/dashboard/bookings/${id}/edit`}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Pencil size={15} /> Edit
          </Link>
          <Link
            href={`/dashboard/bookings/${id}/voucher`}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Download size={15} /> Voucher
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Client */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Client</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {booking.client?.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{booking.client?.full_name}</p>
                <p className="text-sm text-gray-500">{booking.client?.phone}</p>
                <p className="text-sm text-gray-500">{booking.client?.email}</p>
              </div>
            </div>
            {booking.client?.passport_number && (
              <div className="mt-3 pt-3 border-t border-gray-50 text-sm text-gray-500">
                Passport:{' '}
                <span className="font-mono text-gray-700">
                  {booking.client.passport_number}
                </span>
                {booking.client.passport_expiry && (
                  <span className="ml-2">
                    (expires {formatDate(booking.client.passport_expiry)})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Trip details */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Trip details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Package',     value: booking.package?.name ?? 'Custom booking' },
                { label: 'Destination', value: booking.package?.destination ?? '—'       },
                { label: 'Travel date', value: booking.travel_date ? formatDate(booking.travel_date) : '—' },
                { label: 'Return date', value: booking.return_date ? formatDate(booking.return_date) : '—' },
                { label: 'Passengers',  value: booking.num_passengers },
                { label: 'Agent',       value: booking.agent?.full_name ?? '—' },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-gray-400 text-xs mb-0.5">{row.label}</p>
                  <p className="text-gray-900 font-medium">{row.value}</p>
                </div>
              ))}
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Umrah details */}
          <UmrahDetailsSection
            bookingId={id}
            organizationId={booking.organization_id}
            umrah={umrah}
          />

          {/* Flight details */}
          <FlightDetailsSection
            bookingId={id}
            organizationId={booking.organization_id}
            flights={flights ?? []}
          />

          {/* Hotel details */}
          <HotelDetailsSection
            bookingId={id}
            organizationId={booking.organization_id}
            hotels={hotels ?? []}
          />

          {/* Expenses */}
          <ExpenseSection
            bookingId={id}
            organizationId={booking.organization_id}
            expenses={expenses ?? []}
            suppliers={suppliers ?? []}
            currency={booking.currency}
          />

          {/* Payment history */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Payment history</h2>
            {(!payments || payments.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No payments recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(p.amount, p.currency)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.method.replace('_', ' ')} • {formatDate(p.paid_at)}
                        {p.reference_no && ` • Ref: ${p.reference_no}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === 'completed' ? 'bg-green-50  text-green-700'  :
                      p.status === 'refunded'  ? 'bg-red-50    text-red-700'    :
                                                  'bg-yellow-50 text-yellow-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Profit summary — NEW */}
          <ProfitSummaryCard
            sellingPrice={booking.total_amount}
            totalCost={totalCost}
            collected={booking.paid_amount}
            unpaidCosts={unpaidCosts}
            currency={booking.currency}
          />

          {/* Financial summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Client payments</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total amount</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(booking.total_amount, booking.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount paid</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(booking.paid_amount, booking.currency)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-gray-500">Balance due</span>
                <span className={`font-bold text-base ${
                  balance > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(balance, booking.currency)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: booking.total_amount > 0
                      ? `${Math.min((booking.paid_amount / booking.total_amount) * 100, 100)}%`
                      : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {booking.total_amount > 0
                  ? `${Math.round((booking.paid_amount / booking.total_amount) * 100)}% paid`
                  : '0% paid'}
              </p>
            </div>
          </div>

          {/* Add payment */}
          {balance > 0 && (
            <PaymentForm
              bookingId={booking.id}
              organizationId={booking.organization_id}
              currency={booking.currency}
              balanceDue={balance}
            />
          )}

          {balance <= 0 && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <p className="text-green-700 font-medium text-sm">✓ Fully paid</p>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Quick links</h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/invoices/new?booking_id=${id}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-1"
              >
                📄 Create invoice
              </Link>
              <Link
                href={`/dashboard/visa/new?booking_id=${id}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-1"
              >
                🛂 Add visa application
              </Link>
              <Link
                href={`/dashboard/clients/${booking.client_id}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-1"
              >
                👤 View client profile
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}