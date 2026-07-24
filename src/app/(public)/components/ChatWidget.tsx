'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'bot' | 'user'; text: string }

const responses: Record<string, string> = {
  umrah:   'We have Umrah packages starting from PKR 4,50,000 per person including 5-star hotel near Haram, return flights, visa and Muallim service. Which dates are you planning? 🕋',
  hajj:    'Hajj 2026 bookings are open! Group packages include Mina tents, accommodation in Makkah & Madinah, visa and 24/7 support. Limited seats — book early! 🤲',
  turkey:  'Our Turkey Family Tour includes 7 nights, Istanbul + Cappadocia, hot air balloon, all transfers and guided tours. Starting PKR 3,20,000 per person. 🦃',
  ticket:  'We offer the best air ticket prices on all airlines — PIA, Emirates, Turkish, Qatar Airways and more. Tell us your route and dates for a quote! ✈️',
  price:   'Our packages start from PKR 45,000 for air tickets, PKR 3,20,000 for international tours, and PKR 4,50,000 for Umrah. What service interests you?',
  visa:    'We handle visa processing for Saudi Arabia, Schengen, UK, UAE, Turkey and more. Contact us with your passport details to get started. 📋',
  contact: 'Reach us at 0300 123 4567 or WhatsApp anytime! Office in Lodhran, Punjab. Open Mon–Sat 9am–7pm. 📞',
  book:    'Fill the booking form on this page or WhatsApp us for faster service! We respond within 2 hours. 🙂',
}

function getBotReply(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('umrah')  || m.includes('عمرہ'))  return responses.umrah
  if (m.includes('hajj')   || m.includes('حج'))    return responses.hajj
  if (m.includes('turkey') || m.includes('ترکی') || m.includes('tour')) return responses.turkey
  if (m.includes('ticket') || m.includes('ٹکٹ')  || m.includes('flight')) return responses.ticket
  if (m.includes('price')  || m.includes('cost')  || m.includes('قیمت'))  return responses.price
  if (m.includes('visa')   || m.includes('ویزہ')) return responses.visa
  if (m.includes('contact')|| m.includes('call')  || m.includes('number')) return responses.contact
  if (m.includes('book')   || m.includes('بک'))   return responses.book
  return 'Thanks for your message! For detailed info, WhatsApp us at 0300 123 4567 or fill the booking form. We reply within 2 hours. 🙂'
}

const suggestions = [
  { label: '🕋 Umrah',    text: 'Umrah packages'  },
  { label: '✈️ Tickets',  text: 'Air ticket prices' },
  { label: '🌍 Turkey',   text: 'Turkey tour'      },
  { label: '🤲 Hajj',     text: 'Hajj 2026'        },
]

export default function ChatWidget() {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Assalam o Alaikum! 👋 Welcome to HAMMAD TRAVELERS. I can help with Umrah, Hajj, tours or air tickets. What are you looking for?' },
  ])
  const [input,    setInput]    = useState('')
  const bottomRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(text: string) {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: getBotReply(text) }])
    }, 700)
  }

  return (
    <>
      {/* WhatsApp float
      
        href="https://wa.me/923001234567"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 left-8 z-50 flex items-center gap-2 bg-[#25d166] text-white px-5 py-3 rounded-full font-semibold text-sm shadow-lg hover:-translate-y-0.5 transition-transform"
      
        💬 Chat on WhatsApp */}
        
    

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-28 right-8 z-50 w-80 bg-white rounded-2xl border border-black/08 shadow-2xl flex flex-col overflow-hidden max-h-[480px]">
          <div className="bg-[#0a1628] px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#c9a84c] to-[#e8c96a] rounded-full flex items-center justify-center text-lg">🕋</div>
            <div>
              <p className="text-white text-sm font-semibold">HAMMAD TRAVELERS</p>
              <p className="text-white/45 text-xs"><span className="inline-block w-2 h-2 bg-[#25d166] rounded-full mr-1" />Usually replies instantly</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-snug ${
                m.role === 'bot'
                  ? 'bg-[#f8f6f0] text-[#1a2744] self-start rounded-bl-sm'
                  : 'bg-[#0a1628] text-white ml-auto rounded-br-sm'
              }`}>
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {suggestions.map(s => (
              <button
                key={s.text}
                onClick={() => sendMessage(s.text)}
                className="bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#1a2744] text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-[#c9a84c]/20 transition-colors whitespace-nowrap"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="px-3 pb-3 flex gap-2 border-t border-black/06 pt-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Type your message..."
              className="flex-1 border-[1.5px] border-black/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#c9a84c]"
            />
            <button
              onClick={() => sendMessage(input)}
              className="bg-[#0a1628] text-white w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-gradient-to-br from-[#c9a84c] to-[#e8c96a] rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition-transform border-none cursor-pointer"
        title="Chat with us"
      >
        {open ? '✕' : '💬'}
      </button>
    </>
  )
}