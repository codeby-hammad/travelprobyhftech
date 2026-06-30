import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { Plus, Settings } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const typeColors: Record<string, string> = {
  asset:     'bg-blue-50   text-blue-700',
  liability: 'bg-red-50    text-red-700',
  equity:    'bg-purple-50 text-purple-700',
  income:    'bg-green-50  text-green-700',
  expense:   'bg-orange-50 text-orange-700',
}

export default async function AccountsPage() {
  const supabase = await createClient()

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('code')

  const grouped = accounts?.reduce((acc, a) => {
    if (!acc[a.type]) acc[a.type] = []
    acc[a.type].push(a)
    return acc
  }, {} as Record<string, any[]>) ?? {}

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={22} className="text-gray-600" />
            Chart of Accounts
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {accounts?.length ?? 0} accounts
          </p>
        </div>
        <Link href="/dashboard/accounts/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> Add account
        </Link>
      </div>

      <div className="space-y-5">
        {(['asset','liability','income','expense','equity'] as const).map(type => {
          const items = grouped[type] ?? []
          if (items.length === 0) return null
          return (
            <div key={type} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${typeColors[type]}`}>
                    {type}
                  </span>
                  <span className="text-sm text-gray-500">{items.length} accounts</span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-50">
                    <th className="text-left px-5 py-2 text-gray-400 font-medium text-xs">Code</th>
                    <th className="text-left px-5 py-2 text-gray-400 font-medium text-xs">Account name</th>
                    <th className="text-left px-5 py-2 text-gray-400 font-medium text-xs">Sub type</th>
                    <th className="text-right px-5 py-2 text-gray-400 font-medium text-xs">Opening balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-blue-600">{acc.code}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{acc.name}</td>
                      <td className="px-5 py-3 text-gray-400 capitalize text-xs">
                        {acc.sub_type?.replace('_', ' ') ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">
                        {acc.opening_balance > 0
                          ? formatCurrency(acc.opening_balance)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}