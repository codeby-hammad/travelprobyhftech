import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ForcePasswordChangeForm from '@/components/auth/ForcePasswordChangeForm'

export default async function ForcePasswordChangePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('must_change_password, full_name')
    .eq('id', user.id)
    .single()

  // If they don't actually need to change password, send them to dashboard
  if (!profile?.must_change_password) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Set a New Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome {profile.full_name?.split(' ')[0]}! For security, please set your own password before continuing.
          </p>
        </div>
        <ForcePasswordChangeForm />
      </div>
    </div>
  )
}