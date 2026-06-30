import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { ShieldCheck, Plus, AlertTriangle } from 'lucide-react'
import VisaStatusBadge from '@/components/visa/VisaStatusBadge'
import VisaSearch from '@/components/visa/VisaSearch'
export default async function VisaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('visa_applications')
    .select('*, client:clients(full_name, phone, passport_number), booking:bookings(booking_ref)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: visas  } = await query
  const { data: alerts } = await supabase
    .from('visa_alerts')
    .select('*')
    .eq('organization_id',
      (await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user!.id)
        .single()
      ).data?.organization_id
    )

  const filtered = visas?.filter(v => {
    if (!q) return true
    const s = q.toLowerCase()
    return (
      (v.client as any)?.full_name?.toLowerCase().includes(s) ||
      v.destination?.toLowerCase().includes(s)               ||
      v.visa_number?.toLowerCase().includes(s)               ||
      (v.booking as any)?.booking_ref?.toLowerCase().includes(s)
    )
  })

  const statusCounts = {
    all:                  visas?.length ?? 0,
    not_applied:          visas?.filter(v => v.status === 'not_applied').length          ?? 0,
    documents_collecting: visas?.filter(v => v.status === 'documents_collecting').length ?? 0,
    applied:              visas?.filter(v => v.status === 'applied').length              ?? 0,
    processing:           visas?.filter(v => v.status === 'processing').length           ?? 0,
    approved:             visas?.filter(v => v.status === 'approved').length             ?? 0,
    rejected:             visas?.filter(v => v.status === 'rejected').length             ?? 0,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visa Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered?.length ?? 0} visa applications
          </p>
        </div>
        <Link href="/dashboard/visa/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> Add visa application
        </Link>
      </div>

      {/* Expiry alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange-600" />
            <p className="font-semibold text-orange-800">
              {alerts.length} visa{alerts.length > 1 ? 's' : ''} expiring within 30 days
            </p>
          </div>
          <div className="space-y-1">
            {alerts.map((a: any) => (
              <p key={a.id} className="text-sm text-orange-700">
                • {a.client_name} — {a.destination} visa expires {formatDate(a.expiry_date)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {Object.entries(statusCounts).map(([s, count]) => (
          <Link
            key={s}
            href={`/dashboard/visa?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${
              (status ?? 'all') === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
            }`}
          >
            {s.replace('_', ' ')} ({count})
          </Link>
        ))}
      </div>

      {/* Search */}
      <VisaSearch currentQ={q} />
        

      {(!filtered || filtered.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <ShieldCheck size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No visa applications yet</p>
          <Link href="/dashboard/visa/new"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            <Plus size={15} /> Add visa application
          </Link>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Client</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Booking</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Destination</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Applied</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Expiry</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{v.client?.full_name}</p>
                    {v.client?.passport_number && (
                      <p className="text-xs text-gray-400 font-mono">{v.client.passport_number}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/bookings/${v.booking_id}`}
                      className="font-mono text-blue-600 hover:underline text-xs">
                      {v.booking?.booking_ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{v.destination}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-gray-600">{v.visa_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <VisaStatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {v.applied_date ? formatDate(v.applied_date) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {v.expiry_date ? (
                      <span className={
                        new Date(v.expiry_date) < new Date(Date.now() + 30*24*60*60*1000)
                          ? 'text-orange-600 font-medium'
                          : 'text-gray-500'
                      }>
                        {formatDate(v.expiry_date)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/visa/${v.id}`}
                      className="text-blue-600 hover:underline text-xs">
                      View
                    </Link>
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