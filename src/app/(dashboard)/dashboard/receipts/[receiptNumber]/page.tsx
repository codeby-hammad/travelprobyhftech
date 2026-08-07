import { createClient }  from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import Link              from 'next/link'
import { ArrowLeft }     from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { requirePermission } from '@/lib/requirePermission'
import PrintReceiptButton from '@/components/receipts/PrintReceiptButton'

export default async function ReceiptDetailPage({
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

  // Try the walk-in sale first
  const { data: dailySale } = await supabase
    .from('daily_ticket_sales')
    .select('*')
    .eq('organization_id', orgId)
    .eq('receipt_number', receiptNumber)
    .maybeSingle()

  // Otherwise it's a batch sale — could be 1 (single) or several (group)
  // passengers sharing this receipt number
  const { data: batchPassengers } = !dailySale
    ? await supabase
        .from('ticket_passengers')
        .select('*, batch:ticket_batches(airline, flight_number, flight_date, route_from, route_to, seat_class)')
        .eq('organization_id', orgId)
        .eq('receipt_number', receiptNumber)
    : { data: null }

  if (!dailySale && (!batchPassengers || batchPassengers.length === 0)) {
    notFound()
  }

  const isWalkIn = Boolean(dailySale)
  const batch    = batchPassengers?.[0]?.batch

  const totalAmount = isWalkIn
    ? Number(dailySale.sold_price)
    : (batchPassengers ?? []).reduce((s, p: any) => s + Number(p.ticket_price ?? 0), 0)

  const currency = isWalkIn ? dailySale.currency : batchPassengers?.[0]?.currency ?? 'PKR'
  const saleDate = isWalkIn ? (dailySale.sale_date ?? dailySale.created_at) : batchPassengers?.[0]?.created_at

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/dashboard/receipts" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Receipts
        </Link>
        <PrintReceiptButton />
      </div>

      {/* Printable receipt */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 print:border-0 print:shadow-none">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {org?.logo_url && (
              <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
              <p className="font-bold text-gray-900 text-lg">{org?.name ?? 'Travel Agency'}</p>
              <p className="text-xs text-gray-400">Ticket Sale Receipt</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-blue-600 font-bold">{receiptNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(saleDate)}</p>
          </div>
        </div>

        {/* Flight info */}
        <div className="bg-blue-50 rounded-xl p-4 mb-5">
          <p className="text-xs text-blue-400 uppercase font-medium mb-1">Flight</p>
          <p className="font-bold text-blue-900 text-lg">
            {isWalkIn
              ? `${dailySale.route_from} → ${dailySale.route_to}`
              : `${batch?.route_from ?? '—'} → ${batch?.route_to ?? '—'}`}
          </p>
          <p className="text-blue-600 text-sm mt-0.5">
            {isWalkIn ? dailySale.airline : batch?.airline}
            {(isWalkIn ? dailySale.flight_number : batch?.flight_number) && ` · ${isWalkIn ? dailySale.flight_number : batch?.flight_number}`}
            {' · '}
            {formatDate(isWalkIn ? dailySale.flight_date : batch?.flight_date)}
          </p>
          {isWalkIn && dailySale.pnr && (
            <p className="text-xs text-blue-400 mt-1 font-mono">PNR: {dailySale.pnr}</p>
          )}
        </div>

        {/* Passenger(s) */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 uppercase font-medium mb-2">
            Passenger{!isWalkIn && (batchPassengers?.length ?? 0) > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {isWalkIn ? (
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{dailySale.buyer_name}</p>
                  <p className="text-xs text-gray-400">
                    {dailySale.buyer_passport && `Passport: ${dailySale.buyer_passport}`}
                  </p>
                </div>
                <p className="font-bold text-gray-900 text-sm">{formatCurrency(dailySale.sold_price, dailySale.currency)}</p>
              </div>
            ) : (
              (batchPassengers ?? []).map((p: any) => (
                <div key={p.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.full_name}</p>
                    <p className="text-xs text-gray-400">
                      {p.seat_number && `Seat ${p.seat_number}`}
                      {p.eticket_number && ` · ${p.eticket_number}`}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{formatCurrency(p.ticket_price, p.currency)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Payment</p>
            <p className="text-sm font-medium text-gray-700 capitalize">
              {isWalkIn
                ? `${dailySale.payment_method?.replace('_', ' ')} · ${dailySale.payment_status}`
                : (batchPassengers?.[0]?.payment_status ?? '—')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-playfair text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}