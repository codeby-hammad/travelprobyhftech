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
    const { fullName, phone, email, service, travelDate, passengers, message } = await req.json()

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const orgId = process.env.NEXT_PUBLIC_ORG_ID!

    // Save inquiry to Supabase
    await supabaseAdmin.from('booking_inquiries').insert({
      organization_id: orgId,
      full_name:        fullName,
      email:            email || null,
      phone,
      service_type:     service,
      travel_date:      travelDate || null,
      num_passengers:   passengers,
      message:          message || null,
    })

    // Send confirmation to customer
    if (email) {
      await resend.emails.send({
        from:    'HAMMAD TRAVELERS <onboarding@resend.dev>',
        to:      email,
        subject: 'We received your inquiry — HAMMAD TRAVELERS',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8f6f0;border-radius:12px">
            <h2 style="color:#0a1628;font-family:Georgia,serif">شکریہ، ${fullName}!</h2>
            <p style="color:#374151">JazakAllah Khair for contacting HAMMAD TRAVELERS. We have received your inquiry for <strong>${service}</strong>.</p>
            <p style="color:#374151">Our team will contact you at <strong>${phone}</strong> within 2 hours.</p>
            <p style="color:#374151">For faster service, WhatsApp us at: <strong>0300 123 4567</strong></p>
            <div style="background:#0a1628;color:#c9a84c;padding:16px;border-radius:8px;margin-top:24px;text-align:center;font-weight:bold">
              HAMMAD TRAVELERS — EST. 2005
            </div>
          </div>
        `,
      })
    }

    // Alert agency staff
    await resend.emails.send({
      from:    'TravelPro Alerts <onboarding@resend.dev>',
      to:      'hammadhammad3031@gmail.com',
      subject: `New Inquiry: ${service} — ${fullName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;padding:24px">
          <h3 style="color:#0a1628">New Booking Inquiry</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6b7a99">Name</td><td><strong>${fullName}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#6b7a99">Phone</td><td><strong>${phone}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#6b7a99">Email</td><td>${email || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7a99">Service</td><td>${service}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7a99">Travel Date</td><td>${travelDate || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7a99">Passengers</td><td>${passengers}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7a99">Message</td><td>${message || '—'}</td></tr>
          </table>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Public booking error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}