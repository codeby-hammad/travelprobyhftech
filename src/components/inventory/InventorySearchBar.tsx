'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function InventorySearchBar() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [value, setValue] = useState(searchParams.get('q') ?? '')

  // Debounce: wait 300ms after typing stops before updating the URL,
  // so we're not re-filtering on every keystroke
  useEffect(() => {
      const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set('q', value)
      else params.delete('q')
      router.replace(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timeout)
  }, [value])

  return (
    <div className="relative flex-1 max-w-xs">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search by city, country, airline..."
        className="w-full pl-8 pr-8 h-9 text-[13px] border border-gray-200 bg-gray-50 focus:bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
