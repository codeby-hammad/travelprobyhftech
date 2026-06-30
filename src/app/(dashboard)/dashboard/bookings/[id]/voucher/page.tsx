import { createClient }   from '@/lib/supabase/server'
import { notFound }       from 'next/navigation'
import VoucherDownload    from '@/components/bookings/VoucherDownload'

export default async function VoucherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const [
    { data: booking  },
    { data: flights  },
    { data: hotels   },
    { data: umrah    },
    { data: payments },
    { data: visas    },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, client:clients(*), package:packages(*), agent:profiles(full_name, email)')
      .eq('id', id)
      .single(),
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
      .from('payments')
      .select('*')
      .eq('booking_id', id)
      .eq('status', 'completed')
      .order('paid_at', { ascending: false }),
    supabase
      .from('visa_applications')
      .select('*, client:clients(full_name)')
      .eq('booking_id', id),
  ])

  if (!booking) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', booking.organization_id)
    .single()

  return (
    <VoucherDownload
      booking={booking}
      organization={org}
      flights={flights   ?? []}
      hotels={hotels     ?? []}
      umrah={umrah}
      payments={payments ?? []}
      visas={visas       ?? []}
    />
  )
}