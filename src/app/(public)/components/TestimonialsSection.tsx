'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  { stars: 5, text: 'Exceptional service from start to finish. Our Umrah was spiritually fulfilling and logistically flawless. Hotel was steps from the Haram.', urdu: 'بہترین خدمت، حرم کے قریب ہوٹل، سب کچھ بالکل ٹھیک تھا', name: 'Ahmad Raza',   city: 'Lahore · Umrah 2024'   },
  { stars: 5, text: 'Booked Turkey tour for our family of 6. Every detail was perfect — transfers, hotels, guides. Already planning the next trip with them.', urdu: 'ترکی ٹور شاندار تھا، پورے خاندان نے بہت لطف اٹھایا',  name: 'Fatima Malik', city: 'Karachi · Turkey 2025'  },
  { stars: 5, text: 'Got air tickets for my whole family at the best price I found anywhere. Fast, professional, and trustworthy. Highly recommended.',         urdu: 'بہترین قیمت پر ٹکٹ ملے، بہت تیز اور پیشہ ور سروس',   name: 'Usman Tariq', city: 'Islamabad · Air Tickets' },
    { stars: 4, text: 'Booked Turkey tour for our family of 6. Every detail was perfect — transfers, hotels, guides. Already planning the next trip with them.', urdu: 'ترکی ٹور شاندار تھا، پورے خاندان نے بہت لطف اٹھایا',  name: 'Fatima Malik', city: 'Karachi · Turkey 2025'  },

]


const AUTOPLAY_MS = 6000

function TestimonialCard({ t }: { t: typeof testimonials[number] }) {
  return (
    <div className="bg-[#f8f6f0] rounded-2xl p-7 border border-black/06 h-full">
      <div className="text-[#c9a84c] text-sm tracking-[3px] mb-4">{'★'.repeat(t.stars)}</div>
      <p className="text-[#1a2744] text-[15px] leading-relaxed italic mb-3">"{t.text}"</p>
      <span className="text-[#6b7a99] text-sm leading-loose mb-4 block" style={{ fontFamily: "'Noto Nastaliq Urdu', serif", direction: 'rtl' }}>
        "{t.urdu}"
      </span>
      <div className="flex items-center gap-3 pt-4 border-t border-black/06">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a1628] to-[#0f2040] flex items-center justify-center text-[#c9a84c] font-bold font-playfair text-base shrink-0">
          {t.name[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[#1a2744] truncate">{t.name}</p>
          <p className="text-xs text-[#6b7a99] truncate">{t.city}</p>
        </div>
      </div>
    </div>
  )
}

export default function TestimonialsSection() {
  const [index, setIndex] = useState(0)
  const [perView, setPerView] = useState(1)
  const touchStartX = useRef<number | null>(null)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 1 card per view on mobile, 3 on desktop — same carousel mechanics
  // either way, just a different "page size"
  useEffect(() => {
    function updatePerView() {
      setPerView(window.innerWidth >= 768 ? 3 : 1)
    }
    updatePerView()
    window.addEventListener('resize', updatePerView)
    return () => window.removeEventListener('resize', updatePerView)
  }, [])

  const pageCount = Math.ceil(testimonials.length / perView)
  const page = Math.min(index, pageCount - 1)

  function goTo(p: number) {
    setIndex((p + pageCount) % pageCount)
  }
  function next() { goTo(page + 1) }
  function prev() { goTo(page - 1) }

  // Autoplay, paused while the pointer is over the carousel
  function startAutoplay() {
    stopAutoplay()
    autoplayRef.current = setInterval(() => {
      setIndex(i => (i + 1) % pageCount)
    }, AUTOPLAY_MS)
  }
  function stopAutoplay() {
    if (autoplayRef.current) clearInterval(autoplayRef.current)
  }

  useEffect(() => {
    startAutoplay()
    return stopAutoplay
  }, [pageCount])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    stopAutoplay()
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 40) prev()
    else if (delta < -40) next()
    touchStartX.current = null
    startAutoplay()
  }

  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-14 gap-6 flex-wrap">
          <div>
            <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">Client Stories</p>
            <h2 className="font-playfair text-4xl font-bold text-[#1a2744] mb-4">What Our Travelers Say</h2>
            <div className="w-12 h-[3px] bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] rounded-full" />
          </div>

          {/* Arrow controls — desktop, next to the heading */}
          {pageCount > 1 && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Previous testimonials"
                className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-[#1a2744] hover:bg-[#f8f6f0] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonials"
                className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-[#1a2744] hover:bg-[#f8f6f0] transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div
          className="relative overflow-hidden"
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {Array.from({ length: pageCount }).map((_, p) => (
              <div key={p} className="w-full shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 px-0.5">
                {testimonials.slice(p * perView, p * perView + perView).map((t, i) => (
                  <TestimonialCard key={p * perView + i} t={t} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Dots + mobile arrows */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              aria-label="Previous testimonials"
              className="sm:hidden w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-[#1a2744] hover:bg-[#f8f6f0] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: pageCount }).map((_, p) => (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  aria-label={`Go to testimonial page ${p + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    p === page ? 'w-6 bg-[#c9a84c]' : 'w-1.5 bg-black/15 hover:bg-black/25'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Next testimonials"
              className="sm:hidden w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-[#1a2744] hover:bg-[#f8f6f0] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}