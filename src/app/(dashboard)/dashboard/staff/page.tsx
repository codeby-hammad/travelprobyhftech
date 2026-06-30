import { createClient }    from '@/lib/supabase/server'
import { getUserPermissions, can } from '@/lib/permissions'
import { redirect }        from 'next/navigation'
import Link                from 'next/link'
import { Plus, UserCog }   from 'lucide-react'
import StaffList           from '@/components/staff/StaffList'
import DeleteStaffButton from './DeleteStaffButton'


export default async function StaffPage() {
  const perms = await getUserPermissions()
  if (!can(perms, 'staff')) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const [{ data: staff }, { data: roles }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, role:staff_roles(name, description)')
      .eq('organization_id', profile!.organization_id)
      .order('full_name'),
    supabase
      .from('staff_roles')
      .select('*')
      .eq('organization_id', profile!.organization_id)
      .order('name'),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog size={22} className="text-blue-600" />
            Staff & Roles
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {staff?.length ?? 0} staff members • {roles?.length ?? 0} roles
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/staff/roles"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
            Manage roles
          </Link>
          <Link href="/dashboard/settings"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <Plus size={16} /> Invite staff
          </Link>
        </div>
      </div>

      <StaffList
        staff={staff ?? []}
        roles={roles ?? []}
        currentUserId={user!.id}
      />
  
    </div>
  )
}