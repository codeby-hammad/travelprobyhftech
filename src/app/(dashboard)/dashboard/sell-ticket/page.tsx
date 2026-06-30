import { createClient }  from '@/lib/supabase/server'
import SellTicketWizard  from '@/components/sell-ticket/SellTicketWizard'

export default async function SellTicketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  const [{ data: clients }, { data: subAgents }, { data: org }] = await Promise.all([
    supabase.from('clients').select('id, full_name, phone, passport_number, nationality, date_of_birth').order('full_name'),
    supabase.from('sub_agents').select('id, name, current_balance, credit_limit').eq('is_active', true).order('name'),
    supabase.from('organizations').select('*').eq('id', orgId).single(),
  ])

  return (
    <div className="p-8 max-w-3xl">
      <SellTicketWizard
        organizationId={orgId}
        organization={org}
        clients={clients   ?? []}
        subAgents={subAgents ?? []}
      />
    </div>
  )
}