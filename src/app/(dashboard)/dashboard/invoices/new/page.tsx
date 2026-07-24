import { createClient }  from '@/lib/supabase/server'
import CreateInvoiceForm from '@/components/invoices/CreateInvoiceForm'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string }>
}) {
  const { booking_id } = await searchParams
  const supabase = await createClient()

  const [{ data: bookings }, { data: booking }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, booking_ref, total_amount, paid_amount, currency, client:clients(full_name)')
      .in('status', ['confirmed', 'quoted', 'inquiry'])
      .order('created_at', { ascending: false }),
    booking_id
      ? supabase
          .from('bookings')
          .select('*, client:clients(*), package:packages(name)')
          .eq('id', booking_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  return (
    <div className="p-8 max-w-3xl">
      <CreateInvoiceForm
        bookings={bookings ?? []}
        preselectedBooking={booking}
      />
    </div>
  )
}