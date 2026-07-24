import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    + '-' + Date.now()
}

export async function POST(request: NextRequest) {
  try {
    let body: { fullName?: string; agencyName?: string; email?: string; password?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { fullName, agencyName, email, password } = body

    if (!fullName || !agencyName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    let admin
    try {
      admin = createAdminClient()
    } catch (e) {
      console.error('Failed to create admin client:', e)
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

    // Step 1 — Create organization
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: agencyName, slug: makeSlug(agencyName), plan: 'starter' })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: 'Could not create organization: ' + orgError.message }, { status: 400 })
    }

    // Step 2 — Seed default roles for this org
    const { error: rolesError } = await admin.rpc('create_default_roles', {
      org_id: org.id,
    })
    if (rolesError) {
      console.error('Default roles creation failed:', rolesError)
      // Non-fatal — continue
    }

    // Step 3 — Seed default accounts (chart of accounts)
    const { error: accountsError } = await admin.rpc('create_default_accounts', {
      org_id: org.id,
    })
    if (accountsError) {
      console.error('Default accounts creation failed:', accountsError)
      // Non-fatal — continue
    }

    // Step 4 — Get the Owner role ID we just created
    const { data: ownerRole } = await admin
      .from('staff_roles')
      .select('id')
      .eq('organization_id', org.id)
      .eq('name', 'Owner')
      .single()

    // Step 5 — Create the auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name:       fullName,
        organization_id: org.id,
        role:            'agency_admin',
      },
    })

    if (authError) {
      // Roll back org
      await admin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: 'Could not create user: ' + authError.message }, { status: 400 })
    }

    // Step 6 — Create profile with role_id + is_owner
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id:              authData.user.id,
        organization_id: org.id,
        full_name:       fullName,
        email,
        role:            'agency_admin',
        is_owner:        true,
        role_id:         ownerRole?.id ?? null,
      })

    if (profileError) {
      console.error('Profile creation failed:', profileError)
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Unhandled register error:', err)
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 })
  }
}