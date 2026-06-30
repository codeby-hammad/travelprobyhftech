import { createClient }  from '@/lib/supabase/server'
import NewBatchForm      from '@/components/inventory/NewBatchForm'

export default async function NewBatchPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, type')
    .in('type', ['airline', 'other'])
    .order('name')

  return (
    <div className="p-8 max-w-2xl">
      <NewBatchForm suppliers={suppliers ?? []} />
    </div>
  )
}