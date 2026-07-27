import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Google OAuth lands here after the user authenticates. We exchange the
// code for a session, make sure a `customers` row exists for this org, then
// bounce back to the org's homepage — the client picks up
// sessionStorage's pending package id (set right before the redirect) to
// reopen the booking flow exactly where the customer left off.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

      if (org) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', data.user.id)
          .eq('organization_id', org.id)
          .maybeSingle()

        if (!existing) {
          await supabase.from('customers').insert({
            auth_user_id:    data.user.id,
            organization_id: org.id,
            full_name:       data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
            email:           data.user.email ?? null,
          })
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/${slug}?resumeBooking=1`)
}