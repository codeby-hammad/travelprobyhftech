import { createClient } from '@/lib/supabase/server'
import NewQuotationForm from '@/components/quotations/NewQuotationForm'

export default async function NewQuotationPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: packages }] = await Promise.all([
    supabase.from('clients').select('id, full_name, email, phone').order('full_name'),
    supabase.from('packages').select('id, name, destination, price').order('name'),
  ])

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New Quotation</h1>
      <p className="text-gray-500 text-sm mb-6">Build a quote for a client or new lead</p>

      <NewQuotationForm clients={clients ?? []} packages={packages ?? []} />
    </div>
  )
}