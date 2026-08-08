import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { Receipt } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { requirePermission } from '@/lib/requirePermission'
import SlipsSearchBar from '@/components/sell-ticket/SlipsSearchBar'

export default async function SalesSlipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  await requirePermission('tickets')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  const { data: sales } = await supabase
    .from('daily_ticket_sales')
    .select('id, receipt_number, eticket_number, buyer_name, route_from, route_to, sold_price, currency, sale_date, payment_status, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(150)

  const filtered = q
    ? (sales ?? []).filter(s => {
        const needle = q.toLowerCase()
        return (
          s.receipt_number?.toLowerCase().includes(needle) ||
          s.buyer_name?.toLowerCase().includes(needle) ||
          s.route_from?.toLowerCase().includes(needle) ||
          s.route_to?.toLowerCase().includes(needle)
        )
      })
    : (sales ?? [])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Slips</h1>
        <p className="text-gray-500 text-sm mt-1">
          Every ticket sold through the Sell Ticket wizard — view or reprint any receipt
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <SlipsSearchBar />
        {q && (
          <p className="text-xs text-gray-400">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{q}"
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Receipt size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {q ? `No slips match "${q}"` : 'No sales slips yet'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {q ? 'Try a different receipt number, name, or route' : 'Sold tickets will show up here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Receipt #</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Passenger</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Route</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Date</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Payment</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Amount</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-blue-600 font-medium">{s.receipt_number ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-900">{s.buyer_name}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {s.route_from && s.route_to ? `${s.route_from} → ${s.route_to}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(s.sale_date ?? s.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      s.payment_status === 'received' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {s.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(s.sold_price, s.currency)}
                  </td>
                  <td className="px-5 py-3">
                    {s.receipt_number ? (
                      <Link
                        href={`/dashboard/sell-ticket/slips/${s.receipt_number}`}
                        className="text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-300">No receipt #</span>
                    )}
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