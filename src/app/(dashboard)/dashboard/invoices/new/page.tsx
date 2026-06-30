import { createClient }       from '@/lib/supabase/server'
import NewSupplierInvoiceForm from '@/components/supplier-payments/NewSupplierInvoiceForm'

export default async function NewSupplierInvoicePage() {
  const supabase = await createClient()

  const [{ data: suppliers }, { data: bookings }] = await Promise.all([
    // Remove the .in('type',...) filter — get ALL active suppliers
    supabase
      .from('suppliers')
      .select('id, name, type, phone, city')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('bookings')
      .select('id, booking_ref, client:clients(full_name)')
      .in('status', ['confirmed', 'inquiry', 'quoted'])
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  // Debug — remove after fixing
  console.log('Suppliers found:', suppliers?.length, suppliers)

  return (
    <div className="p-8 max-w-2xl">
      <NewSupplierInvoiceForm
        suppliers={suppliers ?? []}
        bookings={bookings   ?? []}
      />
    </div>
  )
}