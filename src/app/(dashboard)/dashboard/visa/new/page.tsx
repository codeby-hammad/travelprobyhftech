import { createClient } from '@/lib/supabase/server'
import NewVisaForm      from '@/components/visa/NewVisaForm'

export default async function NewVisaPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string; client_id?: string }>
}) {
  const { booking_id, client_id } = await searchParams
  const supabase = await createClient()

  const [{ data: clients }, { data: bookings }] = await Promise.all([
    supabase.from('clients').select('id, full_name, passport_number').order('full_name'),
    supabase
      .from('bookings')
      .select('id, booking_ref, client_id, client:clients(full_name)')
      .in('status', ['inquiry', 'quoted', 'confirmed'])
      .order('created_at', { ascending: false }),
  ])

  const linkedBooking = booking_id
    ? bookings?.find(b => b.id === booking_id)
    : null

  // client_id in the URL (a specific group passenger) takes priority over
  // the booking's own client_id (which is just the group leader)
  const initialClientId = client_id || linkedBooking?.client_id || ''

  return (
    <div className="p-8 max-w-2xl">
      <NewVisaForm
        clients={clients ?? []}
        bookings={bookings ?? []}
        initialBookingId={linkedBooking?.id ?? ''}
        initialClientId={initialClientId}
      />
    </div>
  )
}