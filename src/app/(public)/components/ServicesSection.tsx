const services = [
  { icon: '🕋', title: 'Umrah Packages',     urdu: 'عمرہ پیکیجز',   desc: 'All-inclusive Umrah packages with 5-star and 3-star options, visa processing, guided Ziarat tours and dedicated Muallim service.' },
  { icon: '🤲', title: 'Hajj Arrangements',  urdu: 'حج کا انتظام',   desc: 'Complete Hajj planning including Maktab allocation, accommodation in Makkah and Madinah, and full group support throughout.' },
  { icon: '🌍', title: 'International Tours', urdu: 'بین الاقوامی سیر', desc: 'Curated tours to Turkey, Malaysia, Europe, Thailand, Dubai and more — family, honeymoon and group options available.' },
  { icon: '✈️', title: 'Air Tickets',         urdu: 'ہوائی ٹکٹ',     desc: 'Best rates on all airlines. One-way, return, connecting and open-jaw tickets for individuals, families and corporate clients.' },
  { icon: '📋', title: 'Visa Assistance',     urdu: 'ویزہ سروس',     desc: 'Expert visa processing for Saudi Arabia, Schengen, UK, USA and more. We handle paperwork, tracking and follow-ups.' },
  { icon: '🏨', title: 'Hotel Bookings',      urdu: 'ہوٹل بکنگ',     desc: 'Hand-picked hotels across all destinations. Budget to luxury — we find the best options for your comfort and budget.' },
]

export default function ServicesSection() {
  return (
    <section className="bg-white py-24 px-6" id="services">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">What We Offer</p>
          <h2 className="font-playfair text-4xl font-bold text-[#1a2744] mb-4">Complete Travel Solutions</h2>
          <div className="w-12 h-[3px] bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] rounded-full mb-4" />
          <p className="text-[#6b7a99] text-base leading-relaxed max-w-lg">
            From sacred pilgrimages to exotic destinations, we handle every detail so you can focus on the journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={i}
              className="group bg-[#f8f6f0] rounded-2xl p-8 border border-black/06 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-14 h-14 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-2xl flex items-center justify-center text-[26px] mb-5">
                {s.icon}
              </div>
              <h3 className="font-playfair text-xl font-semibold text-[#1a2744] mb-2">{s.title}</h3>
              <p className="text-[#6b7a99] text-sm leading-relaxed mb-3">{s.desc}</p>
              <span className="text-[#c9a84c] text-sm" style={{ fontFamily: "'Noto Nastaliq Urdu', serif", direction: 'rtl', display: 'block' }}>
                {s.urdu}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}