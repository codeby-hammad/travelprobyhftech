'use client'

import { useState, useTransition } from 'react'
import { Wand2 } from 'lucide-react'
import { autofillTripDetailsFromPackage } from '@/app/actions/autofillTripDetails'

export default function AutofillTripDetailsButton({
  bookingId,
  organizationId,
  packageId,
  roomType,
  maktabNumber,
}: {
  bookingId: string
  organizationId: string
  packageId: string
  roomType: string | null
  maktabNumber?: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await autofillTripDetailsFromPackage({
        bookingId, organizationId, packageId, roomType, maktabNumber,
      })
      if (!result.success) setError(result.error ?? 'Autofill failed.')
    })
  }

  return (
    <div className="mb-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
      >
        <Wand2 size={13} />
        {isPending ? 'Filling in...' : 'Autofill flight, hotel & Umrah details from package'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}