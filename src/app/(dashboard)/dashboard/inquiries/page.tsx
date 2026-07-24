import { createClient } from '@/lib/supabase/server'
import { formatDate }   from '@/lib/utils'
import InquiryActions   from '@/components/inquiries/InquiryActions'
import { Inbox }        from 'lucide-react'

export default async function InquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const { data: inquiries } = await supabase
    .from('booking_inquiries')
    .select('*')
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    new:       'bg-blue-50   text-blue-700',
    contacted: 'bg-yellow-50 text-yellow-700',
    converted: 'bg-green-50  text-green-700',
    closed:    'bg-gray-100  text-gray-500',
  }

  const counts = {
    new:       inquiries?.filter(i => i.status === 'new').length       ?? 0,
    contacted: inquiries?.filter(i => i.status === 'contacted').length ?? 0,
    converted: inquiries?.filter(i => i.status === 'converted').length ?? 0,
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Website Inquiries</h1>
        <p className="text-gray-500 text-sm mt-1">
          Booking requests submitted from your public website
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'New',       value: counts.new,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Contacted', value: counts.contacted, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Converted', value: counts.converted, color: 'text-green-600',  bg: 'bg-green-50'  },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Customer</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Service</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Travel Date</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Passengers</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Received</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(!inquiries || inquiries.length === 0) ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400">
                  <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
                  <p>No inquiries yet</p>
                  <p className="text-xs mt-1 text-gray-300">
                    Inquiries from your public website will appear here
                  </p>
                </td>
              </tr>
            ) : (
              inquiries.map((inq: any) => (
                <tr key={inq.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{inq.full_name}</p>
                    <p className="text-xs text-gray-400">{inq.phone}</p>
                    {inq.email && (
                      <p className="text-xs text-gray-400">{inq.email}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-700 text-xs max-w-[140px]">
                    {inq.service_type ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {inq.travel_date ? formatDate(inq.travel_date) : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {inq.num_passengers ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(inq.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                      statusColors[inq.status] ?? 'bg-gray-100 text-gray-500'
                    }`}>
                      {inq.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <InquiryActions inquiry={inq} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}