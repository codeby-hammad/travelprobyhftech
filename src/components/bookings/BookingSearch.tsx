'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition, useState } from 'react'
import { Search, X } from 'lucide-react'

const STATUSES = [
  { value: 'all',       label: 'All'       },
  { value: 'inquiry',   label: 'Inquiry'   },
  { value: 'quoted',    label: 'Quoted'    },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function BookingSearch({
  currentQ,
  currentStatus,
}: {
  currentQ?:      string
  currentStatus?: string
}) {
  const router   = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(currentQ ?? '')

  function updateSearch(newQ: string, newStatus?: string) {
    const params = new URLSearchParams()
    if (newQ)                             params.set('q',      newQ)
    if (newStatus && newStatus !== 'all') params.set('status', newStatus)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-2">

      {/* Search input */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={e => {
            setQ(e.target.value)
            updateSearch(e.target.value, currentStatus)
          }}
          placeholder="Search by ref, client, package, destination..."
          className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {q && (
          <button onClick={() => { setQ(''); updateSearch('', currentStatus) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => updateSearch(q, s.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition border ${
              (currentStatus ?? 'all') === s.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}