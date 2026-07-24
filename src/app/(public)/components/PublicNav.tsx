import Link from 'next/link'

export default function PublicNav() {
  const waClasses = [
    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors',
    'bg-[#25d166]/15 text-[#25d166] border border-[#25d166]/30 hover:bg-[#25d166]/25',
  ].join(' ')

  return (
    <nav className="bg-[#0a1628] sticky top-0 z-50 border-b border-[#c9a84c]/20">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#c9a84c] to-[#e8c96a] rounded-[10px] flex items-center justify-center text-[#0a1628] font-bold text-lg">
            H
          </div>
          <div>
            <p className="text-white font-semibold text-[17px] leading-tight">HAMMAD TRAVELERS</p>
            <p className="text-[#c9a84c] text-[10px] font-semibold tracking-widest uppercase">EST. 2005 · LAHORE</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#services" className="text-white/70 hover:text-[#c9a84c] text-sm font-medium transition-colors">
            Services
          </Link>
          <Link href="#packages" className="text-white/70 hover:text-[#c9a84c] text-sm font-medium transition-colors">
            Packages
          </Link>
          <Link href="#about" className="text-white/70 hover:text-[#c9a84c] text-sm font-medium transition-colors">
            About
          </Link>
          <Link href="#contact" className="text-white/70 hover:text-[#c9a84c] text-sm font-medium transition-colors">
            Contact
          </Link>
          <Link
            href="#book"
            className="bg-[#c9a84c] text-[#0a1628] px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#e8c96a] transition-colors"
          >
            Book Now
          </Link>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className={waClasses}
          >
            <span>💬</span>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </nav>
  )
}