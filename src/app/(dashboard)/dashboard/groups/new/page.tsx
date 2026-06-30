import { createClient }  from '@/lib/supabase/server'
import NewGroupForm       from '@/components/groups/NewGroupForm'

export default async function NewGroupPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: packages }] = await Promise.all([
    supabase.from('clients').select('id, full_name, phone').order('full_name'),
    supabase.from('packages').select('id, name, destination, base_price, currency').eq('is_active', true).order('name'),
  ])

  return (
    <div className="p-8 max-w-3xl">
      <NewGroupForm clients={clients ?? []} packages={packages ?? []} />
    </div>
  )
}