import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { Plus }         from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  unpaid:    'bg-red-50    text-red-700',
  partial:   'bg-yellow-50 text-yellow-700',
  paid:      'bg-green-50  text-green-700',
  overdue:   'bg-red-100   text-red-800',
  cancelled: 'bg-gray-100  text-gray-500',
}

export default async function InvoicesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase   = await createClient()

  let query = supabase
    .from('supplier_invoices')
    .select('*, supplier:suppliers(name, type)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: invoices } = await query

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All invoices</h1>
        <Link href="/dashboard/supplier-payments/invoices/new"
          className="flex items-center gap-2 bg-orange-600 text-white
            px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm
            font-medium">
          <Plus size={16} /> Add invoice
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','unpaid','partial','paid','overdue'].map(s => (
          <Link key={s} href={`?status=${s}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium
              border transition capitalize ${
              (status ?? 'all') === s
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'
            }`}>
            {s}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                Invoice #
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                Supplier
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                Description
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                Date
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                Due
              </th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs">
                Amount
              </th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs">
                Balance
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices?.map((inv: any) => {
              const balance   = Number(inv.amount) - Number(inv.paid_amount)
              const isOverdue = inv.due_date &&
                new Date(inv.due_date) < new Date() &&
                inv.status !== 'paid'

              return (
                <tr key={inv.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/supplier-payments/invoices/${inv.id}`}
                      className="font-mono text-blue-600 hover:underline
                        text-xs font-medium">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {inv.supplier?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {inv.description?.slice(0, 35)}
                    {inv.description?.length > 35 ? '...' : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(inv.invoice_date)}
                  </td>
                  <td className={`px-4 py-3 text-xs ${
                    isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                  }`}>
                    {inv.due_date ? formatDate(inv.due_date) : '—'}
                    {isOverdue && ' ⚠'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(inv.amount, inv.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${
                      balance <= 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {formatCurrency(balance, inv.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      font-medium capitalize ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {(!invoices || invoices.length === 0) && (
          <p className="text-center py-10 text-gray-400 text-sm">
            Koi invoices nahi hain
          </p>
        )}
      </div>
    </div>
  )
}