'use client'

import { useState } from 'react'
import { User, Calendar, FileText, MapPin, Upload, Check, ChevronRight } from 'lucide-react'

export type PilgrimType = 'adult' | 'child' | 'infant'

export type PilgrimDetail = {
  slotLabel: string
  type: PilgrimType
  title: 'Mr' | 'Mrs' | 'Miss'
  firstName: string
  familyName: string
  maritalStatus: string
  nationality: string
  dateOfBirth: string
  birthCountry: string
  passportNumber: string
  passportType: string
  passportIssueDate: string
  passportExpiryDate: string
  passportIssueCity: string
  passportIssueCountry: string
  currentCountry: string
  residentId: string
  residentIdExpiryDate: string
  personalPictureName: string | null
  residentIdPictureName: string | null
  email: string
  phone: string
  nickname: string
  saveForFutureUse: boolean
}

const COUNTRIES = [
  'Pakistan', 'Saudi Arabia', 'United Arab Emirates', 'United Kingdom',
  'United States', 'India', 'Bangladesh', 'Turkey', 'Malaysia', 'Other',
]

const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed']
const PASSPORT_TYPES = ['Ordinary', 'Diplomatic', 'Official']

function emptyPilgrim(slotLabel: string, type: PilgrimType, seedEmail = '', seedPhone = ''): PilgrimDetail {
  return {
    slotLabel, type,
    title: 'Mr',
    firstName: '', familyName: '', maritalStatus: '',
    nationality: '', dateOfBirth: '', birthCountry: '',
    passportNumber: '', passportType: '', passportIssueDate: '',
    passportExpiryDate: '', passportIssueCity: '', passportIssueCountry: '',
    currentCountry: '', residentId: '', residentIdExpiryDate: '',
    personalPictureName: null, residentIdPictureName: null,
    email: seedEmail, phone: seedPhone, nickname: '', saveForFutureUse: false,
  }
}

function buildSlots(counts: { adult: number; child: number; infant: number }): { label: string; type: PilgrimType }[] {
  const slots: { label: string; type: PilgrimType }[] = []
  for (let i = 1; i <= counts.adult; i++)  slots.push({ label: `Adult ${i}`,  type: 'adult' })
  for (let i = 1; i <= counts.child; i++)  slots.push({ label: `Child ${i}`,  type: 'child' })
  for (let i = 1; i <= counts.infant; i++) slots.push({ label: `Infant ${i}`, type: 'infant' })
  return slots.length ? slots : [{ label: 'Adult 1', type: 'adult' }]
}

const REQUIRED_FIELDS: (keyof PilgrimDetail)[] = [
  'firstName', 'familyName', 'maritalStatus', 'nationality', 'dateOfBirth',
  'birthCountry', 'passportNumber', 'passportType', 'passportIssueDate',
  'passportExpiryDate', 'passportIssueCity', 'passportIssueCountry',
  'currentCountry', 'email', 'phone',
]

function labelClass() { return 'block text-[13px] font-medium text-[#1a2744] mb-1.5' }

