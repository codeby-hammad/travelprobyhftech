import { createClient }    from '@/lib/supabase/server'
import { notFound }        from 'next/navigation'
import Link                from 'next/link'
import { ArrowLeft }       from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import TicketVoucherButton from '@/components/inventory/TicketVoucherButton'

export default async function GroupSaleDetailPage({
  params,
}: {
  params: Promise<{ id: string; saleId: string }>
}) {
  const { id, saleId } = await params
  const supabase        = await createClient()

  const [{ data: sale }, { data: batch }, { data: passengers }, { data: legs }] =
  await Promise.all([
    supabase
      .from('ticket_group_sales')
      .select('*, lead_client:clients(full_name, phone)')
      .eq('id', saleId)
      .single(),
    supabase
      .from('ticket_batches')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('ticket_passengers')
      .select('*')
      .eq('group_sale_id', saleId)
      .order('age_category'),
    supabase
      .from('ticket_flight_legs')
      .select('*')
      .eq('batch_id', id)
      .order('leg_number'),
  ])

  if (!sale || !batch) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', batch.organization_id)
    .single()

  const ageCatColors: Record<string, string> = {
    adult:  'bg-blue-50   text-blue-700',
    child:  'bg-purple-50 text-purple-700',
    infant: 'bg-orange-50 text-orange-700',
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/inventory/${id}`}
            className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                {sale.group_ref}
              </h1>
              {sale.pnr && (
                <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-mono font-bold">
                  PNR: {sale.pnr}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {batch.airline} • {batch.route_from} → {batch.route_to} •{' '}
              {formatDate(batch.flight_date)}
              {batch.flight_number && ` • ${batch.flight_number}`}
            </p>
          </div>
        </div>

        {/* Print all tickets button */}
        <TicketVoucherButton
  sale={sale}
  batch={batch}
  passengers={passengers ?? []}
  legs={legs ?? []}
  organization={org}
/>
      </div>

      {/* Sale summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total passengers',
            value: sale.total_pax,
            sub:   `${sale.adult_count}A ${sale.child_count}C ${sale.infant_count}I`,
          },
          {
            label: 'Total amount',
            value: formatCurrency(sale.total_amount, sale.currency),
            sub:   sale.payment_method,
          },
          {
            label: 'Amount paid',
            value: formatCurrency(sale.paid_amount, sale.currency),
            sub:   '',
          },
          {
            label: 'Balance',
            value: formatCurrency(
              sale.total_amount - sale.paid_amount, sale.currency
            ),
            sub: sale.payment_status,
          },
        ].map(card => (
          <div key={card.label}
            className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400">{card.label}</p>
            <p className="font-black text-gray-900 mt-0.5">{card.value}</p>
            {card.sub && (
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Flight details card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 mb-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">
              {batch.airline}
              {batch.flight_number && ` • ${batch.flight_number}`}
            </p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-3xl font-black">{batch.route_from?.split(' ')[0]}</p>
                <p className="text-blue-200 text-xs">{batch.route_from}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <div className="w-12 h-px bg-blue-300" />
                  <span className="text-2xl">✈</span>
                  <div className="w-12 h-px bg-blue-300" />
                </div>
                <p className="text-blue-200 text-xs mt-1 capitalize">{batch.seat_class}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{batch.route_to?.split(' ')[0]}</p>
                <p className="text-blue-200 text-xs">{batch.route_to}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Date</p>
            <p className="text-white font-bold">
              {new Date(batch.flight_date).toLocaleDateString('en-PK', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </p>
            {sale.pnr && (
              <>
                <p className="text-blue-200 text-xs mt-2">PNR</p>
                <p className="text-white font-bold font-mono">{sale.pnr}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Passengers table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Passenger manifest ({passengers?.length ?? 0})
          </h2>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              {sale.adult_count} Adult
            </span>
            {sale.child_count > 0 && (
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                {sale.child_count} Child
              </span>
            )}
            {sale.infant_count > 0 && (
              <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                {sale.infant_count} Infant
              </span>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">#</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                Passenger name
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Type</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                Passport
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Seat</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                E-Ticket
              </th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs">
                Fare
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {passengers?.map((pax: any, i: number) => (
              <tr key={pax.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900 font-mono">
                    {pax.full_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {pax.nationality}
                    {pax.date_of_birth && ` • DOB: ${formatDate(pax.date_of_birth)}`}
                    {pax.gender && ` • ${pax.gender === 'male' ? 'M' : 'F'}`}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                    ageCatColors[pax.age_category]
                  }`}>
                    {pax.age_category === 'adult'  ? 'ADT' :
                     pax.age_category === 'child'  ? 'CHD' : 'INF'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {pax.passport_number ?? '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">
                  {pax.seat_number ?? (pax.age_category === 'infant' ? 'LAP' : '—')}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-blue-600">
                  {pax.eticket_number ?? '—'}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs">
                  {formatCurrency(pax.ticket_price, pax.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td colSpan={6} className="px-4 py-3 font-bold text-gray-900">
                Total
              </td>
              <td className="px-4 py-3 text-right font-black text-blue-600">
                {formatCurrency(sale.total_amount, sale.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}