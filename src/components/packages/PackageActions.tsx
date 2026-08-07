'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Props = {
  packageId:   string
  packageName: string
}

export default function PackageActions({ packageId, packageName }: Props) {
  const supabase   = createClient()
  const router     = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    // Check if any bookings use this package
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('package_id', packageId)
      .limit(1)

    if (bookings && bookings.length > 0) {
      setError('Cannot delete — this package has bookings linked to it.')
      setDeleting(false)
      setConfirming(false)
      return
    }

    const { error: deleteError } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId)

    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }

    router.refresh()
  }

  // Confirmation dialog
  
  if (confirming) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => { setConfirming(false); setError(null) }}
        />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-80 border border-gray-100">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Package?</h3>
          <p className="text-sm text-gray-500 text-center mb-5">
            <span className="font-medium text-gray-700">{packageName}</span> will be permanently deleted.
            This cannot be undone.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setConfirming(false); setError(null) }}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Edit button */}
      <Link
        href={`/dashboard/packages/${packageId}/edit`}
        className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm"
        title="Edit package"
        onClick={e => e.stopPropagation()}
      >
        <Pencil size={13} />
      </Link>

      {/* Delete button */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirming(true) }}
        className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
        title="Delete package"
      >
        <Trash2 size={13} />
      </button>
    </>
  )
}