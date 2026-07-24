const testimonials = [
  { stars: 5, text: 'Exceptional service from start to finish. Our Umrah was spiritually fulfilling and logistically flawless. Hotel was steps from the Haram.', urdu: 'بہترین خدمت، حرم کے قریب ہوٹل، سب کچھ بالکل ٹھیک تھا', name: 'Ahmad Raza',   city: 'Lahore · Umrah 2024'   },
  { stars: 5, text: 'Booked Turkey tour for our family of 6. Every detail was perfect — transfers, hotels, guides. Already planning the next trip with them.', urdu: 'ترکی ٹور شاندار تھا، پورے خاندان نے بہت لطف اٹھایا',  name: 'Fatima Malik', city: 'Karachi · Turkey 2025'  },
  { stars: 5, text: 'Got air tickets for my whole family at the best price I found anywhere. Fast, professional, and trustworthy. Highly recommended.',         urdu: 'بہترین قیمت پر ٹکٹ ملے، بہت تیز اور پیشہ ور سروس',   name: 'Usman Tariq', city: 'Islamabad · Air Tickets' },
]

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">Client Stories</p>
          <h2 className="font-playfair text-4xl font-bold text-[#1a2744] mb-4">What Our Travelers Say</h2>
          <div className="w-12 h-[3px] bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-[#f8f6f0] rounded-2xl p-7 border border-black/06">
              <div className="text-[#c9a84c] text-sm tracking-[3px] mb-4">{'★'.repeat(t.stars)}</div>
              <p className="text-[#1a2744] text-[15px] leading-relaxed italic mb-3">"{t.text}"</p>
              <span className="text-[#6b7a99] text-sm leading-loose mb-4 block" style={{ fontFamily: "'Noto Nastaliq Urdu', serif", direction: 'rtl' }}>
                "{t.urdu}"
              </span>
              <div className="flex items-center gap-3 pt-4 border-t border-black/06">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a1628] to-[#0f2040] flex items-center justify-center text-[#c9a84c] font-bold font-playfair text-base">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1a2744]">{t.name}</p>
                  <p className="text-xs text-[#6b7a99]">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}