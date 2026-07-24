import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function QuotationsPage() {
  const supabase = await createClient()

  const { data: quotations } = await supabase
    .from('quotations')
    .select('*, client:clients(full_name)')
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    draft:     'bg-gray-100  text-gray-600',
    sent:      'bg-blue-50   text-blue-700',
    accepted:  'bg-green-50  text-green-700',
    declined:  'bg-red-50    text-red-700',
    expired:   'bg-orange-50 text-orange-700',
    converted: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-500 text-sm">Build and send quotes to clients or leads</p>
        </div>
        <Link
          href="/dashboard/quotations/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus size={16} />
          New Quotation
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Quote #</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Client / Lead</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Title</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Total</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(!quotations || quotations.length === 0) ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <FileText className="mx-auto mb-2" size={28} />
                  No quotations yet
                </td>
              </tr>
            ) : (
              quotations.map((q: any) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/quotations/${q.id}`} className="font-mono text-xs text-blue-600 font-medium hover:underline">
                      {q.quote_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {q.client?.full_name ?? q.lead_name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{q.title}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    Rs {Number(q.total).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(q.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}