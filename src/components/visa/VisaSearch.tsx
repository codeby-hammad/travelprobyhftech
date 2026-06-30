'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition, useState } from 'react'
import { Search, X } from 'lucide-react'

export default function VisaSearch({ currentQ }: { currentQ?: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(currentQ ?? '')

  function update(val: string) {
    setQ(val)
    const params = new URLSearchParams()
    if (val) params.set('q', val)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="relative mb-4">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={q}
        onChange={e => update(e.target.value)}
        placeholder="Search by client, destination, visa number, booking ref..."
        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {q && (
        <button
          onClick={() => update('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}