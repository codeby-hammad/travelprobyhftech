import ManualEntryForm from '@/components/ledger/ManualEntryForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewEntryPage() {
  const supabase = await createClient()
  const [{ data: clients }, { data: subAgents }, { data: suppliers }] =
    await Promise.all([
      supabase.from('clients').select('id, full_name').order('full_name'),
      supabase.from('sub_agents').select('id, name').order('name'),
      supabase.from('suppliers').select('id, name').order('name'),
    ])

  return (
    <div className="p-8 max-w-2xl">
      <ManualEntryForm
        clients={clients   ?? []}
        subAgents={subAgents ?? []}
        suppliers={suppliers ?? []}
      />
    </div>
  )
}