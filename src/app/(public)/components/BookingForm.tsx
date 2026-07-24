'use client'

import { useState } from 'react'

type FormData = {
  fullName:   string
  phone:      string
  email:      string
  service:    string
  travelDate: string
  passengers: string
  message:    string
}

export default function BookingForm({
  orgId,
  orgName,
}: {
  orgId:   string
  orgName: string
}) {  const [form, setForm] = useState<FormData>({
    fullName:   '',
    phone:      '',
    email:      '',
    service:    'Umrah Package',
    travelDate: '',
    passengers: '1 Person',
    message:    '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/public/book', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, orgId }),  // ← pass orgId from URL
      })
      setSubmitted(true)
    } catch {
      alert('Something went wrong. Please WhatsApp us directly.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = [
    'border-[1.5px] border-black/10 rounded-xl px-4 py-3 text-sm',
    'text-[#1a2744] focus:border-[#c9a84c] outline-none bg-[#f8f6f0] transition-colors',
  ].join(' ')

  if (submitted) {
    return (
      <section className="bg-[#f8f6f0] py-24 px-6" id="book">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-14 text-center border border-black/06 shadow-xl">
          <div className="text-6xl mb-5">🤲</div>
          <h2 className="font-playfair text-3xl font-bold text-[#1a2744] mb-3">JazakAllah Khair!</h2>
          <p className="text-[#6b7a99] text-base mb-6 leading-relaxed">
            Your inquiry has been received. Our team will contact you within{' '}
            <strong>2 hours</strong>.<br />
            For faster response, WhatsApp us directly.
          </p>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25d166] text-white px-8 py-3 rounded-xl font-bold text-sm"
          >
            <span>💬</span>
            <span>Open WhatsApp</span>
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#f8f6f0] py-24 px-6" id="book">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-14 border border-black/06 shadow-xl">
        <h2 className="font-playfair text-3xl font-bold text-[#1a2744] mb-2">
          Request a Booking
        </h2>
        <p className="text-[#6b7a99] text-[15px] mb-10">
          Fill in your details and our team will contact you within 2 hours —{' '}
          یا WhatsApp پر ابھی رابطہ کریں
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1a2744]">
              Full Name / پورا نام
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              placeholder="Muhammad Ali"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1a2744]">
              Phone / موبائل
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="0300 1234567"
              type="tel"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1a2744]">Email Address</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@email.com"
              type="email"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1a2744]">Service / سروس</label>
            <select
              name="service"
              value={form.service}
              onChange={handleChange}
              className={inputClass}
            >
              <option>Umrah Package — عمرہ پیکیج</option>
              <option>Hajj Package — حج پیکیج</option>
              <option>International Tour — بین الاقوامی ٹور</option>
              <option>Air Ticket — ہوائی ٹکٹ</option>
              <option>Visa Assistance — ویزہ</option>
              <option>Hotel Booking — ہوٹل</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1a2744]">
              Travel Date / سفر کی تاریخ
            </label>
            <input
              name="travelDate"
              value={form.travelDate}
              onChange={handleChange}
              type="date"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1a2744]">
              Passengers / مسافر
            </label>
            <select
              name="passengers"
              value={form.passengers}
              onChange={handleChange}
              className={inputClass}
            >
              <option>1 Person</option>
              <option>2 People</option>
              <option>3-5 People (Family)</option>
              <option>6-10 People (Group)</option>
              <option>10+ People (Large Group)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[13px] font-semibold text-[#1a2744]">
              Message / پیغام (Optional)
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Any specific requirements, budget range, or questions..."
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0a1628] py-4 rounded-xl text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Submitting...' : '✦ Submit Inquiry — درخواست بھیجیں'}
            </button>
            <p className="text-center text-[13px] text-[#6b7a99] mt-3">
              🔒 Your information is secure. We will contact you within 2 hours.
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}