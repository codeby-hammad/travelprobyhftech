import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Small helper — makes a URL-safe slug right here so we don't depend on utils.ts
function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    + '-' + Date.now()
}

export async function POST(request: NextRequest) {
  // Wrap EVERYTHING in try/catch so we always return JSON, never HTML
  try {

    // Parse the request body safely
    let body: { fullName?: string; agencyName?: string; email?: string; password?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { fullName, agencyName, email, password } = body

    // Validate all fields
    if (!fullName || !agencyName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Create the admin Supabase client
    let admin
    try {
      admin = createAdminClient()
    } catch (e) {
      console.error('Failed to create admin client:', e)
      return NextResponse.json(
        { error: 'Server configuration error. Check SUPABASE_SERVICE_ROLE_KEY in .env.local' },
        { status: 500 }
      )
    }

    // Step 1 — Create the organization
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: agencyName,
        slug: makeSlug(agencyName),
        plan: 'starter',
      })
      .select()
      .single()

    if (orgError) {
      console.error('Org creation failed:', orgError)
      return NextResponse.json(
        { error: 'Could not create organization: ' + orgError.message },
        { status: 400 }
      )
    }

    // Step 2 — Create the auth user
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
      console.error('User creation failed:', authError)
      // Roll back: delete the org we just made
      await admin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: 'Could not create user: ' + authError.message },
        { status: 400 }
      )
    }

    // Step 3 — Create profile manually (don't rely on trigger)
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id:              authData.user.id,
        organization_id: org.id,
        full_name:       fullName,
        email:           email,
        role:            'agency_admin',
      })

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      // Still return success — user can log in, profile issue is fixable
      console.warn('User created but profile failed — will need manual fix')
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    // This catches anything we missed above
    console.error('Unhandled register error:', err)
    return NextResponse.json(
      { error: 'Unexpected server error. Check terminal for details.' },
      { status: 500 }
    )
  }
}