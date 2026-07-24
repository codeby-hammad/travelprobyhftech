const reasons = [
  { num: '01', title: 'Ministry Approved',    desc: 'Officially recognized by Ministry of Religious Affairs for Umrah and Hajj operations. IATA & ATTA certified.' },
  { num: '02', title: '20+ Years Experience', desc: 'Over two decades serving pilgrims and travelers from across Pakistan. 2,000+ satisfied clients every year.'    },
  { num: '03', title: 'Best Price Guarantee', desc: 'We match or beat any comparable package price. Transparent pricing — no hidden charges, ever.'                },
  { num: '04', title: '24/7 WhatsApp Support',desc: 'Our team is always reachable on WhatsApp — before, during and after your journey. You are never alone.'       },
]

export default function WhyUsSection() {
  return (
    <section className="bg-[#0a1628] py-24 px-6 relative overflow-hidden" id="about">
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-14">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">Why Choose Us</p>
          <h2 className="font-playfair text-4xl font-bold text-white mb-4">20 Years of Trusted Service</h2>
          <div className="w-12 h-[3px] bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] rounded-full mb-4" />
          <p className="text-white/50 text-base leading-relaxed max-w-lg">
            We do not just book trips — we ensure every journey is safe, smooth and memorable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="bg-white/04 border border-[#c9a84c]/15 rounded-2xl p-7 hover:bg-white/07 hover:border-[#c9a84c]/35 transition-all duration-300"
            >
              <div className="font-playfair text-5xl font-bold text-[#c9a84c]/20 leading-none mb-3">{r.num}</div>
              <h3 className="text-white text-base font-semibold mb-2">{r.title}</h3>
              <p className="text-white/45 text-[13px] leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}