'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { PilgrimDetail } from './PilgrimDetailsStep'
import type { QuestionnaireAnswers } from './QuestionnaireStep'

type Tier = 'quad' | 'triple' | 'double'

export type ReviewSubmitPayload = {
  organizationId: string
  packageId: string          // package the customer first clicked "Book Now" on
  selectedPackageId: string  // the specific hotel-variant package chosen in Accommodation
  roomTier: Tier
  pricePerPilgrim: number
  currency: string
  customerId: string | null
  pilgrims: { adult: number; child: number; infant: number }
  pilgrimDetails: PilgrimDetail[]
  questionnaire: QuestionnaireAnswers
}

export default function ReviewSubmitStep({
  payload,
  packageName,
  hotelSummary,
  onBack,
}: {
  payload: ReviewSubmitPayload
  packageName: string
  hotelSummary: string
  onBack: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const payingPilgrims = payload.pilgrims.adult + payload.pilgrims.child
  const totalPrice = payload.pricePerPilgrim * payingPilgrims

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/public/umrah-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, totalPrice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong, please try again.')
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong, please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-black/06 p-6 sm:p-12 text-center max-w-xl mx-auto">
        <CheckCircle2 className="mx-auto mb-4 text-[#0a1628]" size={44} />
        <h3 className="font-playfair text-xl font-bold text-[#1a2744] mb-2">
          Your Umrah query has been received
        </h3>
        <p className="text-[#6b7a99] text-sm">
          One of our Umrah advisors will contact you shortly to confirm your booking and next steps.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl w-full">
      <div className="bg-white rounded-xl border border-black/06 p-4 sm:p-6 mb-4">
        <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Package</p>
        <p className="text-[#1a2744] font-semibold">{packageName}</p>
        <p className="text-[#6b7a99] text-sm mt-1">{hotelSummary}</p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/06">
          <span className="text-sm text-[#6b7a99]">
            {payingPilgrims} pilgrim{payingPilgrims !== 1 ? 's' : ''}
            {payload.pilgrims.infant > 0 ? ` + ${payload.pilgrims.infant} infant${payload.pilgrims.infant > 1 ? 's' : ''}` : ''}
            {' '}× {payload.currency} {payload.pricePerPilgrim.toLocaleString()}
          </span>
          <span className="font-playfair text-xl font-bold text-[#1a2744]">
            {payload.currency} {totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-black/06 p-4 sm:p-6 mb-4">
        <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Pilgrims</p>
        <div className="space-y-2">
          {payload.pilgrimDetails.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-3 flex-wrap text-sm">
              <span className="text-[#1a2744]">{p.slotLabel} — {p.title} {p.firstName} {p.familyName}</span>
              <span className="text-[#6b7a99] text-xs">{p.passportNumber || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-black/06 p-4 sm:p-6 mb-6">
        <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Questionnaire Summary</p>
        <div className="text-sm text-[#1a2744] space-y-1.5">
          <p>Emergency contact: {payload.questionnaire.emergencyContactName} ({payload.questionnaire.emergencyContactPhone})</p>
          <p>Medical condition: {payload.questionnaire.hasMedicalCondition ? 'Yes' : 'No'}</p>
          <p>Mobility assistance needed: {payload.questionnaire.needsMobilityAssistance ? 'Yes' : 'No'}</p>
          <p>Prior visa refusal: {payload.questionnaire.hasPriorVisaRefusal ? 'Yes' : 'No'}</p>
          {payload.questionnaire.specialRequests && (
            <p>Special requests: {payload.questionnaire.specialRequests}</p>
          )}
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-red-500 text-xs mb-4">
          <AlertCircle size={13} /> {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 border border-black/10 text-[#1a2744] font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0a1628] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? 'Submitting...' : 'Submit Umrah Query'}
        </button>
      </div>
    </div>
  )
}