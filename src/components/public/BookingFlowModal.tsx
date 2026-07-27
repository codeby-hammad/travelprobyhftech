'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Minus, Plus, X, ArrowLeft, Building2, ChevronRight, Check } from 'lucide-react'
import PilgrimDetailsStep, { type PilgrimDetail } from './PilgrimDetailsStep'
import QuestionnaireStep, { type QuestionnaireAnswers } from './QuestionnaireStep'
import ReviewSubmitStep from './ReviewSubmitStep'
import type { Package } from './packageTypes'
import { groupKey } from './packageTypes'
import type { CustomerProfile } from './CustomerAuthModal'

// This is a "query" flow, not a dashboard booking — nothing here writes to
// the `bookings` table. Everything collected across these steps lands as a
// single record once Review & Submit is wired up, which staff then work
// the same way they already work `booking_inquiries` (contact, convert, etc.)
// rather than a fully-formed booking appearing in the pipeline unreviewed.

type Pilgrims = { adult: number; child: number; infant: number }
type Tier = 'quad' | 'triple' | 'double'

const STEPS = ['Choose Package', 'Accommodation', 'Pilgrim Details', 'Questionnaire', 'Review & Submit'] as const

function tierPrice(pkg: Package, tier: Tier): number | null {
  const map: Record<Tier, number | null> = {
    quad:   pkg.price_quad,
    triple: pkg.price_triple,
    double: pkg.price_double,
  }
  return map[tier] ?? null
}

function startingFrom(pkg: Package): number | null {
  const prices = [pkg.price_double, pkg.price_triple, pkg.price_quad, pkg.base_price]
    .filter((p): p is number => typeof p === 'number' && p > 0)
  return prices.length ? Math.min(...prices) : null
}

