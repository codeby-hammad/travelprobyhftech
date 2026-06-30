import { NextRequest, NextResponse } from 'next/server'
import Anthropic                     from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const {
      destination,
      days,
      budget,
      travelers,
      travelStyle,
      language,
      departureCity,
      specialRequests,
      includeHotels,
      includeFlights,
      tripType,
    } = await request.json()

    if (!destination || !days) {
      return NextResponse.json(
        { error: 'Destination and days are required' },
        { status: 400 }
      )
    }

    const isUrdu = language === 'ur'

    const systemPrompt = isUrdu
      ? `آپ ایک ماہر سفری ایجنٹ ہیں جو پاکستانی سیاحوں کے لیے مکمل سفری منصوبے بناتے ہیں۔
آپ کا کام ہے کہ ہر سفر کے لیے تفصیلی، عملی اور دلچسپ منصوبہ بنائیں۔
جواب صرف JSON فارمیٹ میں دیں، کوئی اضافی متن نہیں۔`
      : `You are an expert travel agent specializing in creating detailed itineraries for Pakistani travelers.
You have deep knowledge of popular destinations including Turkey, Dubai, Malaysia, Thailand, Baku, Saudi Arabia, Europe, and more.
You understand Pakistani travel preferences, budget ranges in PKR, and halal travel requirements.
Always respond with ONLY valid JSON, no extra text, no markdown backticks.`

    const userPrompt = isUrdu
      ? `درج ذیل تفصیلات کے مطابق مکمل سفری منصوبہ بنائیں:

منزل: ${destination}
دن: ${days}
مسافر: ${travelers} افراد
بجٹ: ${budget ? `PKR ${budget}` : 'معتدل'}
سفر کا انداز: ${travelStyle || 'خاندانی'}
روانگی کا شہر: ${departureCity || 'کراچی'}
سفر کی قسم: ${tripType || 'عام سیاحت'}
خصوصی درخواستیں: ${specialRequests || 'کوئی نہیں'}

درج ذیل JSON ڈھانچے میں جواب دیں:
{
  "title": "سفر کا عنوان",
  "summary": "مختصر تعارف",
  "destination": "${destination}",
  "duration": ${days},
  "totalBudgetMin": 000000,
  "totalBudgetMax": 000000,
  "currency": "PKR",
  "bestTime": "سفر کا بہترین وقت",
  "flightInfo": {
    "airline": "ایئرلائن کا نام",
    "estimatedCost": 00000,
    "duration": "پرواز کا وقت",
    "notes": "نوٹس"
  },
  "days": [
    {
      "day": 1,
      "title": "دن کا عنوان",
      "description": "دن کی مختصر تفصیل",
      "activities": [
        {
          "time": "وقت",
          "activity": "سرگرمی",
          "description": "تفصیل",
          "cost": 0000,
          "tips": "مفید مشورہ"
        }
      ],
      "hotel": {
        "name": "ہوٹل کا نام",
        "area": "علاقہ",
        "stars": 4,
        "estimatedCost": 00000,
        "distanceHaram": null
      },
      "meals": {
        "breakfast": "ناشتہ",
        "lunch": "دوپہر کا کھانا",
        "dinner": "رات کا کھانا"
      },
      "estimatedDayCost": 00000
    }
  ],
  "hotels": [
    {
      "city": "شہر",
      "name": "ہوٹل",
      "stars": 4,
      "nights": 0,
      "estimatedCostPerNight": 00000,
      "highlights": "خصوصیات"
    }
  ],
  "includedServices": ["سروس 1", "سروس 2"],
  "excludedServices": ["سروس 1"],
  "importantNotes": ["اہم نوٹ 1"],
  "visaInfo": {
    "required": true,
    "type": "ویزا کی قسم",
    "processingTime": "پروسیسنگ کا وقت",
    "estimatedFee": 00000
  },
  "packingList": ["ضروری چیز 1", "ضروری چیز 2"],
  "emergencyContacts": {
    "pakistaniEmbassy": "سفارت خانہ نمبر",
    "localEmergency": "مقامی ہنگامی نمبر"
  }
}`
      : `Create a complete travel itinerary with the following details:

Destination: ${destination}
Duration: ${days} days
Travelers: ${travelers} person(s)
Budget: ${budget ? `PKR ${budget}` : 'moderate'}
Travel style: ${travelStyle || 'family'}
Departure city: ${departureCity || 'Karachi'}
Trip type: ${tripType || 'leisure'}
Special requests: ${specialRequests || 'none'}
Include hotels: ${includeHotels ? 'yes' : 'no'}
Include flights: ${includeFlights ? 'yes' : 'no'}

Respond with ONLY this exact JSON structure:
{
  "title": "Trip title",
  "summary": "2-3 sentence summary",
  "destination": "${destination}",
  "duration": ${days},
  "totalBudgetMin": 000000,
  "totalBudgetMax": 000000,
  "currency": "PKR",
  "bestTime": "Best time to visit",
  "flightInfo": {
    "airline": "Recommended airline",
    "estimatedCost": 00000,
    "duration": "Flight duration",
    "notes": "Important flight notes"
  },
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "description": "Brief day overview",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "description": "What to do",
          "cost": 0000,
          "tips": "Helpful tip"
        }
      ],
      "hotel": {
        "name": "Hotel name",
        "area": "Area/district",
        "stars": 4,
        "estimatedCost": 00000,
        "distanceHaram": null
      },
      "meals": {
        "breakfast": "Suggestion",
        "lunch": "Suggestion",
        "dinner": "Suggestion"
      },
      "estimatedDayCost": 00000
    }
  ],
  "hotels": [
    {
      "city": "City",
      "name": "Hotel name",
      "stars": 4,
      "nights": 0,
      "estimatedCostPerNight": 00000,
      "highlights": "Key features"
    }
  ],
  "includedServices": ["Service 1"],
  "excludedServices": ["Service 1"],
  "importantNotes": ["Note 1"],
  "visaInfo": {
    "required": true,
    "type": "Visa type",
    "processingTime": "Processing time",
    "estimatedFee": 00000
  },
  "packingList": ["Item 1", "Item 2"],
  "emergencyContacts": {
    "pakistaniEmbassy": "Embassy number",
    "localEmergency": "Emergency number"
  }
}`

    const message = await client.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 8000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const rawText = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    // Clean and parse JSON
    const cleaned = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    let itinerary
    try {
      itinerary = JSON.parse(cleaned)
    } catch {
      // Try to extract JSON from response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        itinerary = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    return NextResponse.json({ itinerary })

  } catch (err: any) {
    console.error('AI Trip Planner error:', err)
    return NextResponse.json(
      { error: err.message || 'AI service error' },
      { status: 500 }
    )
  }
}