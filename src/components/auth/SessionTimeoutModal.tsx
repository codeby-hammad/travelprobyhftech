'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

type Props = {
  isOpen:        boolean
  onStayLoggedIn: () => void
  onLogout:      () => void
}

export default function SessionTimeoutModal({ isOpen, onStayLoggedIn, onLogout }: Props) {
  const [seconds, setSeconds] = useState(60)

  useEffect(() => {
    if (!isOpen) {
      setSeconds(60)
      return
    }

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={24} className="text-orange-600" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Session Expiring Soon
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          You've been inactive for 10 minutes. You'll be automatically logged out in:
        </p>

        <div className="text-4xl font-bold text-orange-600 mb-6 tabular-nums">
          {seconds}s
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            Log out now
          </button>
          <button
            onClick={onStayLoggedIn}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  )
}