export default function BookingFlowModal({
  pkg,
  customer,
  onClose,
}: {
  pkg: Package
  customer?: CustomerProfile
  onClose: () => void
}) {
  const [stepIndex, setStepIndex] = useState(0) // 0 = pilgrims popup, 1 = accommodation, ...
  const [pilgrims, setPilgrims] = useState<Pilgrims>({ adult: 1, child: 0, infant: 0 })

  const [siblings, setSiblings] = useState<Package[] | null>(null)
  const [loadingSiblings, setLoadingSiblings] = useState(false)

  const [optionPkg, setOptionPkg] = useState<Package | null>(null) // sibling being priced in the tier modal
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)

  const [confirmed, setConfirmed] = useState<{ pkg: Package; tier: Tier; price: number } | null>(null)
  const [pilgrimDetails, setPilgrimDetails] = useState<PilgrimDetail[] | null>(null)
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionnaireAnswers | null>(null)

  function adjust(field: keyof Pilgrims, delta: number) {
    setPilgrims(prev => {
      const min = field === 'adult' ? 1 : 0
      return { ...prev, [field]: Math.max(min, prev[field] + delta) }
    })
  }

  async function confirmPilgrims() {
    setStepIndex(1)
    setLoadingSiblings(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('packages')
      .select(`
        id, organization_id, name, route_code,
        departure_date, departure_city_code, airline_iata_code,
        makkah_hotel, madinah_hotel, makkah_nights, madinah_nights,
        base_price, price_quad, price_triple, price_double, currency
      `)
      .eq('organization_id', pkg.organization_id)
      .eq('is_active', true)

    const all = (data ?? []) as unknown as Package[]
    const matched = all.filter(p => groupKey(p) === groupKey(pkg))
    setSiblings(matched.length > 0 ? matched : [pkg])
    setLoadingSiblings(false)
  }

  function confirmAccommodationOption() {
    if (!optionPkg || !selectedTier) return
    const price = tierPrice(optionPkg, selectedTier)
    setConfirmed({ pkg: optionPkg, tier: selectedTier, price: price ?? 0 })
    setOptionPkg(null)
    setSelectedTier(null)
    setStepIndex(2)
  }

  // Lock page scroll while any step of the flow is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* ---------- Step 0: Select Pilgrims popup ---------- */}
      {stepIndex === 0 && (
        <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-6 right-6 text-[#1a2744]/50 hover:text-[#1a2744]">
            <X size={20} />
          </button>
          <h2 className="font-playfair text-2xl font-bold text-[#1a2744] mb-6">Select Pilgrims</h2>

          <div className="space-y-5">
            {([
              { key: 'adult' as const,  label: 'Adult',  hint: '12 years & above' },
              { key: 'child' as const,  label: 'Child',  hint: '2-12 Years'       },
              { key: 'infant' as const, label: 'Infant', hint: 'Under 2 Years'    },
            ]).map(row => (
              <div key={row.key} className="flex items-center justify-between">
                <div>
                  <p className="text-[#1a2744] font-semibold text-[15px]">{row.label}</p>
                  <p className="text-[#6b7a99] text-[13px]">({row.hint})</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjust(row.key, -1)}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#1a2744] hover:bg-gray-50 transition-colors"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-6 text-center font-semibold text-[#1a2744]">{pilgrims[row.key]}</span>
                  <button
                    type="button"
                    onClick={() => adjust(row.key, 1)}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#1a2744] hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={confirmPilgrims}
            className="w-full mt-7 bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0a1628] font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Confirm
          </button>
        </div>
      )}

      {/* ---------- Steps 1-4: full-width flow panel ---------- */}
      {stepIndex > 0 && (
        <div className="bg-[#f8f6f0] rounded-2xl w-full max-w-6xl max-h-[88vh] overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-[#1a2744]/50 hover:text-[#1a2744] z-10">
            <X size={20} />
          </button>

          <div className="p-4 sm:p-7 pb-4">
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setStepIndex(0)} className="text-[#1a2744] hover:text-[#c9a84c]">
                <ArrowLeft size={20} />
              </button>
              <h2 className="font-playfair text-2xl font-bold text-[#1a2744]">
                {STEPS[stepIndex]}
              </h2>
            </div>

            {/* Stepper */}
            <div className="flex items-center mb-8 overflow-x-auto pb-1">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center flex-1 last:flex-none min-w-fit">
                  <div className="flex flex-col gap-1.5 min-w-fit pr-4">
                    <div className={`flex items-center gap-1.5 text-[12px] sm:text-[13px] font-semibold whitespace-nowrap ${
                      i < stepIndex ? 'text-[#0a1628]' : i === stepIndex ? 'text-[#0a1628]' : 'text-[#6b7a99]/60'
                    }`}>
                      {i < stepIndex
                        ? <span className="w-4 h-4 rounded-full bg-[#0a1628] text-white flex items-center justify-center shrink-0"><Check size={11} /></span>
                        : null}
                      {label}
                    </div>
                    <div className={`h-[3px] rounded-full ${i <= stepIndex ? 'bg-[#0a1628]' : 'bg-black/10'}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* ---- Accommodation step ---- */}
            {stepIndex === 1 && (
              <div className="space-y-3">
                {loadingSiblings && (
                  <p className="text-[#6b7a99] text-sm py-8 text-center">Loading available hotels...</p>
                )}
                {!loadingSiblings && siblings?.map(sib => {
                  const nights = (sib.makkah_nights ?? 0) + (sib.madinah_nights ?? 0)
                  const price = startingFrom(sib)
                  return (
                    <button
                      key={sib.id}
                      onClick={() => { setOptionPkg(sib); setSelectedTier(null) }}
                      className="w-full bg-white rounded-xl border border-black/06 hover:border-[#c9a84c]/50 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-[#f8f6f0] flex items-center justify-center text-[#c9a84c] shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="text-[11px] text-[#6b7a99] uppercase tracking-wide">Makkah Hotel</p>
                            <p className="text-[#1a2744] font-semibold text-sm">{sib.makkah_hotel ?? '—'}</p>
                            {sib.makkah_nights != null && (
                              <p className="text-[11px] text-[#6b7a99] mt-0.5">{sib.makkah_nights} Nights</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-[#f8f6f0] flex items-center justify-center text-[#c9a84c] shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="text-[11px] text-[#6b7a99] uppercase tracking-wide">Madina Hotel</p>
                            <p className="text-[#1a2744] font-semibold text-sm">{sib.madinah_hotel ?? '—'}</p>
                            {sib.madinah_nights != null && (
                              <p className="text-[11px] text-[#6b7a99] mt-0.5">{sib.madinah_nights} Nights</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 w-full sm:w-auto flex sm:block items-center justify-between pt-3 sm:pt-0 border-t sm:border-t-0 border-black/06">
                        <p className="text-[11px] text-[#6b7a99]">Starting From</p>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <span className="font-playfair text-xl font-bold text-[#1a2744]">
                            {price != null ? `${sib.currency ?? 'PKR'} ${price.toLocaleString()}` : 'Contact us'}
                          </span>
                          <span className="w-8 h-8 rounded-full bg-[#0a1628] text-white flex items-center justify-center">
                            <ChevronRight size={16} />
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ---- Pilgrim Details step ---- */}
            {stepIndex === 2 && (
              <PilgrimDetailsStep
                pilgrims={pilgrims}
                seedEmail={customer?.email ?? undefined}
                seedPhone={customer?.phone ?? undefined}
                onComplete={(details) => {
                  setPilgrimDetails(details)
                  setStepIndex(3)
                }}
              />
            )}

            {/* ---- Questionnaire step ---- */}
            {stepIndex === 3 && (
              <QuestionnaireStep
                onBack={() => setStepIndex(2)}
                onComplete={(answers) => {
                  setQuestionnaireAnswers(answers)
                  setStepIndex(4)
                }}
              />
            )}

            {/* ---- Review & Submit step ---- */}
            {stepIndex === 4 && confirmed && pilgrimDetails && (
              <ReviewSubmitStep
                packageName={pkg.name}
                hotelSummary={`${confirmed.pkg.makkah_hotel ?? '—'} · ${confirmed.pkg.madinah_hotel ?? '—'}`}
                onBack={() => setStepIndex(3)}
                payload={{
                  organizationId:    pkg.organization_id,
                  packageId:         pkg.id,
                  selectedPackageId: confirmed.pkg.id,
                  roomTier:          confirmed.tier,
                  pricePerPilgrim:   confirmed.price,
                  currency:          confirmed.pkg.currency ?? 'PKR',
                  customerId:        customer?.id ?? null,
                  pilgrims,
                  pilgrimDetails,
                  questionnaire: questionnaireAnswers ?? {
                    emergencyContactName: '', emergencyContactPhone: '',
                    hasMedicalCondition: false, medicalConditionDetails: '',
                    needsMobilityAssistance: false, dietaryRequirements: '',
                    hasPriorVisaRefusal: false, priorVisaRefusalDetails: '',
                    specialRequests: '', agreedToTerms: false,
                  },
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ---------- Accommodation Option sub-modal (Quad/Triple/Double) ---------- */}
      {optionPkg && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-7 relative">
            <button
              onClick={() => { setOptionPkg(null); setSelectedTier(null) }}
              className="absolute top-6 right-6 text-[#1a2744]/50 hover:text-[#1a2744]"
            >
              <X size={20} />
            </button>
            <h3 className="font-playfair text-xl font-bold text-[#1a2744] mb-5">Select Accommodation Option</h3>

            <div className="space-y-2.5">
              {(['quad', 'triple', 'double'] as Tier[]).map(tier => {
                const price = tierPrice(optionPkg, tier)
                if (price == null) return null
                const active = selectedTier === tier
                return (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border text-left transition-colors ${
                      active ? 'border-[#c9a84c] bg-[#c9a84c]/08' : 'border-black/10 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[#1a2744] font-medium capitalize">{tier}</span>
                    <span className="text-[#1a2744] font-bold">
                      {optionPkg.currency ?? 'PKR'} {price.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={confirmAccommodationOption}
              disabled={!selectedTier}
              className="w-full mt-6 bg-[#0a1628] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 rounded-xl hover:bg-[#162a50] transition-colors disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}