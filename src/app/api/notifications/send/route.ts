import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }         from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      bookingId,
      clientId,
      type,
      channel,
      recipientEmail,
      recipientPhone,
      subject,
      body: messageBody,
      createdBy,
    } = body

    if (!messageBody || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Always log the notification
    const { data: notification, error: logError } = await admin
      .from('notifications')
      .insert({
        organization_id: organizationId,
        booking_id:      bookingId      || null,
        client_id:       clientId       || null,
        type:            type           || 'custom',
        channel,
        recipient_email: recipientEmail || null,
        recipient_phone: recipientPhone || null,
        subject:         subject        || null,
        body:            messageBody,
        status:          'pending',
        created_by:      createdBy      || null,
      })
      .select()
      .single()

    if (logError) {
      console.error('Log error:', logError)
      return NextResponse.json({ error: logError.message }, { status: 400 })
    }

    // ── EMAIL ──────────────────────────────────────────────
    if (channel === 'email') {
      if (!recipientEmail) {
        return NextResponse.json(
          { error: 'Client has no email address saved' },
          { status: 400 }
        )
      }

      const apiKey = process.env.RESEND_API_KEY

      if (!apiKey) {
        // No API key — still mark as logged, return whatsapp fallback tip
        await admin.from('notifications').update({
          status:        'failed',
          error_message: 'RESEND_API_KEY not set in .env.local',
        }).eq('id', notification.id)

        return NextResponse.json({
          error: 'Email not configured. Add RESEND_API_KEY to .env.local — get a free key at resend.com',
        }, { status: 500 })
      }

      try {
        // Call Resend REST API directly (no SDK needed)
        const res = await fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            from:    'TravelPro <onboarding@resend.dev>',  // works without domain verification
            to:      [recipientEmail],
            subject: subject || 'Message from your travel agency',
            html:    buildEmailHTML(messageBody, subject || ''),
          }),
        })

        const result = await res.json()

        if (!res.ok) {
          throw new Error(result.message || 'Email send failed')
        }

        await admin.from('notifications').update({
          status:  'sent',
          sent_at: new Date().toISOString(),
        }).eq('id', notification.id)

        return NextResponse.json({
          success: true,
          message: `Email sent to ${recipientEmail}`,
          id:      notification.id,
        })

      } catch (emailErr: any) {
        console.error('Email error:', emailErr)

        await admin.from('notifications').update({
          status:        'failed',
          error_message: emailErr.message,
        }).eq('id', notification.id)

        return NextResponse.json(
          { error: 'Email failed: ' + emailErr.message },
          { status: 500 }
        )
      }
    }

    // ── WHATSAPP ───────────────────────────────────────────
    if (channel === 'whatsapp') {
      if (!recipientPhone) {
        return NextResponse.json(
          { error: 'Client has no phone number saved' },
          { status: 400 }
        )
      }

      // Clean phone number — remove spaces, dashes, brackets
      const cleanPhone = recipientPhone.replace(/[\s\-\(\)]/g, '')

      // Add Pakistan country code if not present
      const phone = cleanPhone.startsWith('+')
        ? cleanPhone.replace('+', '')
        : cleanPhone.startsWith('0')
          ? '92' + cleanPhone.slice(1)
          : '92' + cleanPhone

      // WhatsApp click-to-chat URL — opens WhatsApp with message pre-filled
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messageBody)}`

      // Mark as sent (agent opens WhatsApp manually)
      await admin.from('notifications').update({
        status:  'sent',
        sent_at: new Date().toISOString(),
      }).eq('id', notification.id)

      return NextResponse.json({
        success:      true,
        whatsappUrl,
        message:      'WhatsApp link ready',
        id:           notification.id,
      })
    }

    // Other channels — just mark as sent
    await admin.from('notifications').update({
      status:  'sent',
      sent_at: new Date().toISOString(),
    }).eq('id', notification.id)

    return NextResponse.json({ success: true, id: notification.id })

  } catch (err: any) {
    console.error('Notification route error:', err)
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}

function buildEmailHTML(body: string, subject: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <tr>
        <td style="background:#1d4ed8;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">✈️ TravelPro</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Your trusted travel partner</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px;">
          ${subject ? `<h2 style="margin:0 0 20px;color:#111827;font-size:18px;">${subject}</h2>` : ''}
          <div style="color:#374151;font-size:15px;line-height:1.8;">${escaped}</div>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Sent via TravelPro • Contact your travel agent for any questions
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}