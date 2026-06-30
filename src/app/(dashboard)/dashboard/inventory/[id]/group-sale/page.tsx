import { createClient }  from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import GroupSaleForm     from '@/components/inventory/GroupSaleForm'

export default async function GroupSalePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const [
    { data: batch   },
    { data: pricing },
    { data: clients },
    { data: seats   },
  ] = await Promise.all([
    supabase
      .from('ticket_batches')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('ticket_batch_pricing')
      .select('*')
      .eq('batch_id', id)
      .order('age_category'),
    supabase
      .from('clients')
      .select('id, full_name, phone, passport_number, nationality, date_of_birth')
      .order('full_name'),
    supabase
      .from('ticket_seats')
      .select('id, seat_number, status')
      .eq('batch_id', id)
      .eq('status', 'available')
      .order('created_at'),
  ])

  if (!batch) notFound()

  return (
    <div className="p-8 max-w-4xl">
      <GroupSaleForm
        batch={batch}
        pricing={pricing ?? []}
        clients={clients ?? []}
        availableSeats={seats ?? []}
      />
    </div>
  )
}