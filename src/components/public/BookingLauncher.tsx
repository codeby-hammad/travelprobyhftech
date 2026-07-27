'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import CustomerAuthModal from './CustomerAuthModal'
import BookingFlowModal from './BookingFlowModal'
import { ensureCustomerRow, type CustomerProfile } from './customerAuth'
import type { Package } from './packageTypes'

// Sits in front of BookingFlowModal: checks whether the visitor is logged
// in as a customer of this org, shows CustomerAuthModal if not, and once
// authenticated (or already logged in) hands off to the real booking flow
// with their profile so it can seed pilgrim contact info and tag the
// eventual umrah_inquiries row with customer_id.
export default function BookingLauncher({
  pkg,
  orgSlug,
  onClose,
}: {
  pkg: Package
  orgSlug: string
  onClose: () => void
}) {
  const [checking, setChecking] = useState(true)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setChecking(false)
        return
      }

      const profile = await ensureCustomerRow(supabase, user.id, pkg.organization_id, { email: user.email })
      if (!cancelled) {
        setCustomer(profile)
        setChecking(false)
      }
    })()

    return () => { cancelled = true }
  }, [pkg.organization_id])

  if (checking) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    )
  }

  if (!customer) {
    return (
      <CustomerAuthModal
        organizationId={pkg.organization_id}
        orgSlug={orgSlug}
        pendingPackageId={pkg.id}
        onClose={onClose}
        onAuthenticated={setCustomer}
      />
    )
  }

  return <BookingFlowModal pkg={pkg} customer={customer} onClose={onClose} />
}