import { createClient } from '@/lib/supabase/server'
import ProfileForm       from '@/components/settings/ProfileForm'
import OrganizationForm  from '@/components/settings/OrganizationForm'
import TeamSection       from '@/components/settings/TeamSection'
import { requirePermission } from '@/lib/requirePermission'


export default async function SettingsPage() {
    await requirePermission('settings')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: teamMembers }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('organization_id',
        (await supabase.from('profiles').select('organization_id').eq('id', user!.id).single())
          .data?.organization_id
      )
      .order('created_at'),
  ])

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile and agency settings</p>
      </div>

      <div className="space-y-6">
        <ProfileForm      profile={profile} />
        <OrganizationForm organization={profile?.organization} isAdmin={profile?.role === 'agency_admin'} />
        <TeamSection      members={teamMembers ?? []} currentUserId={user!.id} orgId={profile?.organization_id} />
      </div>
    </div>
  )
}