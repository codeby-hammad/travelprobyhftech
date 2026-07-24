'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'

export default function UnauthorizedToast() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-red-600 text-white px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium">
      <ShieldAlert size={16} className="shrink-0" />
      <span>You don&apos;t have permission to access that page.</span>
      <button
        onClick={() => setShow(false)}
        className="ml-2 text-white/70 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}