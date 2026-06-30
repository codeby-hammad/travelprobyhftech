import { createClient }  from '@/lib/supabase/server'
import QuickPaymentForm  from '@/components/supplier-payments/QuickPaymentForm'

export default async function QuickPayPage() {
  const supabase = await createClient()

  const [{ data: suppliers }, { data: invoices }] = await Promise.all([
    // Get ALL active suppliers — no type filter
    supabase
      .from('suppliers')
      .select('id, name, type')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('supplier_invoices')
      .select(`
        id, invoice_number, amount, paid_amount,
        supplier:suppliers(name)
      `)
      .neq('status', 'paid')
      .neq('status', 'cancelled')
      .order('due_date'),
  ])

  return (
    <div className="p-8 max-w-xl">
      <QuickPaymentForm
        suppliers={suppliers ?? []}
        invoices={invoices   ?? []}
      />
    </div>
  )
}