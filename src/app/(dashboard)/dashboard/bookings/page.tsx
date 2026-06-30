import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import BookingSearch from '@/components/bookings/BookingSearch'

const statusColors: Record<string, string> = {
  inquiry:   'bg-yellow-50 text-yellow-700',
  quoted:    'bg-blue-50   text-blue-700',
  confirmed: 'bg-green-50  text-green-700',
  cancelled: 'bg-red-50    text-red-700',
  completed: 'bg-gray-100  text-gray-600',
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select('*, client:clients(full_name, phone), package:packages(name, destination)')
    .order('created_at', { ascending: false })

  // Filter by status if provided
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: bookings } = await query

  // Filter by search term client-side (simpler than full-text search setup)
  const filtered = bookings?.filter(b => {
    if (!q) return true
    const search = q.toLowerCase()
    return (
      b.booking_ref?.toLowerCase().includes(search) ||
      (b.client as any)?.full_name?.toLowerCase().includes(search) ||
      (b.package as any)?.name?.toLowerCase().includes(search) ||
      (b.package as any)?.destination?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered?.length ?? 0} bookings
            {q && ` matching "${q}"`}
          </p>
        </div>
        <Link href="/dashboard/bookings/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> New booking
        </Link>
      </div>

      {/* Search + filter bar */}
      <BookingSearch currentQ={q} currentStatus={status} />

      {(!filtered || filtered.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 mt-4">
          <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {q || status ? 'No bookings match your search' : 'No bookings yet'}
          </p>
          {!q && !status && (
            <Link href="/dashboard/bookings/new"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
              <Plus size={15} /> New booking
            </Link>
          )}
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ref</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Client</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Package</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Travel date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/bookings/${b.id}`}
                      className="font-mono text-blue-600 hover:underline font-medium">
                      {b.booking_ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{b.client?.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {b.package?.name ?? <span className="italic text-gray-300">No package</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {b.travel_date ? formatDate(b.travel_date) : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(b.total_amount, b.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}