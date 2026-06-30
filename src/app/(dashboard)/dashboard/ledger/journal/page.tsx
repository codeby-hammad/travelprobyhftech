import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const refColors: Record<string, string> = {
  booking:     'bg-blue-50   text-blue-700',
  payment:     'bg-green-50  text-green-700',
  invoice:     'bg-purple-50 text-purple-700',
  ticket_sale: 'bg-orange-50 text-orange-700',
  expense:     'bg-red-50    text-red-700',
  manual:      'bg-gray-100  text-gray-600',
  opening:     'bg-yellow-50 text-yellow-700',
}

export default async function JournalPage() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ledger" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal entries</h1>
          <p className="text-gray-500 text-sm">
            {entries?.length ?? 0} entries — all financial transactions
          </p>
        </div>
      </div>

      {(!entries || entries.length === 0) ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">No journal entries yet</p>
          <p className="text-gray-300 text-sm mt-1">
            Entries auto-create when bookings and payments are added
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Entry no.</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Description</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Type</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">
                    {entry.entry_number}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(entry.entry_date)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800 text-xs">{entry.description}</p>
                    {entry.notes && (
                      <p className="text-gray-400 text-xs mt-0.5">{entry.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entry.reference_type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        refColors[entry.reference_type] ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {entry.reference_type.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">
                    {formatCurrency(entry.total_amount, entry.currency)}
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