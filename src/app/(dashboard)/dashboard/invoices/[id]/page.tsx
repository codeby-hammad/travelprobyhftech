import { createClient }   from '@/lib/supabase/server'
import { notFound }       from 'next/navigation'
import Link               from 'next/link'
import { ArrowLeft }      from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import InvoicePDFButton   from '@/components/invoices/InvoicePDFButton'
import InvoiceStatusForm  from '@/components/invoices/InvoiceStatusForm'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      booking:bookings(
        booking_ref, travel_date, currency,
        client:clients(full_name, email, phone, address),
        package:packages(name, destination)
      ),
      items:invoice_items(*),
      created_by_profile:profiles(full_name)
    `)
    .eq('id', id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', invoice?.organization_id)
    .single()

  if (!invoice) notFound()

  const statusStyles: Record<string, string> = {
    draft:     'bg-gray-100  text-gray-600',
    sent:      'bg-blue-50   text-blue-700',
    paid:      'bg-green-50  text-green-700',
    cancelled: 'bg-red-50    text-red-700',
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 font-mono">
                {invoice.invoice_number}
              </h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusStyles[invoice.status]}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Issued {formatDate(invoice.issue_date)}
              {invoice.due_date && ` • Due ${formatDate(invoice.due_date)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <InvoiceStatusForm invoiceId={invoice.id} currentStatus={invoice.status} />
          <InvoicePDFButton invoice={invoice} organization={org} />
        </div>
      </div>

      {/* Invoice preview */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">

        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">{org?.name}</h2>
            <p className="text-gray-500 text-sm mt-1">Travel Agency</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Invoice number</p>
            <p className="font-mono font-bold text-gray-900 text-lg">{invoice.invoice_number}</p>
            <p className="text-xs text-gray-400 mt-2">Issue date</p>
            <p className="text-sm text-gray-700">{formatDate(invoice.issue_date)}</p>
            {invoice.due_date && (
              <>
                <p className="text-xs text-gray-400 mt-1">Due date</p>
                <p className="text-sm text-gray-700">{formatDate(invoice.due_date)}</p>
              </>
            )}
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Bill to</p>
          <p className="font-semibold text-gray-900">{(invoice.booking as any)?.client?.full_name}</p>
          <p className="text-sm text-gray-500">{(invoice.booking as any)?.client?.email}</p>
          <p className="text-sm text-gray-500">{(invoice.booking as any)?.client?.phone}</p>
          {(invoice.booking as any)?.client?.address && (
            <p className="text-sm text-gray-500">{(invoice.booking as any).client.address}</p>
          )}
        </div>

        {/* Booking ref */}
        <div className="mb-6 bg-gray-50 rounded-lg px-4 py-3 text-sm">
          <span className="text-gray-500">Booking reference: </span>
          <Link href={`/dashboard/bookings/${invoice.booking_id}`}
            className="font-mono text-blue-600 hover:underline font-medium">
            {(invoice.booking as any)?.booking_ref}
          </Link>
          {(invoice.booking as any)?.package?.name && (
            <span className="text-gray-500 ml-3">• {(invoice.booking as any).package.name}</span>
          )}
        </div>

        {/* Line items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-gray-600 font-medium">Description</th>
              <th className="text-center py-2 text-gray-600 font-medium w-16">Qty</th>
              <th className="text-right py-2 text-gray-600 font-medium w-32">Unit price</th>
              <th className="text-right py-2 text-gray-600 font-medium w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items as any[])?.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-3 text-gray-800">{item.description}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">
                  {formatCurrency(item.unit_price, invoice.currency)}
                </td>
                <td className="py-3 text-right font-medium text-gray-900">
                  {formatCurrency(item.total, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>- {formatCurrency(invoice.discount, invoice.currency)}</span>
              </div>
            )}
            {invoice.tax_rate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t-2 border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes + Terms */}
        {invoice.notes && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-1">Terms & conditions</p>
            <p className="text-xs text-gray-500">{invoice.terms}</p>
          </div>
        )}
      </div>
    </div>
  )
}