import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function GroupBookingsPage() {
  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('group_bookings')
    .select(`
      *,
      booking:bookings(booking_ref, status, travel_date, total_amount, currency),
      leader:clients(full_name),
      passengers:group_passengers(id)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">{groups?.length ?? 0} groups</p>
        </div>
        <Link href="/dashboard/groups/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> New group booking
        </Link>
      </div>

      {(!groups || groups.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No group bookings yet</p>
          <Link href="/dashboard/groups/new"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            <Plus size={15} /> New group booking
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups?.map((g: any) => (
          <Link key={g.id} href={`/dashboard/groups/${g.id}`}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-100 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{g.group_name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {g.booking?.booking_ref}
                </p>
              </div>
              <div className="bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 text-xs font-semibold">
                {g.passengers?.length ?? 0} pax
              </div>
            </div>

            <div className="space-y-1.5 text-sm text-gray-500">
              {g.leader && (
                <p>👤 Leader: <span className="text-gray-700">{g.leader.full_name}</span></p>
              )}
              {g.booking?.travel_date && (
                <p>✈ {formatDate(g.booking.travel_date)}</p>
              )}
              {g.booking?.total_amount && (
                <p>💰 {formatCurrency(g.booking.total_amount, g.booking.currency)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}