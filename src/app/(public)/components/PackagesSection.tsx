'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import BookingLauncher from '@/components/public/BookingLauncher'
import PackageCard from '@/components/public/PackageCard'
import type { Package } from '@/components/public/packageTypes'
import { dedupePackagesForDisplay } from '@/components/public/packageTypes'

export default function PackagesSection({
  packages,
  orgSlug,
}: {
  packages: Package[]
  orgSlug: string
}) {
  const [activePackage, setActivePackage] = useState<Package | null>(null)

  // Collapse hotel-variant duplicates (same flight, different hotel) into a
  // single card per route, then show the top 4 — mirrors what the org set
  // up as featured/newest, just without the duplicate cards
  const displayItems = dedupePackagesForDisplay(packages).slice(0, 4)

  // After a Google OAuth round-trip, the callback route sends the customer
  // back here with ?resumeBooking=1 — reopen the flow on whichever package
  // they were booking before being sent off to log in
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('resumeBooking') !== '1') return

    const pendingId = sessionStorage.getItem('umrah_pending_package_id')
    if (pendingId) {
      const found = packages.find(p => p.id === pendingId)
      if (found) setActivePackage(found)
      sessionStorage.removeItem('umrah_pending_package_id')
    }
    window.history.replaceState({}, '', window.location.pathname)
  }, [packages])

  return (
    <section className="bg-[#f8f6f0] py-24 px-6" id="packages">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="font-playfair text-[28px] md:text-[32px] font-bold text-[#1a2744] mb-2">
              Explore Pre-Built Umrah Packages
            </h2>
            <p className="text-[#6b7a99] text-[15px] leading-relaxed max-w-xl">
              Choose from carefully prepared Umrah packages designed for different budgets, durations and comfort levels.
            </p>
          </div>
          <a
            href={`/${orgSlug}/packages`}
            className="hidden sm:inline-flex items-center gap-2 text-[#1a2744] text-sm font-semibold whitespace-nowrap hover:text-[#c9a84c] transition-colors"
          >
            View More
            <span className="w-8 h-8 rounded-full bg-[#0a1628] text-white flex items-center justify-center">
              <ArrowRight size={15} />
            </span>
          </a>
        </div>

        {displayItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/06 p-12 text-center text-[#6b7a99] text-sm">
            Add your packages in the dashboard to have them appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayItems.map(({ pkg, displayPrice }) => (
              <PackageCard key={pkg.id} pkg={pkg} displayPrice={displayPrice} onClick={() => setActivePackage(pkg)} />
            ))}
          </div>
        )}
      </div>

      {activePackage && (
        <BookingLauncher pkg={activePackage} orgSlug={orgSlug} onClose={() => setActivePackage(null)} />
      )}
    </section>
  )
}