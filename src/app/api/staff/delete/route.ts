import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(req: NextRequest) {
  try {
    const { staffId } = await req.json()

    if (!staffId) {
      return NextResponse.json({ error: 'Missing staffId' }, { status: 400 })
    }

    // Safety: never delete an owner
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_owner, full_name')
      .eq('id', staffId)
      .single()

    if (profileError) throw new Error('Staff member not found')
    if (profile.is_owner) {
      return NextResponse.json({ error: 'Cannot delete an owner account' }, { status: 403 })
    }

    // 1. Delete profile row (cascades FK-linked data)
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', staffId)

    if (deleteProfileError) throw deleteProfileError

    // 2. Delete auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(staffId)

    if (deleteAuthError) throw deleteAuthError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete staff error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}