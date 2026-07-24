'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plane, Users, FileText, ShieldCheck, BarChart3,
  Sparkles, Check, Star, Menu, X, ArrowRight,
  Building2, CreditCard, Bell, Globe, ChevronRight,
  TrendingUp, Calendar, Receipt, MessageCircle
} from 'lucide-react'

export default function LandingPage() {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [activePrice, setActivePrice] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">TravelPro</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-1">
              Pakistan
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Umrah',    href: '#umrah'    },
              { label: 'Pricing',  href: '#pricing'  },
              { label: 'About',    href: '#about'    },
            ].map(item => (
              <a key={item.label} href={item.href}
                className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
              Sign in
            </Link>
            <Link href="/register"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition shadow-sm">
              Start free trial
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-600"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {['Features', 'Umrah', 'Pricing', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-gray-600 py-2">
                {item}
              </a>
            ))}
            <Link href="/register"
              className="block text-center text-sm font-semibold text-white bg-blue-600 px-5 py-3 rounded-xl mt-2">
              Start free trial
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">

        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Sparkles size={13} />
            Pakistan ka #1 Travel Agency Software — Now with AI
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
            Apni Travel Agency
            <span className="relative mx-3">
              <span className="relative z-10 text-blue-600">Digitize</span>
              <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                <path d="M0 6 Q50 0 100 4 Q150 8 200 2" stroke="#2563eb" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
            Karein
          </h1>

          <p className="text-xl text-gray-500 mb-3 leading-relaxed">
            Bookings, Umrah packages, visa tracking, invoices, aur AI trip planning —
            <br className="hidden md:block" />
            sab kuch ek jagah. Pakistani agencies ke liye banaya gaya.
          </p>

          {/* Urdu tagline */}
          <p className="text-lg text-gray-400 mb-10" dir="rtl">
            ایک مکمل سفری ایجنسی مینجمنٹ سسٹم — اردو اور انگریزی میں
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl transition shadow-lg shadow-blue-200 text-base">
              Abhi Start Karein — Free Hai
              <ArrowRight size={18} />
            </Link>
            <a href="#features"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 font-medium px-8 py-4 rounded-2xl transition text-base">
              Features Dekhein
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            {[
              '✅ No credit card required',
              '✅ 14-day free trial',
              '✅ Cancel anytime',
              '✅ Pakistani support',
            ].map(item => (
              <span key={item} className="flex items-center gap-1">{item}</span>
            ))}
          </div>
        </div>

        {/* Hero screenshot mockup */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-400 border border-gray-200 text-center">
                app.travelpro.pk/dashboard
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="bg-gray-50 p-4">
              <div className="flex gap-3">
                {/* Sidebar */}
                <div className="w-44 bg-white rounded-xl p-3 shadow-sm hidden md:block">
                  <div className="flex items-center gap-2 mb-4 p-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                      <Plane size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-bold">TravelPro</span>
                  </div>
                  {[
                    { icon: BarChart3,    label: 'Dashboard',    active: true  },
                    { icon: Sparkles,     label: 'AI Planner ✨', active: false },
                    { icon: Calendar,     label: 'Bookings',     active: false },
                    { icon: ShieldCheck,  label: 'Visa Tracker', active: false },
                    { icon: Users,        label: 'Clients',      active: false },
                    { icon: FileText,     label: 'Invoices',     active: false },
                  ].map(item => (
                    <div key={item.label}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 ${
                        item.active ? 'bg-blue-50 text-blue-600' : 'text-gray-400'
                      }`}>
                      <item.icon size={12} />
                      <span className="text-xs">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: 'Total Bookings',  value: '247',          color: 'text-blue-600',   bg: 'bg-blue-50'   },
                      { label: 'Revenue',         value: 'PKR 8.4M',     color: 'text-purple-600', bg: 'bg-purple-50' },
                      { label: 'Gross Profit',    value: 'PKR 1.2M',     color: 'text-green-600',  bg: 'bg-green-50'  },
                      { label: 'Umrah Groups',    value: '18',           color: 'text-orange-600', bg: 'bg-orange-50' },
                    ].map(stat => (
                      <div key={stat.label} className={`${stat.bg} rounded-xl p-3`}>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className={`text-sm font-bold ${stat.color} mt-0.5`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent bookings table */}
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Recent Bookings</p>
                    <div className="space-y-1.5">
                      {[
                        { ref: 'TP-2024-0142', client: 'Ahmed Khan',    dest: 'Istanbul',       status: 'confirmed', amount: '285,000' },
                        { ref: 'TP-2024-0141', client: 'Sara Malik',    dest: 'Umrah Package',  status: 'inquiry',   amount: '195,000' },
                        { ref: 'TP-2024-0140', client: 'Bilal Ahmed',   dest: 'Dubai',          status: 'completed', amount: '320,000' },
                        { ref: 'TP-2024-0139', client: 'Fatima Sheikh', dest: 'Malaysia',       status: 'confirmed', amount: '240,000' },
                      ].map(b => (
                        <div key={b.ref} className="flex items-center gap-3 text-xs py-1 border-b border-gray-50">
                          <span className="font-mono text-blue-600 w-24 shrink-0">{b.ref}</span>
                          <span className="text-gray-700 flex-1">{b.client}</span>
                          <span className="text-gray-400 hidden md:block flex-1">{b.dest}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${
                            b.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                            b.status === 'completed' ? 'bg-blue-50  text-blue-600'  :
                                                        'bg-yellow-50 text-yellow-600'
                          }`}>
                            {b.status}
                          </span>
                          <span className="text-gray-600 font-medium shrink-0">
                            PKR {b.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating feature badges */}
          <div className="absolute -left-6 top-1/4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 hidden lg:flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Profit: PKR 1.2M</p>
              <p className="text-xs text-gray-400">This month</p>
            </div>
          </div>

          <div className="absolute -right-6 top-1/3 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 hidden lg:flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
              <Sparkles size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">AI Itinerary Ready</p>
              <p className="text-xs text-gray-400">Turkey 7 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────── */}
      <section className="bg-blue-600 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '50+',    label: 'Travel agencies'      },
            { value: '10,000+', label: 'Bookings managed'     },
            { value: '99.9%',   label: 'Uptime guaranteed'    },
            { value: '24/7',    label: 'Pakistani support'    },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-blue-200 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm">Everything you need</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2 mb-4">
              Ek Software, Sab Kuch
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Chhoti agency ho ya bari — TravelPro mein sab kuch hai jo aapki
              agency ko professional banane ke liye chahiye
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon:  Calendar,
                color: 'bg-blue-100 text-blue-600',
                title: 'Smart Booking Engine',
                desc:  'Inquiry se le kar completion tak — complete booking lifecycle manage karein. Status tracking, payment history, aur automatic booking reference.',
                badge: null,
              },
              {
                icon:  Sparkles,
                color: 'bg-purple-100 text-purple-600',
                title: 'AI Trip Planner',
                desc:  'Sirf destination aur budget bataiye — AI poora itinerary bana dega. Hotels, activities, costs, aur tips — Urdu aur English mein.',
                badge: 'NEW ✨',
              },
              {
                icon:  ShieldCheck,
                color: 'bg-green-100 text-green-600',
                title: 'Visa Tracker',
                desc:  'Har passenger ka visa status track karein. Applied, processing, approved — sab kuch ek jagah. Expiry alerts automatically.',
                badge: null,
              },
              {
                icon:  Users,
                color: 'bg-orange-100 text-orange-600',
                title: 'Client CRM',
                desc:  'Complete client profiles with passport details, travel history, aur notes. Kabhi bhi client ki puri history ek click mein.',
                badge: null,
              },
              {
                icon:  Receipt,
                color: 'bg-red-100 text-red-600',
                title: 'Profit Calculator',
                desc:  'Flight, hotel, visa costs enter karein — software automatically profit margin calculate kar dega. PKR mein real-time P&L.',
                badge: null,
              },
              {
                icon:  FileText,
                color: 'bg-teal-100 text-teal-600',
                title: 'Invoice & Voucher PDF',
                desc:  'Professional invoices aur booking vouchers PDF mein generate karein. Agency logo ke saath branded documents clients ko bhejiein.',
                badge: null,
              },
              {
                icon:  MessageCircle,
                color: 'bg-green-100 text-green-600',
                title: 'WhatsApp Notifications',
                desc:  'Booking confirmation, payment receipt, aur travel reminders directly WhatsApp pe clients ko bhejiein. Urdu mein bhi.',
                badge: null,
              },
              {
                icon:  Building2,
                color: 'bg-blue-100 text-blue-600',
                title: 'Supplier Management',
                desc:  'Hotels, airlines, visa agents — sab suppliers ek jagah. Contracts, contacts, aur payment terms organized rakhein.',
                badge: null,
              },
              {
                icon:  BarChart3,
                color: 'bg-purple-100 text-purple-600',
                title: 'Reports & Analytics',
                desc:  'Monthly P&L, top clients, booking trends — sab kuch clear charts mein. Agency ki performance ek nazar mein dekh saktein hain.',
                badge: null,
              },
            ].map(feature => (
              <div key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center`}>
                    <feature.icon size={22} />
                  </div>
                  {feature.badge && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UMRAH HIGHLIGHT ──────────────────────────── */}
      <section id="umrah" className="py-20 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div>
              <span className="text-green-600 font-semibold text-sm flex items-center gap-2 mb-3">
                <span className="text-xl">🕋</span>
                Pakistan ka No.1 Umrah Software
              </span>
              <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                Umrah Agency Management
                <span className="text-green-600"> Bilkul Aasan</span>
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Pakistan mein hazar Umrah agencies hain jo aaj bhi Excel aur
                WhatsApp groups mein kaam karti hain. TravelPro ne specially
                Pakistani Umrah agencies ke liye yeh features banaye hain.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon:  '🕋',
                    title: 'Complete Umrah Module',
                    desc:  'Makkah/Madinah hotels, Maktab number, Ziarat, transport — sab kuch ek booking mein',
                  },
                  {
                    icon:  '👥',
                    title: 'Group Booking Manager',
                    desc:  'Ek group mein 50+ passengers — har passenger ka alag passport, visa, aur payment track karein',
                  },
                  {
                    icon:  '🛂',
                    title: 'Saudi Visa Tracker',
                    desc:  'Har pilgrim ka visa status real-time mein. Expiry alerts 30 din pehle automatically',
                  },
                  {
                    icon:  '📄',
                    title: 'Umrah Voucher PDF',
                    desc:  'Complete voucher with flights, hotels, Maktab number — professionally designed',
                  },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/register"
                className="inline-flex items-center gap-2 mt-8 bg-green-600 hover:bg-green-700 text-white font-bold px-7 py-4 rounded-2xl transition shadow-lg shadow-green-100">
                Umrah Agency Setup Karein
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Umrah booking card mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-mono text-blue-600 font-bold text-sm">TP-2024-0142</p>
                    <p className="font-bold text-gray-900 text-lg mt-0.5">Ahmed Khan Family</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    🕋 Umrah
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                  {[
                    { label: 'Departure',    value: 'Karachi → Jeddah' },
                    { label: 'Airline',      value: 'Saudi Airlines'   },
                    { label: 'Makkah Hotel', value: 'Marriott (5★)'    },
                    { label: 'Nights',       value: '7 Makkah + 3 Mad' },
                    { label: 'Visa',         value: 'Umrah Visa'       },
                    { label: 'Maktab',       value: '14'               },
                  ].map(row => (
                    <div key={row.label}>
                      <p className="text-xs text-gray-400">{row.label}</p>
                      <p className="font-semibold text-gray-800">{row.value}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-gray-500">Total amount</span>
                    <span className="font-bold text-gray-900">PKR 285,000</span>
                  </div>
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-gray-500">Amount paid</span>
                    <span className="text-green-600 font-bold">PKR 185,000</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">65% paid • PKR 100,000 remaining</p>
                </div>

                {/* Visa status row */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { name: 'Ahmed Khan',  status: 'Approved ✓', color: 'bg-green-50 text-green-700' },
                    { name: 'Sara Khan',   status: 'Processing', color: 'bg-blue-50  text-blue-700'  },
                    { name: 'Ali Khan',    status: 'Applied',    color: 'bg-yellow-50 text-yellow-700'},
                    { name: 'Hina Khan',   status: 'Approved ✓', color: 'bg-green-50 text-green-700' },
                  ].map(v => (
                    <div key={v.name} className={`${v.color} rounded-lg px-2.5 py-1.5`}>
                      <p className="text-xs font-medium">{v.name}</p>
                      <p className="text-xs">{v.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-100 rounded-2xl -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-blue-100 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── AI HIGHLIGHT ─────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* AI mockup */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden order-2 lg:order-1">
              <div className="p-5 border-b border-gray-100" style={{
                background: 'linear-gradient(135deg, #f5f3ff, #eff6ff)'
              }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">AI Trip Planner</p>
                    <p className="text-xs text-gray-500">Urdu + English</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Destination', value: 'Istanbul, Turkey'    },
                    { label: 'Duration',    value: '7 days'             },
                    { label: 'Budget',      value: 'PKR 300,000'        },
                    { label: 'Style',       value: 'Family halal'       },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg px-3 py-2">
                      <p className="text-gray-400">{item.label}</p>
                      <p className="font-semibold text-gray-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs font-bold text-gray-700">Generated Itinerary:</p>
                {[
                  { day: 'Day 1', title: 'Arrival & Sultanahmet',           cost: '12,000',  time: 'Full day'     },
                  { day: 'Day 2', title: 'Topkapi Palace & Bosphorus Tour', cost: '18,000',  time: 'Full day'     },
                  { day: 'Day 3', title: 'Cappadocia Hot Air Balloon',      cost: '35,000',  time: 'Early morning'},
                  { day: 'Day 4', title: 'Ephesus Ancient City Tour',       cost: '22,000',  time: 'Full day'     },
                ].map((day, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                    i === 0 ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50'
                  }`}>
                    <div className={`w-12 text-center shrink-0 py-1 rounded-lg text-xs font-bold ${
                      i === 0
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-200   text-gray-600'
                    }`}>
                      {day.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{day.title}</p>
                      <p className="text-xs text-gray-400">{day.time}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium shrink-0">
                      PKR {day.cost}
                    </span>
                  </div>
                ))}

                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total estimated budget</span>
                    <span className="font-bold text-green-700">PKR 2,80,000 – 3,20,000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-purple-600 font-semibold text-sm flex items-center gap-2 mb-3">
                <Sparkles size={14} />
                Powered by Claude AI
              </span>
              <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                AI se Poora Itinerary
                <span className="text-purple-600"> Seconds Mein</span>
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Agent sirf destination aur budget bata de — AI akela poora
                7-day itinerary bana deta hai. Hotels, activities, costs,
                restaurants, tips — sab kuch. Urdu mein bhi.
              </p>

              <div className="space-y-3">
                {[
                  'Day-by-day detailed schedule with timings',
                  'Hotel suggestions with star ratings aur costs',
                  'Visa requirements aur processing time',
                  'Packing list aur important tips',
                  'Ek click mein booking mein convert karein',
                  'Urdu aur English dono mein generate',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="text-purple-600" />
                    </div>
                    <p className="text-gray-600 text-sm">{item}</p>
                  </div>
                ))}
              </div>

              <Link href="/register"
                className="inline-flex items-center gap-2 mt-8 text-white font-bold px-7 py-4 rounded-2xl transition shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                AI Planner Try Karein
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm">Simple pricing</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2 mb-4">
              Pakistani Agencies ke Liye Affordable Plans
            </h2>
            <p className="text-gray-500">
              Koi hidden fees nahi. Monthly ya yearly — aap decide karein.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1 mt-6">
              <button
                onClick={() => setActivePrice('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  activePrice === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActivePrice('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  activePrice === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Yearly
                <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  2 month free
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name:     'Starter',
                urdu:     'ابتدائی',
                price:    activePrice === 'monthly' ? 2000  : 20000,
                popular:  false,
                color:    'border-gray-200',
                features: [
                  '1 agent account',
                  '50 bookings/month',
                  'Client CRM',
                  'Basic booking management',
                  'PDF vouchers',
                  'Email support',
                ],
                cta:      'Start Free Trial',
                ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
              },
              {
                name:     'Professional',
                urdu:     'پیشہ ورانہ',
                price:    activePrice === 'monthly' ? 5000  : 50000,
                popular:  true,
                color:    'border-blue-500',
                features: [
                  '5 agent accounts',
                  'Unlimited bookings',
                  'Umrah module 🕋',
                  'Visa tracker',
                  'Group bookings',
                  'Invoice generator',
                  'WhatsApp notifications',
                  'Expense & profit tracker',
                  'Priority support',
                ],
                cta:      'Start Free Trial',
                ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700',
              },
              {
                name:     'Agency',
                urdu:     'ایجنسی',
                price:    activePrice === 'monthly' ? 10000 : 100000,
                popular:  false,
                color:    'border-gray-200',
                features: [
                  'Unlimited agents',
                  'Unlimited everything',
                  'AI Trip Planner ✨',
                  'Urdu language UI',
                  'Custom branding',
                  'API access',
                  'Dedicated manager',
                  'Custom features',
                ],
                cta:      'Contact Sales',
                ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
              },
            ].map(plan => (
              <div key={plan.name}
                className={`relative rounded-2xl border-2 p-7 ${plan.color} ${
                  plan.popular ? 'shadow-xl shadow-blue-100' : ''
                }`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                      Most Popular ⭐
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                    <span className="text-gray-400 text-sm" dir="rtl">{plan.urdu}</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-4xl font-black text-gray-900">
                      PKR {plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">
                      /{activePrice === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-7">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Check size={9} className={plan.popular ? 'text-blue-600' : 'text-gray-600'} />
                      </div>
                      <span className="text-sm text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>

                <Link href="/register"
                  className={`block text-center font-semibold py-3 rounded-xl transition text-sm ${plan.ctaStyle}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Sab plans mein 14-day free trial shamil hai. Koi credit card nahi chahiye.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm">Real agencies, real results</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2">
              Pakistani Agencies Kya Kehti Hain
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name:    'Muhammad Asif',
                agency:  'Al-Haramain Travels, Karachi',
                rating:  5,
                review:  'Pehle sab kuch WhatsApp pe hota tha. Ab TravelPro se Umrah groups manage karna itna aasan ho gaya. Visa tracker ne bahut time bacha liya.',
                avatar:  'MA',
                color:   'bg-blue-100 text-blue-700',
              },
              {
                name:    'Fatima Zahra',
                agency:  'Dream Tours, Lahore',
                rating:  5,
                review:  'AI trip planner ne hamara kaam 10x fast kar diya. Client ko pehle 2 din mein itinerary milti thi, ab 2 minute mein. Clients bahut khush hain.',
                avatar:  'FZ',
                color:   'bg-purple-100 text-purple-700',
              },
              {
                name:    'Ahmed Raza',
                agency:  'Sky High Travel, Islamabad',
                rating:  5,
                review:  'Profit calculator ne aankhein khol dein. Pata hi nahi tha kaun si booking mein kitna faida ho raha tha. Ab har cheez clear hai.',
                avatar:  'AR',
                color:   'bg-green-100 text-green-700',
              },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  "{t.review}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.agency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / TRUST ────────────────────────────── */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-blue-600 font-semibold text-sm">Why TravelPro</span>
          <h2 className="text-4xl font-black text-gray-900 mt-2 mb-6">
            Pakistan ke Liye Banaya Gaya
          </h2>
          <p className="text-gray-500 leading-relaxed mb-12 max-w-2xl mx-auto">
            TravelPro sirf ek generic software nahi hai. Yeh specifically Pakistan ki
            travel industry ke liye banaya gaya hai — Umrah agencies, Pakistan ki currency,
            WhatsApp culture, aur Pakistani travelers ki zarooraton ko samajh ke.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🇵🇰', title: 'Made for Pakistan',   desc: 'PKR currency, Urdu support, local needs' },
              { icon: '🕋',   title: 'Umrah Specialized',  desc: 'Built specifically for Umrah agencies'   },
              { icon: '🔒',   title: '100% Secure',        desc: 'Your data is safe and encrypted'         },
              { icon: '📱',   title: 'Mobile Ready',       desc: 'Works on any device, anywhere'           },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="py-20 px-6 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-700 rounded-full opacity-50" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            Apni Agency Ko Aaj Hi
            <br />Digitize Karein
          </h2>
          <p className="text-blue-200 text-lg mb-10">
            14-day free trial. Koi credit card nahi. Setup 5 minute mein.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
              className="flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition shadow-lg text-base">
              Free Trial Shuru Karein
              <ArrowRight size={18} />
            </Link>
            <a href="#features"
              className="flex items-center justify-center gap-2 border-2 border-blue-400 text-white font-medium px-8 py-4 rounded-2xl hover:bg-blue-700 transition text-base">
              Features Dekhein
            </a>
          </div>
          <p className="text-blue-300 text-sm mt-6">
            ✈️ Pakistan ki 50+ travel agencies ne already TravelPro ko choose kiya hai
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Plane size={16} className="text-white" />
                </div>
                <span className="font-bold text-xl text-white">TravelPro</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Pakistan ka no.1 travel agency management software.
                Umrah agencies ke liye specially designed.
              </p>
              <p className="text-sm" dir="rtl">
                پاکستان کی سفری ایجنسیوں کے لیے مکمل حل
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Product</p>
              <div className="space-y-2 text-sm">
                {['Features', 'Pricing', 'AI Planner', 'Umrah Module', 'Changelog'].map(item => (
                  <a key={item} href="#"
                    className="block hover:text-white transition">{item}</a>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Support</p>
              <div className="space-y-2 text-sm">
                {['Help Center', 'Contact Us', 'WhatsApp Support', 'Privacy Policy', 'Terms of Service'].map(item => (
                  <a key={item} href="#"
                    className="block hover:text-white transition">{item}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              © 2024 TravelPro Pakistan. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>Made with</span>
              <span className="text-red-400">❤️</span>
              <span>for Pakistani travel agencies</span>
              <span>🇵🇰</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}