function TextField({ label, required, value, onChange, placeholder, type = 'text', icon: Icon, error }: {
  label: string; required?: boolean; value: string
  onChange: (v: string) => void; placeholder?: string; type?: string
  icon?: any; error?: boolean
}) {
  return (
    <div>
      <label className={labelClass()}>{label} {required && <span className="text-red-500">*</span>}</label>
      <div className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 ${error ? 'border-red-300 bg-red-50/40' : 'border-black/10 bg-white'}`}>
        {Icon && <Icon size={15} className="text-[#6b7a99] shrink-0" />}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className="w-full text-sm text-[#1a2744] outline-none bg-transparent placeholder:text-[#6b7a99]/60"
        />
      </div>
    </div>
  )
}

function SelectField({ label, required, value, onChange, options, icon: Icon, error }: {
  label: string; required?: boolean; value: string
  onChange: (v: string) => void; options: string[]; icon?: any; error?: boolean
}) {
  return (
    <div>
      <label className={labelClass()}>{label} {required && <span className="text-red-500">*</span>}</label>
      <div className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 ${error ? 'border-red-300 bg-red-50/40' : 'border-black/10 bg-white'}`}>
        {Icon && <Icon size={15} className="text-[#6b7a99] shrink-0" />}
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full text-sm text-[#1a2744] outline-none bg-transparent appearance-none"
        >
          <option value="">Select</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function PilgrimDetailsStep({
  pilgrims,
  seedEmail,
  seedPhone,
  onComplete,
}: {
  pilgrims: { adult: number; child: number; infant: number }
  seedEmail?: string
  seedPhone?: string
  onComplete: (details: PilgrimDetail[]) => void
}) {
  const slots = buildSlots(pilgrims)
  const [forms, setForms] = useState<PilgrimDetail[]>(
    slots.map(s => emptyPilgrim(s.label, s.type, seedEmail, seedPhone))
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [showErrors, setShowErrors] = useState(false)

  const active = forms[activeIndex]

  function update<K extends keyof PilgrimDetail>(key: K, value: PilgrimDetail[K]) {
    setForms(prev => prev.map((f, i) => i === activeIndex ? { ...f, [key]: value } : f))
  }

  function missingFields(): (keyof PilgrimDetail)[] {
    return REQUIRED_FIELDS.filter(f => !String(active[f] ?? '').trim())
  }

  function handleNext() {
    const missing = missingFields()
    if (missing.length > 0) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    if (activeIndex < forms.length - 1) {
      setActiveIndex(activeIndex + 1)
    } else {
      onComplete(forms)
    }
  }

  const missing = showErrors ? missingFields() : []
  const has = (f: keyof PilgrimDetail) => missing.includes(f)

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Pilgrim tabs sidebar */}
      <div className="w-full md:w-52 md:shrink-0 flex md:block gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 space-y-0 md:space-y-2">
        {forms.map((f, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-full md:w-full shrink-0 min-w-[140px] md:min-w-0 flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
              i === activeIndex
                ? 'border-[#c9a84c] bg-[#c9a84c]/08 text-[#1a2744]'
                : 'border-black/08 bg-white text-[#6b7a99] hover:border-black/15'
            }`}
          >
            <span className="flex items-center gap-2">
              {REQUIRED_FIELDS.every(field => String(f[field] ?? '').trim()) && (
                <span className="w-4 h-4 rounded-full bg-[#0a1628] text-white flex items-center justify-center shrink-0">
                  <Check size={10} />
                </span>
              )}
              {f.slotLabel}
            </span>
            <ChevronRight size={14} />
          </button>
        ))}
      </div>

      {/* Active pilgrim form */}
      <div className="flex-1 bg-white rounded-xl border border-black/06 p-4 sm:p-6 w-full">
        <h3 className="font-playfair text-xl font-bold text-[#1a2744] mb-5">{active.slotLabel}</h3>

        {/* Personal Details */}
        <div className="mb-7">
          <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Personal Details</p>
          <div className="flex gap-5 mb-4">
            {(['Mr', 'Mrs', 'Miss'] as const).map(t => (
              <label key={t} className="flex items-center gap-1.5 text-sm text-[#1a2744] cursor-pointer">
                <input
                  type="radio"
                  checked={active.title === t}
                  onChange={() => update('title', t)}
                  className="accent-[#c9a84c]"
                />
                {t}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="First Name (EN)" required icon={User} value={active.firstName}
              onChange={v => update('firstName', v)} placeholder="Enter first name" error={has('firstName')} />
            <TextField label="Family Name (EN)" required icon={User} value={active.familyName}
              onChange={v => update('familyName', v)} placeholder="Enter family name" error={has('familyName')} />
            <SelectField label="Marital Status" required value={active.maritalStatus}
              onChange={v => update('maritalStatus', v)} options={MARITAL_STATUSES} error={has('maritalStatus')} />
          </div>
        </div>

        {/* Demographics */}
        <div className="mb-7">
          <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Demographics</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Nationality" required value={active.nationality}
              onChange={v => update('nationality', v)} options={COUNTRIES} error={has('nationality')} />
            <TextField label="Date of Birth" required type="date" icon={Calendar} value={active.dateOfBirth}
              onChange={v => update('dateOfBirth', v)} error={has('dateOfBirth')} />
            <SelectField label="Birth Country" required value={active.birthCountry}
              onChange={v => update('birthCountry', v)} options={COUNTRIES} error={has('birthCountry')} />
          </div>
        </div>

        {/* Passport Details */}
        <div className="mb-7">
          <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Passport Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Passport Number" required icon={FileText} value={active.passportNumber}
              onChange={v => update('passportNumber', v)} placeholder="Enter passport number" error={has('passportNumber')} />
            <SelectField label="Passport Type" required value={active.passportType}
              onChange={v => update('passportType', v)} options={PASSPORT_TYPES} error={has('passportType')} />
            <TextField label="Passport Issue Date" required type="date" icon={Calendar} value={active.passportIssueDate}
              onChange={v => update('passportIssueDate', v)} error={has('passportIssueDate')} />
            <TextField label="Passport Expiry Date" required type="date" icon={Calendar} value={active.passportExpiryDate}
              onChange={v => update('passportExpiryDate', v)} error={has('passportExpiryDate')} />
            <TextField label="Passport Issue City" required icon={MapPin} value={active.passportIssueCity}
              onChange={v => update('passportIssueCity', v)} placeholder="Enter issue city" error={has('passportIssueCity')} />
            <SelectField label="Passport Issue Country" required value={active.passportIssueCountry}
              onChange={v => update('passportIssueCountry', v)} options={COUNTRIES} error={has('passportIssueCountry')} />
          </div>
        </div>

        {/* Residency */}
        <div className="mb-7">
          <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Residency</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Current Country" required value={active.currentCountry}
              onChange={v => update('currentCountry', v)} options={COUNTRIES} error={has('currentCountry')} />
            <TextField label="Resident ID" icon={FileText} value={active.residentId}
              onChange={v => update('residentId', v)} placeholder="Enter resident ID (optional)" />
            <TextField label="Resident ID Expiry Date" type="date" icon={Calendar} value={active.residentIdExpiryDate}
              onChange={v => update('residentIdExpiryDate', v)} />
          </div>
        </div>

        {/* Documents */}
        <div className="mb-7">
          <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Documents</p>
          <div className="space-y-3">
            {([
              { key: 'personalPictureName' as const, label: 'Personal Picture', required: true },
              { key: 'residentIdPictureName' as const, label: 'Resident ID Picture', required: false },
            ]).map(doc => (
              <div key={doc.key} className="flex items-center justify-between gap-3 flex-wrap border border-black/08 rounded-lg px-4 py-3">
                <span className="text-sm text-[#1a2744]">
                  {doc.label} {doc.required && <span className="text-red-500">*</span>}
                  {active[doc.key] && <span className="text-[#6b7a99] text-xs ml-2">({active[doc.key]})</span>}
                </span>
                <label className="flex items-center gap-1.5 text-xs font-semibold bg-[#0a1628] text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-[#162a50] transition-colors">
                  <Upload size={13} />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => update(doc.key, e.target.files?.[0]?.name ?? null)}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <p className="text-[13px] font-bold text-[#1a2744] uppercase tracking-wide mb-3">Contact Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Email Address" required type="email" value={active.email}
              onChange={v => update('email', v)} placeholder="you@example.com" error={has('email')} />
            <TextField label="Phone Number" required type="tel" value={active.phone}
              onChange={v => update('phone', v)} placeholder="+92 3XX XXXXXXX" error={has('phone')} />
          </div>
          <div className="mt-4">
            <TextField label="Nickname" value={active.nickname}
              onChange={v => update('nickname', v)} placeholder="Optional" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[#1a2744] mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={active.saveForFutureUse}
            onChange={e => update('saveForFutureUse', e.target.checked)}
            className="accent-[#c9a84c]"
          />
          Save details for future use
        </label>

        {showErrors && missing.length > 0 && (
          <p className="text-red-500 text-xs mb-3">Please fill in all required fields marked with *.</p>
        )}

        <button
          onClick={handleNext}
          className="w-full bg-[#0a1628] hover:bg-[#162a50] text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {activeIndex < forms.length - 1 ? 'Save & Next Pilgrim' : 'Next'}
        </button>
      </div>
    </div>
  )
}