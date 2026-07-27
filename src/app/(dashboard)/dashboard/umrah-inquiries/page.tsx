import { createClient } from '@/lib/supabase/server'
import { formatDate }   from '@/lib/utils'
import { Inbox }        from 'lucide-react'
import Link             from 'next/link'

export default async function UmrahInquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const { data: inquiries } = await supabase
    .from('umrah_inquiries')
    .select('*')
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })

  // Batch-fetch package names for whichever packages these inquiries reference
  const packageIds = Array.from(
    new Set((inquiries ?? []).map(i => i.selected_package_id).filter(Boolean))
  )
  const { data: packagesData } = packageIds.length
    ? await supabase.from('packages').select('id, name').in('id', packageIds)
    : { data: [] as any[] }
  const packageNameById = new Map((packagesData ?? []).map(p => [p.id, p.name]))

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
        <h1 className="text-2xl font-bold text-gray-900">Umrah Queries</h1>
        <p className="text-gray-500 text-sm mt-1">
          Full Umrah booking requests submitted from your public website
        </p>
      </div>

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

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Lead Pilgrim</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Package</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Pilgrims</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Total</th>
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
                  <p>No Umrah queries yet</p>
                  <p className="text-xs mt-1 text-gray-300">
                    Submissions from your public "Book Now" flow will appear here
                  </p>
                </td>
              </tr>
            ) : (
              inquiries.map((inq: any) => {
                const totalPilgrims = (inq.pilgrims_adult ?? 0) + (inq.pilgrims_child ?? 0) + (inq.pilgrims_infant ?? 0)
                return (
                  <tr key={inq.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{inq.primary_contact_name || '—'}</p>
                      <p className="text-xs text-gray-400">{inq.primary_contact_phone}</p>
                      {inq.primary_contact_email && (
                        <p className="text-xs text-gray-400">{inq.primary_contact_email}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-700 text-xs max-w-[160px]">
                      {packageNameById.get(inq.selected_package_id) ?? '—'}
                      {inq.room_tier && <span className="block text-gray-400 capitalize">{inq.room_tier}</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {totalPilgrims} ({inq.pilgrims_adult}A / {inq.pilgrims_child}C / {inq.pilgrims_infant}I)
                    </td>
                    <td className="px-5 py-3 text-gray-700 text-xs font-medium">
                      {inq.total_price != null ? `${inq.currency ?? 'PKR'} ${Number(inq.total_price).toLocaleString()}` : '—'}
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
                      <Link
                        href={`/dashboard/umrah-inquiries/${inq.id}`}
                        className="text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}