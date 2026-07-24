import { createClient }       from '@/lib/supabase/server'
import { getUserPermissions, can } from '@/lib/permissions'
import { redirect }           from 'next/navigation'
import Link                   from 'next/link'
import { ArrowLeft }          from 'lucide-react'
import RolesEditor            from '@/components/staff/RolesEditor'
import { requirePermission } from '@/lib/requirePermission'


export default async function RolesPage() {
    await requirePermission('staff')

  const perms = await getUserPermissions()
  if (!can(perms, 'staff')) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const [{ data: roles }, { data: permissions }] = await Promise.all([
    supabase
      .from('staff_roles')
      .select('*')
      .eq('organization_id', profile!.organization_id)
      .order('name'),
    supabase
      .from('role_permissions')
      .select('*')
      .in('role_id', (await supabase
        .from('staff_roles')
        .select('id')
        .eq('organization_id', profile!.organization_id)
      ).data?.map(r => r.id) ?? []),
  ])

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/staff" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm">
            Control what each role can see and do
          </p>
        </div>
      </div>
      <RolesEditor
        roles={roles ?? []}
        permissions={permissions ?? []}
        organizationId={profile!.organization_id}
      />
    </div>
  )
}