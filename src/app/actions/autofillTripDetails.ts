'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function parseBaggageKg(baggage?: string | null): number | null {
  if (!baggage) return null
  const match = baggage.match(/(\d+)\s*kg/i)
  return match ? parseInt(match[1], 10) : null
}

function combineDateTime(date?: string | null, time?: string | null): string | null {
  if (!date) return null
  if (!time) return date
  return `${date}T${time}`
}

export async function autofillTripDetailsFromPackage({
  bookingId,
  organizationId,
  packageId,
  roomType,
  maktabNumber,
}: {
  bookingId: string
  organizationId: string
  packageId: string
  roomType: string | null
  maktabNumber?: string | null
}) {
  const supabase = await createClient()

  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .single()

  if (pkgError || !pkg) {
    return { success: false, error: 'Could not load the linked package.' }
  }

  // Guard: don't duplicate if flight/hotel/umrah rows already exist
  const [{ count: flightCount }, { count: hotelCount }, { data: existingUmrah }] = await Promise.all([
    supabase.from('flight_details').select('id', { count: 'exact', head: true }).eq('booking_id', bookingId),
    supabase.from('hotel_details').select('id', { count: 'exact', head: true }).eq('booking_id', bookingId),
    supabase.from('umrah_details').select('id').eq('booking_id', bookingId).maybeSingle(),
  ])

  const flightRows: any[] = []
 if (pkg.flight_number_out) {
      flightRows.push({
        booking_id:      bookingId,
        organization_id: organizationId,
        trip_type:       'outbound',
        airline:         pkg.airline ?? null,
        flight_number:   pkg.flight_number_out,
        departure_city:  pkg.departure_city_code ?? pkg.departure_city ?? null,
        arrival_city:    pkg.destination_code    ?? pkg.destination    ?? null,
        departure_time:  combineDateTime(pkg.departure_date, pkg.departure_time),
        arrival_time:    combineDateTime(pkg.departure_date, pkg.arrival_time),
        baggage_kg:      parseBaggageKg(pkg.baggage_out),
        notes:           pkg.baggage_out ? `Baggage: ${pkg.baggage_out}` : null,
      })
    }
    if (pkg.flight_number_return) {
      flightRows.push({
        booking_id:      bookingId,
        organization_id: organizationId,
        trip_type:       'return',
        airline:         pkg.airline ?? null,
        flight_number:   pkg.flight_number_return,
        departure_city:  pkg.destination_code    ?? pkg.destination    ?? null,
        arrival_city:    pkg.departure_city_code ?? pkg.departure_city ?? null,
        departure_time:  combineDateTime(pkg.return_date, pkg.return_departure_time),
        arrival_time:    combineDateTime(pkg.return_date, pkg.return_arrival_time),
        baggage_kg:      parseBaggageKg(pkg.baggage_return),
        notes:           pkg.baggage_return ? `Baggage: ${pkg.baggage_return}` : null,
      })
    }

  const hotelRows: any[] = []
  if (!hotelCount) {
    if (pkg.makkah_hotel) {
      hotelRows.push({
        booking_id:      bookingId,
        organization_id: organizationId,
        city:            'makkah',
        hotel_name:      pkg.makkah_hotel,
        room_type:       roomType ?? null,
        distance_haram:  pkg.makkah_hotel_distance ?? null,
        notes:           `Auto-filled from package — confirm check-in/check-out dates and confirmation number.${pkg.makkah_nights ? ` (Package lists ${pkg.makkah_nights} nights.)` : ''}`,
      })
    }
    if (pkg.madinah_hotel) {
      hotelRows.push({
        booking_id:      bookingId,
        organization_id: organizationId,
        city:            'madinah',
        hotel_name:      pkg.madinah_hotel,
        room_type:       roomType ?? null,
        distance_haram:  pkg.madinah_hotel_distance ?? null,
        notes:           `Auto-filled from package — confirm check-in/check-out dates and confirmation number.${pkg.madinah_nights ? ` (Package lists ${pkg.madinah_nights} nights.)` : ''}`,
      })
    }
  }

  // Umrah — only the fields we actually have a real source for.
  // Everything else (umrah_type, group_leader, ziarat, transport_type,
  // ihram_point, special_requests) has no package equivalent and stays
  // for manual entry.
  let umrahInserted = false
  if (!existingUmrah && (pkg.departure_city || pkg.makkah_nights || pkg.madinah_nights || maktabNumber)) {
    const { error: umrahError } = await supabase
      .from('umrah_details')
      .insert({
        booking_id:      bookingId,
        organization_id: organizationId,
        departure_city:  pkg.departure_city ?? null,
        makkah_nights:   pkg.makkah_nights ?? null,
        madinah_nights:  pkg.madinah_nights ?? null,
        maktab_number:   maktabNumber ?? null,
      })

    if (umrahError) return { success: false, error: `Umrah autofill failed: ${umrahError.message}` }
    umrahInserted = true
  }

  if (flightRows.length > 0) {
    const { error } = await supabase.from('flight_details').insert(flightRows)
    if (error) return { success: false, error: `Flight autofill failed: ${error.message}` }
  }

  if (hotelRows.length > 0) {
    const { error } = await supabase.from('hotel_details').insert(hotelRows)
    if (error) return { success: false, error: `Hotel autofill failed: ${error.message}` }
  }

  if (flightRows.length === 0 && hotelRows.length === 0 && !umrahInserted) {
    return { success: false, error: 'Nothing to autofill — package has no matching data, or details already exist.' }
  }

  revalidatePath(`/dashboard/bookings/${bookingId}`)
  return { success: true }
}