'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowRightCircle } from 'lucide-react'

export default function InquiryActions({ inquiry }: { inquiry: any }) {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(true)
    await supabase
      .from('booking_inquiries')
      .update({ status })
      .eq('id', inquiry.id)
    setLoading(false)
    router.refresh()
  }

  // Real conversion: creates (or reuses) a client, creates a booking from
  // the inquiry's details, links both back to the inquiry, and takes the
  // agent straight to the new booking to fill in package/price.
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

    try {
      // 1. Reuse an existing client with the same phone in this org, if one exists —
      // avoids creating duplicate client records for repeat inquirers
      let clientId: string | null = null

      if (inquiry.phone) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('organization_id', orgId)
          .eq('phone', inquiry.phone)
          .maybeSingle()

        if (existingClient) clientId = existingClient.id
      }

      // 2. Create a new client if no match was found
      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            organization_id: orgId,
            full_name: inquiry.full_name,
            phone: inquiry.phone || null,
            email: inquiry.email || null,
          })
          .select('id')
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }

      // 3. Create the booking — agent fills in package/pricing afterward,
      // since the inquiry's service_type is free text, not a real package_id.
      // num_passengers on the inquiry can be a free-text range like
      // "3-5 People (Family)" from the website form, so extract the first
      // number found rather than passing the string straight into an int column.
      const parsedPassengers = (() => {
        if (typeof inquiry.num_passengers === 'number') return inquiry.num_passengers
        const match = String(inquiry.num_passengers ?? '').match(/\d+/)
        return match ? parseInt(match[0], 10) : 1
      })()

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          organization_id: orgId,
          agent_id: user.id,
          client_id: clientId,
          package_id: null,
          travel_date: inquiry.travel_date || null,
          num_passengers: parsedPassengers,
          total_amount: 0,
          paid_amount: 0,
          currency: 'PKR',
          status: 'inquiry',
          notes: inquiry.service_type
            ? `Converted from website inquiry — requested: ${inquiry.service_type}${
                inquiry.num_passengers ? ` (${inquiry.num_passengers})` : ''
              }`
            : 'Converted from website inquiry',
        })
        .select('id')
        .single()

      if (bookingError) throw bookingError

      // 4. Link the inquiry to what it became, and mark it converted
      const { error: linkError } = await supabase
        .from('booking_inquiries')
        .update({
          status: 'converted',
          converted_client_id: clientId,
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

  const waMessage = encodeURIComponent(
    `Assalam o Alaikum ${inquiry.full_name}! Thank you for your inquiry about ${inquiry.service_type ?? 'our services'}. We at HAMMAD TRAVELERS are happy to assist you. Please let us know your preferred travel dates and we will prepare the best package for you. JazakAllah Khair!`
  )

  const waLink = `https://wa.me/92${inquiry.phone?.replace(/^0/, '')}?text=${waMessage}`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        {/* WhatsApp quick reply */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => inquiry.status === 'new' && updateStatus('contacted')}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs rounded-lg font-medium transition-colors"
        >
          💬 WhatsApp
        </a>

        {/* Status buttons */}
        {inquiry.status === 'new' && (
          <button
            onClick={() => updateStatus('contacted')}
            disabled={loading}
            className="px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Mark Contacted'}
          </button>
        )}

        {/* Convert — replaces the old "Mark Converted" label-only button */}
        {inquiry.status !== 'closed' && (
          <button
            onClick={convertToBooking}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading
              ? <Loader2 size={12} className="animate-spin" />
              : <ArrowRightCircle size={12} />}
            {inquiry.converted_booking_id ? 'View Booking' : 'Convert to Booking'}
          </button>
        )}

        {inquiry.status !== 'closed' && (
          <button
            onClick={() => updateStatus('closed')}
            disabled={loading}
            className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Close
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}