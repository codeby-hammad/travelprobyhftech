import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, role, orgId } = await request.json()

    if (!email || !role || !orgId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Create user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    const fullName = email.split('@')[0]

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password:      tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name:       fullName,
        organization_id: orgId,
        role,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile manually in case trigger doesn't fire
    const { error: profileError } = await admin.from('profiles').upsert({
      id:                    authData.user.id,
      organization_id:       orgId,
      full_name:             fullName,
      email,
      role,
      must_change_password:  true,
    })

    if (profileError) {
      console.error('Profile upsert failed:', profileError)
    }

    // Send credentials email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const { error: emailError } = await resend.emails.send({
      from: 'HAMMAD TRAVELERS <onboarding@resend.dev>',
      to: email,
      subject: 'Your TravelPro Staff Account',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1e40af; margin: 0 0 4px;">HAMMAD TRAVELERS</h2>
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 28px;">TravelPro Staff Portal</p>

              <p style="color: #111827; font-size: 15px; margin: 0 0 8px;">Hi <strong>${fullName}</strong>,</p>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Your staff account has been created on TravelPro as <strong>${role.replace('_', ' ')}</strong>.
                Use the credentials below to log in.
              </p>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                  Login Credentials
                </p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">
                  <span style="color: #6b7280;">Email:</span>&nbsp;<strong>${email}</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #111827;">
                  <span style="color: #6b7280;">Password:</span>&nbsp;
                  <strong style="font-family: monospace; background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 4px;">
                    ${tempPassword}
                  </strong>
                </p>
              </div>

              <a href="${appUrl}/login"
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
      console.error('Email send failed:', emailError)
      return NextResponse.json({
        success: true,
        emailSent: false,
        warning: 'Account created but email failed to send. Share credentials manually.',
        tempPassword, // so the caller can at least show it
      })
    }

    return NextResponse.json({ success: true, emailSent: true })

  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}