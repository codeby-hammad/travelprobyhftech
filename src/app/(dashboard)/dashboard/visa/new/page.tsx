import { createClient } from '@/lib/supabase/server'
import NewVisaForm      from '@/components/visa/NewVisaForm'

export default async function NewVisaPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: bookings }] = await Promise.all([
    supabase.from('clients').select('id, full_name, passport_number').order('full_name'),
    supabase
      .from('bookings')
      .select('id, booking_ref, client:clients(full_name)')
      .in('status', ['inquiry','quoted','confirmed'])
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-8 max-w-2xl">
      <NewVisaForm clients={clients ?? []} bookings={bookings ?? []} />
    </div>
  )
}