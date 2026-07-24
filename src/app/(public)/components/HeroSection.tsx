import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="bg-[#0a1628] min-h-[88vh] flex items-center relative overflow-hidden px-6 py-20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      />
      {/* Gold glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left content */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#c9a84c]/12 border border-[#c9a84c]/30 text-[#c9a84c] px-4 py-2 rounded-full text-[13px] font-semibold tracking-wide mb-7">
            <span className="text-[10px]">✦</span> Trusted by 2,000+ Pilgrims & Travelers
          </div>

          <p className="text-[#f5e4a8]/80 text-xl mb-4 leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu', serif", direction: 'rtl' }}>
            آپ کا سفر، ہماری ذمہ داری
          </p>

          <h1 className="font-playfair text-5xl lg:text-6xl font-bold text-white leading-[1.15] mb-5">
            Your Journey to{' '}
            <span className="text-[#c9a84c]">Sacred Lands</span>{' '}
            &amp; Beyond
          </h1>

          <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-lg">
            Premium Umrah, Hajj, international tours and air tickets — planned with care, delivered with trust. Serving Pakistan since 2005.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="#packages"
              className="bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0a1628] px-8 py-4 rounded-xl font-bold text-[15px] hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              ✦ Explore Packages
            </Link>
            <Link
              href="#book"
              className="border-[1.5px] border-[#c9a84c]/50 text-[#c9a84c] px-8 py-4 rounded-xl font-semibold text-[15px] hover:bg-[#c9a84c]/08 transition-colors inline-flex items-center gap-2"
            >
              Book a Consultation
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 mt-14 rounded-2xl overflow-hidden border border-white/08 max-w-md"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {[
              { num: '2,000+', label: 'Happy Travelers' },
              { num: '20yr',   label: 'Experience'       },
              { num: '50+',    label: 'Destinations'     },
            ].map((s, i) => (
              <div key={i} className="py-5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="block font-playfair text-[28px] font-bold text-[#c9a84c]">{s.num}</span>
                <span className="block text-[11px] text-white/45 font-medium mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right cards */}
        <div className="hidden lg:grid grid-cols-2 gap-3">
          {[
            { icon: '🕋', title: 'Umrah Packages',  desc: '5-star hotels near Haram, direct flights, full support' },
            { icon: '🌍', title: 'World Tours',      desc: 'Europe, Turkey, Malaysia & more destinations'          },
          ].map((card, i) => (
            <div key={i} className="bg-white/06 border border-[#c9a84c]/20 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-[28px] mb-3">{card.icon}</div>
              <h3 className="text-white text-sm font-semibold mb-1">{card.title}</h3>
              <p className="text-white/45 text-xs leading-relaxed">{card.desc}</p>
            </div>
          ))}
          <div className="col-span-2 bg-white/06 border border-[#c9a84c]/20 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
            <div className="text-[36px]">✈️</div>
            <div>
              <h3 className="text-white text-sm font-semibold mb-1">Air Tickets</h3>
              <p className="text-white/45 text-xs leading-relaxed">Best fares on all airlines — one-way, return, multi-city</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}