import { createClient }        from '@/lib/supabase/server'
import { notFound }            from 'next/navigation'
import Link                    from 'next/link'
import { ArrowLeft, Download, Pencil, Users, Plane, Building2 } from 'lucide-react'
import { formatCurrency, formatDate }  from '@/lib/utils'
import PaymentForm             from '@/components/bookings/PaymentForm'
import BookingStatusBadge      from '@/components/bookings/BookingStatusBadge'
import FlightDetailsSection    from '@/components/bookings/FlightDetailsSection'
import HotelDetailsSection     from '@/components/bookings/HotelDetailsSection'
import UmrahDetailsSection     from '@/components/bookings/UmrahDetailsSection'
import NotificationButton      from '@/components/notifications/NotificationButton'
import ExpenseSection          from '@/components/bookings/ExpenseSection'
import ProfitSummaryCard       from '@/components/bookings/ProfitSummaryCard'
import DocumentsSection        from '@/components/documents/DocumentsSection'
import AirlineLogo             from '@/components/shared/AirlineLogo'
import AutofillTripDetailsButton from '@/components/bookings/AutofillTripDetailsButton'
import PassengerFlightCell from '@/components/bookings/PassengerFlightCell'

const GROUP_TYPE_LABELS: Record<string, string> = {
  umrah:  'Umrah Group',
  hajj:   'Hajj Group',
  custom: 'Group Booking',
}

const VISA_STYLES: Record<string, string> = {
  pending:   'bg-gray-100   text-gray-500',
  submitted: 'bg-amber-50   text-amber-700',
  approved:  'bg-emerald-50 text-emerald-700',
  rejected:  'bg-red-50     text-red-600',
}

// The room type chosen on the packages page's "Book Now" button is folded
// into the booking's notes as "Room type: X" (there's no dedicated column
// for it), so pull it back out here to show as a proper badge instead of
// leaving it buried in a free-text notes paragraph.
function extractRoomType(notes?: string | null): string | null {
  if (!notes) return null
  const match = notes.match(/Room type:\s*(\w+)/i)
  return match ? match[1] : null
}

