import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import EditBookingForm  from '@/components/bookings/EditBookingForm'

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const [{ data: booking }, { data: clients }, { data: packages }] = await Promise.all([
    supabase.from('bookings').select('*').eq('id', id).single(),
    supabase.from('clients').select('*').order('full_name'),
    supabase.from('packages').select('*').eq('is_active', true).order('name'),
  ])

  if (!booking) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <EditBookingForm booking={booking} clients={clients ?? []} packages={packages ?? []} />
    </div>
  )
}