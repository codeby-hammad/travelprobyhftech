const fallbackPackages = [
  {
    id:       '1',
    name:     'Premium 15-Day Umrah',
    destination: 'Makkah · Madinah',
    price:    450000,
    emoji:    '🕋',
    type:     'Umrah Package',
    urdu:     'پریمیم عمرہ پیکیج',
    features: ['5-star hotel 200m from Haram', 'Return flights included', 'Visa & Muallim service', 'Daily Ziarat tours'],
    featured: true,
    bg:       'from-[#1a3a6b] to-[#0a1628]',
  },
  {
    id:       '2',
    name:     'Turkey Family Tour',
    destination: 'Istanbul · Cappadocia',
    price:    320000,
    emoji:    '🦃',
    type:     'International Tour',
    urdu:     'ترکی فیملی ٹور',
    features: ['7 nights accommodation', 'All transfers included', 'Hot air balloon ride', 'Guided city tours'],
    featured: false,
    bg:       'from-[#1a2a5e] to-[#0a1030]',
  },
  {
    id:       '3',
    name:     'Hajj 2026 — Group',
    destination: 'Makkah · Mina',
    price:    1200000,
    emoji:    '🤲',
    type:     'Hajj Package',
    urdu:     'حج ۲۰۲۶ گروپ پیکیج',
    features: ['Aziziyah & Mina tents', 'Sacrificial animal', 'Full visa processing', '24/7 group support'],
    featured: false,
    bg:       'from-[#2d1b00] to-[#1a0f00]',
  },
  {
    id:       '4',
    name:     'Discounted Air Tickets',
    destination: 'All Airlines',
    price:    45000,
    emoji:    '✈️',
    type:     'Air Tickets',
    urdu:     'سستے ہوائی ٹکٹ',
    features: ['All major airlines', 'One-way & return fares', 'Group discounts', 'Same-day confirmation'],
    featured: false,
    bg:       'from-[#1a1a3e] to-[#0a0a1e]',
  },
]

type Package = {
  id:          string
  name:        string
  destination?: string | null
  price?:       number | null
  description?: string | null
  duration_days?: number | null
}

export default function PackagesSection({ packages }: { packages: Package[] }) {
  const displayPackages = packages.length > 0
    ? packages.map((p, i) => {
        const fallback = fallbackPackages[i % fallbackPackages.length]
        return {
          ...fallback,
          id:          p.id,
          name:        p.name,
          destination: p.destination ?? fallback.destination,
          price:       p.price       ?? fallback.price,
        }
      })
    : fallbackPackages

  return (
    <section className="bg-[#f8f6f0] py-24 px-6" id="packages">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">
            Featured Packages
          </p>
          <h2 className="font-playfair text-4xl font-bold text-[#1a2744] mb-4">
            Choose Your Perfect Journey
          </h2>
          <div className="w-12 h-[3px] bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] rounded-full mb-4" />
          <p className="text-[#6b7a99] text-base leading-relaxed max-w-lg">
            Every package is carefully crafted for comfort, value and a seamless experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          {displayPackages.map((pkg) => {
            const btnClass = pkg.featured
              ? 'bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0a1628]'
              : 'bg-[#0a1628] hover:bg-[#162a50] text-white'

            const cardClass = [
              'bg-white rounded-[20px] overflow-hidden border transition-all duration-300',
              'hover:-translate-y-1.5 hover:shadow-2xl relative',
              pkg.featured ? 'border-2 border-[#c9a84c]' : 'border border-black/06',
            ].join(' ')

            return (
              <div key={pkg.id} className={cardClass}>
                {pkg.featured && (
                  <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0a1628] text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                    ⭐ Most Popular
                  </div>
                )}

                {/* Image */}
                <div className={`h-48 bg-gradient-to-br ${pkg.bg} flex items-end justify-between p-4 relative`}>
                  <span className="text-[64px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-90">
                    {pkg.emoji}
                  </span>
                  <span className="relative z-10 text-white/80 text-[11px] font-semibold tracking-widest uppercase">
                    {pkg.destination}
                  </span>
                </div>

                <div className="p-6">
                  <p className="text-[#c9a84c] text-[11px] font-bold tracking-widest uppercase mb-2">
                    {pkg.type}
                  </p>
                  <h3 className="font-playfair text-lg font-semibold text-[#1a2744] mb-1 leading-snug">
                    {pkg.name}
                  </h3>
                  {pkg.urdu && (
                    <span
                      className="text-[#6b7a99] text-sm mb-3 block"
                      style={{ fontFamily: "'Noto Nastaliq Urdu', serif", direction: 'rtl' }}
                    >
                      {pkg.urdu}
                    </span>
                  )}

                  <ul className="space-y-1.5 mb-5">
                    {(pkg.features ?? []).map((f: string, i: number) => (
                      <li key={i} className="text-[13px] text-[#6b7a99] flex items-center gap-2">
                        <span className="text-[#c9a84c] font-bold text-xs">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-4 border-t border-black/06">
                    <div>
                      <span className="block text-[10px] text-[#6b7a99] mb-0.5">Starting from</span>
                      <span className="font-playfair text-xl font-bold text-[#1a2744]">
                        PKR {Number(pkg.price).toLocaleString()}
                      </span>
                    </div>
                    <a
                      href="#book"
                      className={`px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${btnClass}`}
                    >
                      Book Now
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}