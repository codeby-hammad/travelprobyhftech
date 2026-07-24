import { createClient } from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import VoucherDownload   from '@/components/bookings/VoucherDownload'

export default async function VoucherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, client:clients(*), package:packages(*), agent:profiles(full_name, email)')
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const [
    { data: org },
    { data: flights },
    { data: hotels },
    { data: umrah },
    { data: payments },
    { data: visas },
  ] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', booking.organization_id).single(),
    supabase.from('flight_details').select('*').eq('booking_id', id).order('departure_time'),
    supabase.from('hotel_details').select('*').eq('booking_id', id).order('check_in'),
    supabase.from('umrah_details').select('*').eq('booking_id', id).maybeSingle(),
    supabase.from('payments').select('*').eq('booking_id', id).order('paid_at', { ascending: false }),
    supabase.from('visa_applications').select('*').eq('booking_id', id),
  ])

  const pkg: any = booking.package

  // If no real hotel_details rows exist yet for this booking (nobody has
  // clicked "Autofill from package" or entered them manually), fall back to
  // the hotel names/distance/nights the linked package promises, so the
  // voucher is never blank just because the manual step hasn't happened.
  // Real hotel_details rows (with confirmed check-in/check-out) always win
  // once they exist.
  const packageHotelFallback = (!hotels || hotels.length === 0) && pkg
    ? [
        pkg.makkah_hotel && {
          id:             'pkg-makkah',
          city:           'makkah',
          hotel_name:     pkg.makkah_hotel,
          distance_haram: pkg.makkah_hotel_distance ?? null,
          nights:         pkg.makkah_nights ?? null,
          room_type:      null,
          check_in:       null,
          check_out:      null,
          stars:          null,
          meal_plan:      null,
          confirmation_no: null,
          notes:          'From package — confirm exact dates and add a real hotel entry on the booking page.',
        },
        pkg.madinah_hotel && {
          id:             'pkg-madinah',
          city:           'madinah',
          hotel_name:     pkg.madinah_hotel,
          distance_haram: pkg.madinah_hotel_distance ?? null,
          nights:         pkg.madinah_nights ?? null,
          room_type:      null,
          check_in:       null,
          check_out:      null,
          stars:          null,
          meal_plan:      null,
          confirmation_no: null,
          notes:          'From package — confirm exact dates and add a real hotel entry on the booking page.',
        },
      ].filter(Boolean)
    : hotels ?? []
const { data: group } = await supabase
    .from('group_bookings')
    .select(`
      *,
      passengers:group_passengers(
        *,
        client:clients(full_name, phone, passport_number, passport_expiry, nationality, date_of_birth)
      )
    `)
    .eq('booking_id', id)
    .maybeSingle()

  return (
    <VoucherDownload
      booking={booking}
      organization={org}
      flights={flights ?? []}
      hotels={packageHotelFallback}
      umrah={umrah ?? null}
      payments={payments ?? []}
      visas={visas ?? []}
      group={group ?? null}
    />
  )
}