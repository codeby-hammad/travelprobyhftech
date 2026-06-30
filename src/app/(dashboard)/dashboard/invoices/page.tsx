import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  draft:     'bg-gray-100   text-gray-600',
  sent:      'bg-blue-50    text-blue-700',
  paid:      'bg-green-50   text-green-700',
  cancelled: 'bg-red-50     text-red-700',
}

export default async function InvoicesPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, booking:bookings(booking_ref, client:clients(full_name))')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">{invoices?.length ?? 0} invoices</p>
        </div>
        <Link href="/dashboard/invoices/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> Create invoice
        </Link>
      </div>

      {(!invoices || invoices.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No invoices yet</p>
          <Link href="/dashboard/invoices/new"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            <Plus size={15} /> Create invoice
          </Link>
        </div>
      )}

      {invoices && invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Client</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Booking</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Issue date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Due date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Total</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-blue-600">
                      {inv.invoice_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {inv.booking?.client?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/bookings/${inv.booking_id}`}
                      className="font-mono text-xs text-blue-600 hover:underline">
                      {inv.booking?.booking_ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(inv.issue_date)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {inv.due_date ? formatDate(inv.due_date) : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatCurrency(inv.total, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/invoices/${inv.id}`}
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