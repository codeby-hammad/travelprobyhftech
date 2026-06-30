import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, role, orgId } = await request.json()

    if (!email || !role || !orgId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Create user with a temporary password — they can reset it
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password:       tempPassword,
      email_confirm:  true,
      user_metadata: {
        full_name:       email.split('@')[0],
        organization_id: orgId,
        role,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile manually in case trigger doesn't fire
    await admin.from('profiles').upsert({
      id:              authData.user.id,
      organization_id: orgId,
      full_name:       email.split('@')[0],
      email,
      role,
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}