'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface Props {
  staffId: string
  staffName: string
  onDeleted: () => void
}

export default function DeleteStaffButton({ staffId, staffName, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/staff/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete staff')

      onDeleted()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Remove {staffName}?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50"
        >
          {loading ? 'Removing...' : 'Yes, remove'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
      title="Remove staff member"
    >
      <Trash2 size={15} />
    </button>
  )
}