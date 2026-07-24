'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function QuoteActions({ quote }: { quote: any }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(status)
    setError(null)
    await supabase.from('quotations').update({ status }).eq('id', quote.id)
    setLoading(null)
    router.refresh()
  }

  async function convertLeadToClient() {
    setLoading('convertLead')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single()

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          organization_id: profile?.organization_id,
          full_name: quote.lead_name,
          email: quote.lead_email,
          phone: quote.lead_phone,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Link the quote to the newly created client
      const { error: linkError } = await supabase
        .from('quotations')
        .update({ client_id: client.id })
        .eq('id', quote.id)

      if (linkError) throw linkError

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  async function convertToBooking() {
    setLoading('convert')
    setError(null)

    try {
      if (!quote.client_id) {
        setError('Convert this lead to a client first.')
        setLoading(null)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single()

      const { data: booking, error: bookingError } = await supabase
  .from('bookings')
  .insert({
    organization_id: profile?.organization_id,
    client_id: quote.client_id,
    package_id: quote.package_id,
    travel_date: quote.travel_date,
    status: 'confirmed',
    total_amount: quote.total,
    notes: `Converted from quotation ${quote.quote_number}`,
    agent_id: user?.id,
  })
  .select()
  .single()

      if (bookingError) throw bookingError

      await supabase
        .from('quotations')
        .update({ status: 'converted', converted_booking_id: booking.id })
        .eq('id', quote.id)

      router.push(`/dashboard/bookings/${booking.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  if (quote.status === 'converted') {
    return (
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-700">
        This quote has been converted to a booking.
      </div>
    )
  }

  // Lead that hasn't been converted to a client yet, but quote is accepted
  const needsClientConversion = !quote.client_id && quote.status === 'accepted'

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Actions</h3>

      {needsClientConversion && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-800">
            This quote is for a lead. Convert <strong>{quote.lead_name}</strong> to a client record to proceed with booking.
          </p>
          <button
            onClick={convertLeadToClient}
            disabled={loading !== null}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading === 'convertLead' && <Loader2 size={12} className="animate-spin" />}
            Convert to Client
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {quote.status === 'draft' && (
          <button
            onClick={() => updateStatus('sent')}
            disabled={loading !== null}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading === 'sent' && <Loader2 size={14} className="animate-spin" />}
            Mark as Sent
          </button>
        )}

        {(quote.status === 'sent' || quote.status === 'draft') && (
          <>
            <button
              onClick={() => updateStatus('accepted')}
              disabled={loading !== null}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50"
            >
              Mark as Accepted
            </button>
            <button
              onClick={() => updateStatus('declined')}
              disabled={loading !== null}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-lg disabled:opacity-50"
            >
              Mark as Declined
            </button>
          </>
        )}

        {quote.status === 'accepted' && quote.client_id && (
          <button
            onClick={convertToBooking}
            disabled={loading !== null}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading === 'convert' && <Loader2 size={14} className="animate-spin" />}
            Convert to Booking
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}