import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, name, tempPassword, orgId } = await req.json()

    if (!email || !name || !tempPassword || !orgId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError) throw authError

    const userId = authData.user.id

    // 2. Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        org_id: orgId,
        full_name: name,
        email,
        is_owner: false,
      })

    if (profileError) throw profileError

    // 3. Assign default role
    const { data: defaultRole } = await supabaseAdmin
      .from('staff_roles')
      .select('id')
      .eq('org_id', orgId)
      .eq('name', 'Booking Agent')
      .single()

    if (defaultRole) {
      await supabaseAdmin
        .from('profiles')
        .update({ role_id: defaultRole.id })
        .eq('id', userId)
    }

    // 4. Send email — no domain needed, onboarding@resend.dev works on localhost
    const { error: emailError } = await resend.emails.send({
      from: 'HAMMAD TRAVELERS <onboarding@resend.dev>',
      to: email,   // any real email address works
      subject: 'Your TravelPro Staff Account',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
              
              <h2 style="color: #1e40af; margin: 0 0 4px;">HAMMAD TRAVELERS</h2>
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 28px;">TravelPro Staff Portal</p>

              <p style="color: #111827; font-size: 15px; margin: 0 0 8px;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Your staff account has been created on TravelPro. 
                Use the credentials below to log in.
              </p>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                  Login Credentials
                </p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">
                  <span style="color: #6b7280;">Email:</span>&nbsp;
                  <strong>${email}</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #111827;">
                  <span style="color: #6b7280;">Password:</span>&nbsp;
                  <strong style="font-family: monospace; background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px;">
                    ${tempPassword}
                  </strong>
                </p>
              </div>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
                style="display: block; background: #2563eb; color: white; text-align: center; padding: 13px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin-bottom: 24px;">
                Log in to TravelPro →
              </a>

              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
                Please change your password after your first login.<br/>
                If you have any issues, contact your manager directly.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('Email failed:', emailError)
      // Account still created — just warn
      return NextResponse.json({
        success: true,
        emailSent: false,
        warning: 'Account created but email failed. Share credentials manually.',
      })
    }

    return NextResponse.json({ success: true, emailSent: true })

  } catch (err: any) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}