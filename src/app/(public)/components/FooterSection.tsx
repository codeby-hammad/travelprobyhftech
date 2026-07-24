import Link from 'next/link'

export default function FooterSection() {
  return (
    <footer className="bg-[#0a1628] px-6 pt-16 pb-8 border-t border-[#c9a84c]/15" id="contact">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#c9a84c] to-[#e8c96a] rounded-[10px] flex items-center justify-center text-[#0a1628] font-bold font-playfair text-lg">H</div>
              <div>
                <p className="text-white font-playfair font-semibold">HAMMAD TRAVELERS</p>
                <p className="text-[#c9a84c] text-[10px] tracking-widest uppercase">EST. 2005 · LAHORE</p>
              </div>
            </div>
            <p className="text-white/45 text-sm leading-relaxed max-w-xs mb-5">
              Pakistan's trusted travel partner for Umrah, Hajj, international tours and air tickets. Serving with honesty since 2005.
            </p>
            <div className="flex flex-wrap gap-2">
              {['IATA', 'ATTA', 'Ministry Approved'].map(b => (
                <span key={b} className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c] text-[11px] font-semibold px-3 py-1.5 rounded-lg tracking-wide">{b}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">Services</h4>
            <ul className="space-y-2.5">
              {['Umrah Packages', 'Hajj Packages', 'International Tours', 'Air Tickets', 'Visa Assistance', 'Hotel Bookings'].map(s => (
                <li key={s}><a href="#" className="text-white/45 text-sm hover:text-[#c9a84c] transition-colors">{s}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li><a href="tel:+923001234567"                  className="text-white/45 text-sm hover:text-[#c9a84c] transition-colors">📞 0300 123 4567</a></li>
              <li><a href="https://wa.me/923001234567"         className="text-white/45 text-sm hover:text-[#c9a84c] transition-colors">💬 WhatsApp</a></li>
              <li><a href="mailto:info@hammadtravelers.com"    className="text-white/45 text-sm hover:text-[#c9a84c] transition-colors">✉️ Email Us</a></li>
              <li><span className="text-white/45 text-sm">📍 Lodhran, Punjab</span></li>
              <li><span className="text-white/45 text-sm">🕐 Mon–Sat 9am–7pm</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/08 pt-6 flex items-center justify-between flex-wrap gap-3">
          <p className="text-white/25 text-[13px]">© 2026 HAMMAD TRAVELERS. All rights reserved.</p>
          <p className="text-white/20 text-[13px]">Powered by TravelPro</p>
        </div>
      </div>
    </footer>
  )
}