'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { autofillTripDetailsFromPackage } from '@/app/actions/autofillTripDetails'
import { Loader2, ArrowRightCircle } from 'lucide-react'

export default function UmrahInquiryActions({ inquiry }: { inquiry: any }) {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(true)
    await supabase.from('umrah_inquiries').update({ status }).eq('id', inquiry.id)
    setLoading(false)
    router.refresh()
  }

  // Real conversion: creates a client per pilgrim (reusing existing clients by
  // phone where possible), creates the booking, and — when there's more than
  // one pilgrim — the group_bookings/group_passengers rows too, then autofills
  // flight/hotel/umrah details from the chosen package exactly like the
  // dashboard's own "Book Now" and group-booking flows already do.
  async function convertToBooking() {
    if (inquiry.converted_booking_id) {
      router.push(`/dashboard/bookings/${inquiry.converted_booking_id}`)
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not signed in')
      setLoading(false)
      return
    }

    const orgId = inquiry.organization_id
    const pilgrimDetails: any[] = inquiry.pilgrim_details ?? []

    if (pilgrimDetails.length === 0) {
      setError('This query has no pilgrim details to convert.')
      setLoading(false)
      return
    }

    try {
      // 1. Create (or reuse) a client per pilgrim
      const clientIds: string[] = []

      for (const p of pilgrimDetails) {
        let clientId: string | null = null

        if (p.phone) {
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', orgId)
            .eq('phone', p.phone)
            .maybeSingle()

          if (existingClient) clientId = existingClient.id
        }

        if (!clientId) {
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              organization_id: orgId,
              full_name:       `${p.firstName ?? ''} ${p.familyName ?? ''}`.trim() || p.slotLabel,
              email:           p.email || null,
              phone:           p.phone || null,
              nationality:     p.nationality || null,
              passport_number: p.passportNumber || null,
              passport_expiry: p.passportExpiryDate || null,
              date_of_birth:   p.dateOfBirth || null,
              created_by:      user.id,
            })
            .select('id')
            .single()

          if (clientError) throw clientError
          clientId = newClient.id
        }

        clientIds.push(clientId!)
      }

      const leadClientId = clientIds[0]

      // 2. Pull the package's travel dates for the booking record
      const { data: pkg } = inquiry.selected_package_id
        ? await supabase.from('packages').select('departure_date, return_date').eq('id', inquiry.selected_package_id).single()
        : { data: null }

      // 3. Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          organization_id: orgId,
          agent_id:        user.id,
          client_id:       leadClientId,
          package_id:      inquiry.selected_package_id || null,
          travel_date:     pkg?.departure_date || null,
          num_passengers:  pilgrimDetails.length,
          total_amount:    inquiry.total_price ?? 0,
          paid_amount:     0,
          currency:        inquiry.currency ?? 'PKR',
          status:          'inquiry',
          notes:           `Converted from Umrah query — room tier: ${inquiry.room_tier ?? 'n/a'}`,
        })
        .select('id')
        .single()

      if (bookingError) throw bookingError

      // 4. Multiple pilgrims -> also create the group booking + passengers
      if (pilgrimDetails.length > 1) {
        const { data: group, error: groupError } = await supabase
          .from('group_bookings')
          .insert({
            organization_id: orgId,
            booking_id:      booking.id,
            group_name:      `${pilgrimDetails[0].firstName ?? 'Umrah'} Group`,
            group_leader_id: leadClientId,
            total_pax:       pilgrimDetails.length,
            group_type:      'umrah',
          })
          .select('id')
          .single()

        if (groupError) throw groupError

        const { error: passengersError } = await supabase
          .from('group_passengers')
          .insert(
            clientIds.map(clientId => ({
              organization_id:  orgId,
              group_booking_id: group.id,
              client_id:        clientId,
              total_amount:     inquiry.price_per_pilgrim ?? 0,
              paid_amount:      0,
              visa_status:      'pending',
            }))
          )

        if (passengersError) throw passengersError
      }

      // 5. Autofill flight/hotel/umrah details from the package, same action
      // the single-booking and group-booking flows already use
      if (inquiry.selected_package_id) {
        await autofillTripDetailsFromPackage({
          bookingId:      booking.id,
          organizationId: orgId,
          packageId:      inquiry.selected_package_id,
          roomType:       inquiry.room_tier ?? null,
        })
      }

      // 6. Link the inquiry to what it became
      const { error: linkError } = await supabase
        .from('umrah_inquiries')
        .update({
          status:               'converted',
          converted_client_id:  leadClientId,
          converted_booking_id: booking.id,
        })
        .eq('id', inquiry.id)

      if (linkError) throw linkError

      router.push(`/dashboard/bookings/${booking.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Conversion failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {inquiry.status === 'new' && (
          <button
            onClick={() => updateStatus('contacted')}
            disabled={loading}
            className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Mark Contacted'}
          </button>
        )}

        {inquiry.status !== 'closed' && (
          <button
            onClick={convertToBooking}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading
              ? <Loader2 size={12} className="animate-spin" />
              : <ArrowRightCircle size={13} />}
            {inquiry.converted_booking_id ? 'View Booking' : 'Convert to Client & Booking'}
          </button>
        )}

        {inquiry.status !== 'closed' && (
          <button
            onClick={() => updateStatus('closed')}
            disabled={loading}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Close
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}