'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

export type QuestionnaireAnswers = {
  emergencyContactName: string
  emergencyContactPhone: string
  hasMedicalCondition: boolean
  medicalConditionDetails: string
  needsMobilityAssistance: boolean
  dietaryRequirements: string
  hasPriorVisaRefusal: boolean
  priorVisaRefusalDetails: string
  specialRequests: string
  agreedToTerms: boolean
}

const EMPTY_ANSWERS: QuestionnaireAnswers = {
  emergencyContactName: '',
  emergencyContactPhone: '',
  hasMedicalCondition: false,
  medicalConditionDetails: '',
  needsMobilityAssistance: false,
  dietaryRequirements: '',
  hasPriorVisaRefusal: false,
  priorVisaRefusalDetails: '',
  specialRequests: '',
  agreedToTerms: false,
}

function YesNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[{ label: 'No', v: false }, { label: 'Yes', v: true }].map(opt => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.v)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            value === opt.v
              ? 'bg-[#0a1628] text-white border-[#0a1628]'
              : 'bg-white text-[#6b7a99] border-black/10 hover:border-black/20'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function QuestionnaireStep({
  onBack,
  onComplete,
}: {
  onBack: () => void
  onComplete: (answers: QuestionnaireAnswers) => void
}) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(EMPTY_ANSWERS)
  const [showErrors, setShowErrors] = useState(false)

  function set<K extends keyof QuestionnaireAnswers>(key: K, value: QuestionnaireAnswers[K]) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  const missingRequired =
    !answers.emergencyContactName.trim() ||
    !answers.emergencyContactPhone.trim() ||
    !answers.agreedToTerms

  function handleNext() {
    if (missingRequired) {
      setShowErrors(true)
      return
    }
    onComplete(answers)
  }

  return (
    <div className="bg-white rounded-xl border border-black/06 p-4 sm:p-6 max-w-2xl w-full">
      <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-4">
        Emergency Contact
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
        <div>
          <label className="block text-[13px] font-medium text-[#1a2744] mb-1.5">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            value={answers.emergencyContactName}
            onChange={e => set('emergencyContactName', e.target.value)}
            placeholder="Full name"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none ${
              showErrors && !answers.emergencyContactName.trim() ? 'border-red-300 bg-red-50/40' : 'border-black/10'
            }`}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#1a2744] mb-1.5">
            Contact Phone <span className="text-red-500">*</span>
          </label>
          <input
            value={answers.emergencyContactPhone}
            onChange={e => set('emergencyContactPhone', e.target.value)}
            placeholder="+92 3XX XXXXXXX"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none ${
              showErrors && !answers.emergencyContactPhone.trim() ? 'border-red-300 bg-red-50/40' : 'border-black/10'
            }`}
          />
        </div>
      </div>

      <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-4">
        Health & Accessibility
      </p>
      <div className="space-y-5 mb-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm text-[#1a2744]">Does any pilgrim have a medical condition requiring attention?</span>
          <YesNoToggle value={answers.hasMedicalCondition} onChange={v => set('hasMedicalCondition', v)} />
        </div>
        {answers.hasMedicalCondition && (
          <textarea
            value={answers.medicalConditionDetails}
            onChange={e => set('medicalConditionDetails', e.target.value)}
            placeholder="Please describe the condition and any medication required"
            rows={2}
            className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm outline-none"
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm text-[#1a2744]">Does any pilgrim need wheelchair or mobility assistance?</span>
          <YesNoToggle value={answers.needsMobilityAssistance} onChange={v => set('needsMobilityAssistance', v)} />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#1a2744] mb-1.5">
            Dietary requirements <span className="text-[#6b7a99] font-normal">(optional)</span>
          </label>
          <input
            value={answers.dietaryRequirements}
            onChange={e => set('dietaryRequirements', e.target.value)}
            placeholder="e.g. diabetic, no seafood"
            className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-4">
        Visa History
      </p>
      <div className="space-y-3 mb-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm text-[#1a2744]">Has any pilgrim previously been refused a Saudi visa?</span>
          <YesNoToggle value={answers.hasPriorVisaRefusal} onChange={v => set('hasPriorVisaRefusal', v)} />
        </div>
        {answers.hasPriorVisaRefusal && (
          <textarea
            value={answers.priorVisaRefusalDetails}
            onChange={e => set('priorVisaRefusalDetails', e.target.value)}
            placeholder="Please provide details"
            rows={2}
            className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm outline-none"
          />
        )}
      </div>

      <div className="mb-6">
        <label className="block text-[13px] font-medium text-[#1a2744] mb-1.5">
          Special requests <span className="text-[#6b7a99] font-normal">(optional)</span>
        </label>
        <textarea
          value={answers.specialRequests}
          onChange={e => set('specialRequests', e.target.value)}
          placeholder="Anything else we should know before preparing your Umrah?"
          rows={2}
          className="w-full border border-black/10 rounded-lg px-3 py-2.5 text-sm outline-none"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-[#1a2744] mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={answers.agreedToTerms}
          onChange={e => set('agreedToTerms', e.target.checked)}
          className="accent-[#c9a84c] mt-0.5"
        />
        <span>
          I confirm the information provided is accurate and agree to the terms & conditions of this Umrah service. <span className="text-red-500">*</span>
        </span>
      </label>

      {showErrors && missingRequired && (
        <p className="flex items-center gap-1.5 text-red-500 text-xs mb-4">
          <AlertCircle size={13} /> Please complete emergency contact details and agree to the terms.
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onBack}
          className="flex-1 border border-black/10 text-[#1a2744] font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-[2] bg-[#0a1628] hover:bg-[#162a50] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}