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
    const body = await req.json()
    const {
      organizationId,
      packageId,
      selectedPackageId,
      roomTier,
      pricePerPilgrim,
      currency,
      customerId,
      pilgrims,
      pilgrimDetails,
      questionnaire,
      totalPrice,
    } = body

    if (!organizationId || !selectedPackageId || !pilgrimDetails?.length) {
      return NextResponse.json({ error: 'Missing required booking details' }, { status: 400 })
    }

    const lead = pilgrimDetails[0]
    if (!lead?.email || !lead?.phone) {
      return NextResponse.json({ error: 'Lead pilgrim contact details are required' }, { status: 400 })
    }

    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from('umrah_inquiries')
      .insert({
        organization_id:       organizationId,
        package_id:            packageId,
        selected_package_id:   selectedPackageId,
        room_tier:             roomTier ?? null,
        price_per_pilgrim:     pricePerPilgrim ?? null,
        total_price:           totalPrice ?? null,
        currency:              currency ?? 'PKR',
        customer_id:           customerId ?? null,
        pilgrims_adult:        pilgrims?.adult  ?? 0,
        pilgrims_child:        pilgrims?.child  ?? 0,
        pilgrims_infant:       pilgrims?.infant ?? 0,
        pilgrim_details:       pilgrimDetails,
        questionnaire:         questionnaire ?? null,
        primary_contact_name:  `${lead.firstName ?? ''} ${lead.familyName ?? ''}`.trim(),
        primary_contact_email: lead.email,
        primary_contact_phone: lead.phone,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    // Best-effort notifications — a failed email should never block the
    // customer's submission from succeeding
    try {
      await resend.emails.send({
        from:    'HAMMAD TRAVELERS <onboarding@resend.dev>',
        to:      lead.email,
        subject: 'We received your Umrah query — HAMMAD TRAVELERS',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8f6f0;border-radius:12px">
            <h2 style="color:#0a1628;font-family:Georgia,serif">شکریہ، ${lead.firstName}!</h2>
            <p style="color:#374151">JazakAllah Khair for your Umrah query with HAMMAD TRAVELERS. Our team is reviewing your details.</p>
            <p style="color:#374151">We will contact you at <strong>${lead.phone}</strong> shortly to confirm your booking.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Umrah inquiry confirmation email failed:', emailErr)
    }

    try {
      await resend.emails.send({
        from:    'TravelPro Alerts <onboarding@resend.dev>',
        to:      'hammadhammad3031@gmail.com',
        subject: `New Umrah Query — ${lead.firstName} ${lead.familyName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;padding:24px">
            <h3 style="color:#0a1628">New Umrah Query</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7a99">Lead Pilgrim</td><td><strong>${lead.firstName} ${lead.familyName}</strong></td></tr>
              <tr><td style="padding:8px 0;color:#6b7a99">Phone</td><td>${lead.phone}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7a99">Email</td><td>${lead.email}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7a99">Pilgrims</td><td>${pilgrims?.adult ?? 0} Adult, ${pilgrims?.child ?? 0} Child, ${pilgrims?.infant ?? 0} Infant</td></tr>
              <tr><td style="padding:8px 0;color:#6b7a99">Room Tier</td><td>${roomTier ?? '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7a99">Total Price</td><td>${currency ?? 'PKR'} ${totalPrice?.toLocaleString?.() ?? totalPrice ?? '—'}</td></tr>
            </table>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Umrah inquiry staff alert email failed:', emailErr)
    }

    return NextResponse.json({ success: true, id: inquiry.id })
  } catch (err: any) {
    console.error('Public umrah inquiry error:', err)
    return NextResponse.json({ error: err.message ?? 'Submission failed' }, { status: 500 })
  }
}