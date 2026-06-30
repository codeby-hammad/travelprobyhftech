import { NextRequest, NextResponse } from 'next/server'
import Anthropic                     from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { booking, client: clientData, organization, language } = await request.json()

    const isUrdu = language === 'ur'

    const prompt = isUrdu
      ? `آپ ایک پیشہ ورانہ سفری ایجنٹ ہیں۔ درج ذیل بکنگ کی تفصیلات کی بنیاد پر ایک مکمل اور پیشہ ورانہ کوٹیشن خط لکھیں۔ خط اردو میں لکھیں۔

بکنگ کی تفصیلات:
- بکنگ نمبر: ${booking.booking_ref}
- کلائنٹ: ${clientData?.full_name}
- منزل: ${booking.package?.destination ?? 'N/A'}
- پیکیج: ${booking.package?.name ?? 'کسٹم'}
- سفر کی تاریخ: ${booking.travel_date ?? 'N/A'}
- واپسی: ${booking.return_date ?? 'N/A'}
- مسافر: ${booking.num_passengers}
- کل رقم: PKR ${booking.total_amount?.toLocaleString()}
- جمع رقم: PKR ${booking.paid_amount?.toLocaleString()}
- باقی رقم: PKR ${(booking.total_amount - booking.paid_amount)?.toLocaleString()}

صرف خط کا متن لکھیں، کوئی اضافی وضاحت نہیں۔`
      : `You are a professional travel agent. Write a formal quotation letter based on these booking details.

Booking details:
- Reference: ${booking.booking_ref}
- Client: ${clientData?.full_name}
- Destination: ${booking.package?.destination ?? 'N/A'}
- Package: ${booking.package?.name ?? 'Custom'}
- Travel date: ${booking.travel_date ?? 'N/A'}
- Return: ${booking.return_date ?? 'N/A'}
- Passengers: ${booking.num_passengers}
- Total amount: PKR ${booking.total_amount?.toLocaleString()}
- Paid: PKR ${booking.paid_amount?.toLocaleString()}
- Balance: PKR ${(booking.total_amount - booking.paid_amount)?.toLocaleString()}
- Agency: ${organization?.name ?? 'Travel Agency'}

Write a professional, warm quotation/confirmation letter. Include all booking details clearly.
Write ONLY the letter text, ready to copy-paste or send. No extra explanation.`

    const message = await client.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 1500,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    return NextResponse.json({ text })

  } catch (err: any) {
    console.error('Quote writer error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}