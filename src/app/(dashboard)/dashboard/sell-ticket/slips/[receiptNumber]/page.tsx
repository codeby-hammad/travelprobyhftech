import { createClient }  from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import Link              from 'next/link'
import { ArrowLeft }     from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { requirePermission } from '@/lib/requirePermission'
import TicketReceiptPDF  from '@/components/sell-ticket/TicketReceiptPDF'

export default async function SlipDetailPage({
  params,
}: {
  params: Promise<{ receiptNumber: string }>
}) {
  const { receiptNumber } = await params
  await requirePermission('tickets')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organization:organizations(name, logo_url)')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id
  const org: any = profile!.organization

  const { data: sale } = await supabase
    .from('daily_ticket_sales')
    .select('*')
    .eq('organization_id', orgId)
    .eq('receipt_number', receiptNumber)
    .maybeSingle()

  if (!sale) notFound()

  // Connecting/multi-city sales have extra legs saved separately
  const { data: legs } = await supabase
    .from('daily_sale_legs')
    .select('departure_city, arrival_city, leg_number')
    .eq('daily_sale_id', sale.id)
    .order('leg_number', { ascending: true })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/sell-ticket/slips" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> Back to Sales Slips
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono text-blue-600 font-bold">{sale.receipt_number}</p>
            <p className="font-bold text-gray-900 text-lg mt-0.5">{sale.buyer_name}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
            sale.payment_status === 'received' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            {sale.payment_status}
          </span>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 mb-4">
          <p className="font-bold text-blue-900">
            {sale.route_from} → {sale.route_to}
            {sale.return_from && ` ⇄ ${sale.return_from}`}
          </p>
          <p className="text-blue-600 text-xs mt-0.5">
            {sale.airline}{sale.flight_number && ` · ${sale.flight_number}`} · {formatDate(sale.flight_date)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'E-Ticket',  value: sale.eticket_number ?? '—' },
            { label: 'PNR',       value: sale.pnr ?? '—' },
            { label: 'Seat',      value: sale.seat_number ?? '—' },
            { label: 'Class',     value: sale.seat_class },
            { label: 'Baggage',   value: `${sale.baggage_kg ?? 23}kg` },
            { label: 'Payment method', value: sale.payment_method?.replace('_', ' ') },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs text-gray-400">{row.label}</p>
              <p className="font-medium text-gray-900 capitalize">{row.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">Amount paid</span>
          <span className="font-playfair text-xl font-bold text-gray-900">
            {formatCurrency(sale.sold_price, sale.currency)}
          </span>
        </div>
      </div>

      <TicketReceiptPDF
        sale={sale}
        legs={legs && legs.length > 0 ? legs : undefined}
        organization={org}
      />
    </div>
  )
}