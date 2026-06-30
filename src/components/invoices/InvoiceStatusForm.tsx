'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvoiceStatusForm({
  invoiceId,
  currentStatus,
}: {
  invoiceId:     string
  currentStatus: string
}) {
  const router   = useRouter()
  const supabase = createClient()
  const [status,  setStatus]  = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    setStatus(newStatus)
    setLoading(true)
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId)
    setLoading(false)
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={loading}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="draft">Draft</option>
      <option value="sent">Sent</option>
      <option value="paid">Paid</option>
      <option value="cancelled">Cancelled</option>
    </select>
  )
}