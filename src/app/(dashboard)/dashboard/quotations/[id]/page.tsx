import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import QuoteActions from '@/components/quotations/QuoteActions'
import QuotePdfButton from '@/components/quotations/QuotePdfButton'

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase
      .from('quotations')
      .select('*, client:clients(id, full_name, email, phone)')
      .eq('id', id)
      .single(),
    supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', id)
      .order('sort_order'),
  ])

  if (!quote) notFound()

  const statusColors: Record<string, string> = {
    draft:     'bg-gray-100  text-gray-600',
    sent:      'bg-blue-50   text-blue-700',
    accepted:  'bg-green-50  text-green-700',
    declined:  'bg-red-50    text-red-700',
    expired:   'bg-orange-50 text-orange-700',
    converted: 'bg-purple-50 text-purple-700',
  }

  const recipientName = quote.client?.full_name ?? quote.lead_name
  const recipientEmail = quote.client?.email ?? quote.lead_email
  const recipientPhone = quote.client?.phone ?? quote.lead_phone

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/quotations" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{quote.quote_number}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[quote.status]}`}>
              {quote.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm">{quote.title}</p>
        </div>
        <QuotePdfButton quote={quote} items={items ?? []} />
      </div>

      {/* Recipient */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          {quote.client_id ? 'Client' : 'Lead'}
        </h3>
        <p className="text-sm text-gray-900 font-medium">{recipientName}</p>
        <div className="flex gap-4 mt-1">
          {recipientEmail && <p className="text-xs text-gray-500">{recipientEmail}</p>}
          {recipientPhone && <p className="text-xs text-gray-500">{recipientPhone}</p>}
        </div>
      </div>

      {/* Quote info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-400">Destination</p>
          <p className="text-sm text-gray-900 font-medium">{quote.destination ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Travel date</p>
          <p className="text-sm text-gray-900 font-medium">
            {quote.travel_date ? formatDate(quote.travel_date) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Valid until</p>
          <p className="text-sm text-gray-900 font-medium">
            {quote.valid_until ? formatDate(quote.valid_until) : '—'}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Item</th>
              <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Description</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">Qty</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">Price</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(items ?? []).map((item: any) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5 text-gray-500 text-xs capitalize">{item.item_type}</td>
                <td className="px-4 py-2.5 text-gray-900">{item.description}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{Number(item.unit_price).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{Number(item.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-gray-100 p-4 space-y-1.5 ml-auto max-w-xs">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900">Rs {Number(quote.subtotal).toLocaleString()}</span>
          </div>
          {quote.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-red-600">- Rs {Number(quote.discount).toLocaleString()}</span>
            </div>
          )}
          {quote.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-900">+ Rs {Number(quote.tax).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base pt-1.5 border-t border-gray-100">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-blue-600">Rs {Number(quote.total).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{quote.notes}</p>
        </div>
      )}

      {/* Actions */}
      <QuoteActions quote={quote} />
    </div>
  )
}