function notesWithoutRoomType(notes?: string | null): string | null {
  if (!notes) return null
  const cleaned = notes.replace(/Room type:\s*\w+\n?/i, '').trim()
  return cleaned || null
}

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
    { data: group },
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
    supabase
      .from('group_bookings')
      .select(`
        *,
        passengers:group_passengers(
          *,
          client:clients(full_name, phone, passport_number, passport_expiry)
        )
      `)
      .eq('booking_id', id)
      .maybeSingle(),
  ])

  if (!booking) notFound()

  const balance     = booking.total_amount - booking.paid_amount
  const totalCost   = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0
  const unpaidCosts = expenses?.filter(e => !e.is_paid).reduce((s, e) => s + Number(e.amount), 0) ?? 0

  const isGroup   = !!group
  const isUmrahGroup = group?.group_type === 'umrah' || group?.group_type === 'hajj'
  const passengers = (group?.passengers as any[]) ?? []

  const pkg: any = booking.package
  const roomType = extractRoomType(booking.notes)
  const displayNotes = notesWithoutRoomType(booking.notes)

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/bookings" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                {booking.booking_ref}
              </h1>
              <BookingStatusBadge status={booking.status} />
              {umrah && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  🕋 Umrah
                </span>
              )}
              {isGroup && (
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <Users size={11} /> {GROUP_TYPE_LABELS[group.group_type] ?? 'Group Booking'} · {passengers.length} pax
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

          {isGroup ? (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  {group.group_name}
                  <span className="text-gray-400 font-normal">({passengers.length} passengers)</span>
                </h2>
                <Link
                  href={`/dashboard/groups/${group.id}`}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  View full group →
                </Link>
              </div>

              {group.maktab_number && (
                <p className="text-xs text-gray-400 font-mono mb-3">Maktab {group.maktab_number}</p>
              )}

              {booking.client && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {booking.client.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {booking.client.full_name}
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Leader</span>
                    </p>
                    <p className="text-xs text-gray-500">{booking.client.phone}</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="px-1 py-2 font-medium">Passenger</th>
                      <th className="px-1 py-2 font-medium">Passport</th>
                      <th className="px-1 py-2 font-medium">Seat</th>
                      {isUmrahGroup && <th className="px-1 py-2 font-medium">Room</th>}
                      {isUmrahGroup && <th className="px-1 py-2 font-medium">Visa</th>}
                      <th className="px-1 py-2 font-medium text-right">Amount</th>
                      <th className="px-1 py-2 font-medium text-right">Paid</th>
                      {totalCost > 0 && (
                        <>
                          <th className="px-1 py-2 font-medium text-right">Cost Share</th>
                          <th className="px-1 py-2 font-medium text-right">Profit</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {passengers.map((p: any) => {
                      const costShare = passengers.length > 0 ? totalCost / passengers.length : 0
                      const profit    = Number(p.total_amount) - costShare
                      const inTheRed  = Number(p.paid_amount) < costShare
                      return (
                        <tr key={p.id}>
                          <td className="px-1 py-2">
                            <Link href={`/dashboard/clients/${p.client_id}`} className="font-medium text-gray-900 hover:text-blue-600">
                              {p.client?.full_name}
                            </Link>
                          </td>
                          <td className="px-1 py-2 font-mono text-xs text-gray-500">
                            {p.client?.passport_number ?? '—'}
                          </td>
                          <td className="px-1 py-2">
                            <PassengerFlightCell
                              passengerId={p.id}
                              seatNo={p.seat_no}
                              pnr={p.pnr}
                            />
                          </td>
                          {isUmrahGroup && (
                            <td className="px-1 py-2 text-gray-600">{p.room_number ?? '—'}</td>
                          )}
                          {isUmrahGroup && (
                            <td className="px-1 py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${VISA_STYLES[p.visa_status] ?? VISA_STYLES.pending}`}>
                                {p.visa_status ?? 'pending'}
                              </span>
                            </td>
                          )}
                          <td className="px-1 py-2 text-right font-medium text-gray-900">
                            {formatCurrency(p.total_amount, booking.currency)}
                          </td>
                          <td className="px-1 py-2 text-right">
                            <span className={inTheRed ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                              {formatCurrency(p.paid_amount, booking.currency)}
                            </span>
                            {inTheRed && (
                              <p className="text-[10px] text-red-400 leading-tight">below cost share</p>
                            )}
                          </td>
                          {totalCost > 0 && (
                            <>
                              <td className="px-1 py-2 text-right text-gray-500">
                                {formatCurrency(costShare, booking.currency)}
                              </td>
                              <td className="px-1 py-2 text-right">
                                <span className={profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                  {profit >= 0 ? '+' : ''}{formatCurrency(profit, booking.currency)}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {totalCost > 0 && (
                <p className="text-[11px] text-gray-400 mt-3">
                  Cost share splits the group's total cost ({formatCurrency(totalCost, booking.currency)}) equally
                  across {passengers.length} passengers. Profit compares each person's package price to that
                  even split — it's an estimate, not a per-person expense record.
                </p>
              )}
            </div>
          ) : (
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
          )}

          {/* Package & Trip Details — pulled directly from the linked package,
              since a booking created via "Book Now" already has full flight/
              hotel/room info there. No need to re-enter it manually below. */}
          {pkg && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Plane size={16} className="text-emerald-600" />
                  Package & Trip Details
                </h2>
                <Link
                  href={`/dashboard/packages/${pkg.id}`}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  View package →
                </Link>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <AirlineLogo airlineName={pkg.airline} iataCode={pkg.airline_iata_code} size={44} />
                <div>
                  <p className="text-sm font-bold text-gray-900">{pkg.name}</p>
                  <p className="text-xs text-gray-400">
                    {pkg.route_code || `${pkg.departure_city ?? '—'} → ${pkg.destination ?? '—'}`}
                    {pkg.airline ? ` · ${pkg.airline}` : ''}
                  </p>
                </div>
                {roomType && (
                  <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg capitalize">
                    {roomType} Room
                  </span>
                )}
              </div>

              {(pkg.flight_number_out || pkg.flight_number_return) && (
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-50 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Outbound</p>
                    <p className="font-medium text-gray-900">
                      {pkg.flight_number_out ?? '—'}
                      {pkg.departure_date ? ` · ${formatDate(pkg.departure_date)}` : ''}
                    </p>
                    {(pkg.departure_time || pkg.arrival_time) && (
                      <p className="text-xs text-gray-500">{pkg.departure_time ?? ''} → {pkg.arrival_time ?? ''}</p>
                    )}
                    {pkg.baggage_out && <p className="text-xs text-gray-400 mt-0.5">{pkg.baggage_out}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Return</p>
                    <p className="font-medium text-gray-900">
                      {pkg.flight_number_return ?? '—'}
                      {pkg.return_date ? ` · ${formatDate(pkg.return_date)}` : ''}
                    </p>
                    {(pkg.return_departure_time || pkg.return_arrival_time) && (
                      <p className="text-xs text-gray-500">{pkg.return_departure_time ?? ''} → {pkg.return_arrival_time ?? ''}</p>
                    )}
                    {pkg.baggage_return && <p className="text-xs text-gray-400 mt-0.5">{pkg.baggage_return}</p>}
                  </div>
                </div>
              )}

              {(pkg.makkah_hotel || pkg.madinah_hotel) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {pkg.makkah_hotel && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5 shrink-0">🕋</span>
                      <div>
                        <p className="font-medium text-gray-900">{pkg.makkah_hotel}</p>
                        <p className="text-xs text-gray-400">
                          Makkah
                          {pkg.makkah_hotel_distance ? ` · ${pkg.makkah_hotel_distance}` : ''}
                          {pkg.makkah_nights ? ` · ${pkg.makkah_nights} nights` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                  {pkg.madinah_hotel && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5 shrink-0">🕌</span>
                      <div>
                        <p className="font-medium text-gray-900">{pkg.madinah_hotel}</p>
                        <p className="text-xs text-gray-400">
                          Madinah
                          {pkg.madinah_hotel_distance ? ` · ${pkg.madinah_hotel_distance}` : ''}
                          {pkg.madinah_nights ? ` · ${pkg.madinah_nights} nights` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
            {displayNotes && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{displayNotes}</p>
              </div>
            )}
          </div>
           
            {/* Autofill from package — shown whenever there's a linked
              package AND at least one of flights/hotels/umrah is still
              empty, so it never overwrites manual edits but keeps helping
              until everything it can fill in has been filled in */}
          {pkg && ((flights?.length ?? 0) === 0 || (hotels?.length ?? 0) === 0 || !umrah) && (
            <AutofillTripDetailsButton
              bookingId={id}
              organizationId={booking.organization_id}
              packageId={pkg.id}
              roomType={roomType}
              maktabNumber={group?.maktab_number ?? null}
            />
          )}

          {/* Umrah details — manual entry, for bookings without a package
              or to add/override specifics beyond what the package provides */}
          <UmrahDetailsSection
            bookingId={id}
            organizationId={booking.organization_id}
            umrah={umrah}
          />

          

          {/* Flight details — manual entry, kept for bookings without a
              package or where actual flight details differ from the package */}
          <FlightDetailsSection
            bookingId={id}
            organizationId={booking.organization_id}
            flights={flights ?? []}
          />

          {/* Hotel details — same as above, manual/override entry */}
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

          <ProfitSummaryCard
            sellingPrice={booking.total_amount}
            totalCost={totalCost}
            collected={booking.paid_amount}
            unpaidCosts={unpaidCosts}
            currency={booking.currency}
          />

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              {isGroup ? 'Group payments (combined)' : 'Client payments'}
            </h2>
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
            {isGroup && (
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                This is the combined total for all {passengers.length} passengers. See the
                table above for each person's individual amount and paid status.
              </p>
            )}
          </div>

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
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Quick links</h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/invoices/new?booking_id=${id}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-1"
              >
                📄 Create invoice
              </Link>

              {!isGroup && (
                <Link
                  href={`/dashboard/visa/new?booking_id=${id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-1"
                >
                  🛂 Add visa application
                </Link>
              )}

              {isGroup && passengers.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Add visa for
                  </p>
                  <div className="space-y-1">
                    {passengers.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/dashboard/visa/new?booking_id=${id}&client_id=${p.client_id}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-0.5"
                      >
                        🛂 {p.client?.full_name ?? 'Passenger'}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {isGroup ? (
                <Link
                  href={`/dashboard/groups/${group.id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-1"
                >
                  👥 View all passengers
                </Link>
              ) : (
                <Link
                  href={`/dashboard/clients/${booking.client_id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-1"
                >
                  👤 View client profile
                </Link>
              )}
            </div>
          </div>

<DocumentsSection
  entityType="booking"
  entityId={booking.id}
  organizationId={booking.organization_id}
  documentTypes={['hotel_confirmation', 'flight_ticket', 'invoice_copy', 'other']}
/>
        </div>
      </div>
    </div>
    
  )
}