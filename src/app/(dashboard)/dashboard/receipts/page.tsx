import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { Receipt, FileText, Package } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { requirePermission } from '@/lib/requirePermission'
import ReceiptsSearchBar from '@/components/receipts/ReceiptsSearchBar'

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const perms = await requirePermission('tickets')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  // Walk-in sales (Sell Ticket wizard)
  const { data: dailySales } = await supabase
    .from('daily_ticket_sales')
    .select('id, receipt_number, buyer_name, sold_price, currency, sale_date, route_from, route_to, created_at')
    .eq('organization_id', orgId)
    .not('receipt_number', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  // Batch sales (single + group), grouped by receipt so a group sale shows
  // as ONE receipt row even though it has multiple passenger rows
  const { data: batchPassengers } = await supabase
    .from('ticket_passengers')
    .select('id, receipt_number, full_name, ticket_price, currency, created_at, batch:ticket_batches(route_from, route_to)')
    .eq('organization_id', orgId)
    .not('receipt_number', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  const daily = (dailySales ?? []).map(s => ({
    id:             s.id,
    receipt_number: s.receipt_number as string,
    buyer_name:     s.buyer_name,
    amount:         Number(s.sold_price),
    currency:       s.currency,
    date:           s.sale_date ?? s.created_at,
    route_from:     s.route_from,
    route_to:       s.route_to,
    source:         'walkin' as const,
    passenger_count: 1,
  }))

  // Collapse batch passengers sharing a receipt_number into one row per receipt
  const batchByReceipt = new Map<string, {
    id: string; receipt_number: string; buyer_name: string; amount: number
    currency: string; date: string; route_from: string | null; route_to: string | null
    source: 'batch'; passenger_count: number
  }>()
  for (const p of (batchPassengers ?? []) as any[]) {
    if (!p.receipt_number) continue
    const existing = batchByReceipt.get(p.receipt_number)
    if (existing) {
      existing.amount += Number(p.ticket_price ?? 0)
      existing.passenger_count += 1
    } else {
      batchByReceipt.set(p.receipt_number, {
        id:             p.id,
        receipt_number: p.receipt_number,
        buyer_name:     p.full_name,
        amount:         Number(p.ticket_price ?? 0),
        currency:       p.currency,
        date:           p.created_at,
        route_from:     p.batch?.route_from ?? null,
        route_to:       p.batch?.route_to ?? null,
        source:         'batch',
        passenger_count: 1,
      })
    }
  }

  const allReceipts = [...daily, ...Array.from(batchByReceipt.values())]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  const filtered = q
    ? allReceipts.filter(r => {
        const needle = q.toLowerCase()
        return (
          r.receipt_number?.toLowerCase().includes(needle) ||
          r.buyer_name?.toLowerCase().includes(needle) ||
          r.route_from?.toLowerCase().includes(needle) ||
          r.route_to?.toLowerCase().includes(needle)
        )
      })
    : allReceipts

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
        <p className="text-gray-500 text-sm mt-1">
          Look up, view, or reprint any ticket receipt — walk-in or batch sales
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <ReceiptsSearchBar />
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
            {q ? `No receipts match "${q}"` : 'No receipts yet'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {q ? 'Try a different receipt number, name, or route' : 'Sold tickets will show up here once they have a receipt number'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Receipt #</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Buyer</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Route</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Type</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Date</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Amount</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <tr key={`${r.source}-${r.receipt_number}`} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-blue-600 font-medium">{r.receipt_number}</td>
                  <td className="px-5 py-3 text-gray-900">
                    {r.buyer_name}
                    {r.passenger_count > 1 && (
                      <span className="text-gray-400 text-xs ml-1">+{r.passenger_count - 1} more</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {r.route_from && r.route_to ? `${r.route_from} → ${r.route_to}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${
                      r.source === 'walkin' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {r.source === 'walkin' ? <FileText size={10} /> : <Package size={10} />}
                      {r.source === 'walkin' ? 'Walk-in' : 'Batch'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(r.amount, r.currency)}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/receipts/${r.receipt_number}`}
                      className="text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                    >
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