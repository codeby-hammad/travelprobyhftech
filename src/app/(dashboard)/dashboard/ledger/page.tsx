import { createClient }   from '@/lib/supabase/server'
import Link               from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BookOpen, Plus, ArrowUpRight,
  ArrowDownLeft, Users, TrendingUp
} from 'lucide-react'
import LedgerSearch from '@/components/ledger/LedgerSearch'

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>
}) {
  const { type, q } = await searchParams
  const supabase     = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile  } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  // Get all party balances filtered by org
  let query = supabase
    .from('party_balances')
    .select('*')
    .eq('organization_id', orgId)

  if (type && type !== 'all') {
    query = query.eq('party_type', type)
  }

  const { data: parties } = await query

  // Filter by search
  const filtered = (parties ?? []).filter(p => {
    if (!q) return true
    const s = q.toLowerCase()
    return (
      p.party_name?.toLowerCase().includes(s) ||
      p.party_phone?.includes(s)              ||
      p.party_email?.toLowerCase().includes(s)
    )
  })

  // Separate receivable vs payable
  const receivableParties = filtered.filter(p => Number(p.balance) > 0)
  const payableParties    = filtered.filter(p => Number(p.balance) < 0)
  const settledParties    = filtered.filter(p => Number(p.balance) === 0)

  const totalReceivable = receivableParties
    .reduce((s, p) => s + Number(p.balance), 0)
  const totalPayable    = payableParties
    .reduce((s, p) => s + Math.abs(Number(p.balance)), 0)

  const counts = {
    all:       filtered.length,
    client:    filtered.filter(p => p.party_type === 'client')   .length,
    sub_agent: filtered.filter(p => p.party_type === 'sub_agent').length,
    supplier:  filtered.filter(p => p.party_type === 'supplier') .length,
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={22} className="text-blue-600" />
            Ledger / Khata
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Har party ka hisaab — kaun paisa dega, kaun lega
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/ledger/journal"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
            Journal entries
          </Link>
          <Link href="/dashboard/ledger/new-entry"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <Plus size={16} /> Manual entry
          </Link>
        </div>
      </div>

      {/* Simple explanation box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="font-semibold text-blue-900 text-sm mb-2">
          📖 Ledger kaise samjhein?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-700">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold mt-0.5">⬆</span>
            <div>
              <p className="font-semibold">Humein milna hai (Receivable)</p>
              <p className="opacity-75">
                Client ya agent ne abhi tak paisa nahi diya
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-600 font-bold mt-0.5">⬇</span>
            <div>
              <p className="font-semibold">Hum denge (Payable)</p>
              <p className="opacity-75">
                Supplier ya hotel ka paisa baaki hai
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 font-bold mt-0.5">✓</span>
            <div>
              <p className="font-semibold">Settled (Barabar)</p>
              <p className="opacity-75">
                Sab hisaab barabar ho gaya
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Big summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* Receivable */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowDownLeft size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-900 text-lg">
                Humein Milna Hai
              </p>
              <p className="text-green-600 text-sm">
                {receivableParties.length} parties se
              </p>
            </div>
          </div>
          <p className="text-4xl font-black text-green-700">
            {formatCurrency(totalReceivable)}
          </p>
          <p className="text-green-600 text-sm mt-1">
            Yeh log humein paisa denge
          </p>

          {/* Top 3 receivable */}
          {receivableParties.slice(0, 3).map(p => (
            <Link
              key={`${p.party_type}-${p.party_id}`}
              href={`/dashboard/ledger/party/${p.party_type}/${p.party_id}`}
              className="flex items-center justify-between mt-3 bg-white rounded-lg px-3 py-2 hover:shadow-sm transition"
            >
              <span className="text-sm font-medium text-gray-800 truncate">
                {p.party_name}
              </span>
              <span className="text-sm font-bold text-green-600 ml-2 shrink-0">
                {formatCurrency(p.balance)}
              </span>
            </Link>
          ))}
        </div>

        {/* Payable */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={24} className="text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-900 text-lg">
                Hum Denge
              </p>
              <p className="text-red-600 text-sm">
                {payableParties.length} parties ko
              </p>
            </div>
          </div>
          <p className="text-4xl font-black text-red-700">
            {formatCurrency(totalPayable)}
          </p>
          <p className="text-red-600 text-sm mt-1">
            Yeh log humse paisa lenge
          </p>

          {/* Top 3 payable */}
          {payableParties.slice(0, 3).map(p => (
            <Link
              key={`${p.party_type}-${p.party_id}`}
              href={`/dashboard/ledger/party/${p.party_type}/${p.party_id}`}
              className="flex items-center justify-between mt-3 bg-white rounded-lg px-3 py-2 hover:shadow-sm transition"
            >
              <span className="text-sm font-medium text-gray-800 truncate">
                {p.party_name}
              </span>
              <span className="text-sm font-bold text-red-600 ml-2 shrink-0">
                {formatCurrency(Math.abs(p.balance))}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { value: 'all',       label: `Sab (${counts.all})`                     },
          { value: 'client',    label: `Clients (${counts.client})`               },
          { value: 'sub_agent', label: `Sub-agents (${counts.sub_agent})`         },
          { value: 'supplier',  label: `Suppliers (${counts.supplier})`           },
        ].map(tab => (
          <Link
            key={tab.value}
            href={`/dashboard/ledger?type=${tab.value}${q ? `&q=${q}` : ''}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
              (type ?? 'all') === tab.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <LedgerSearch currentQ={q} currentType={type} />

      {/* Party table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <BookOpen size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {q ? 'Koi party nahi mili' : 'Koi entries nahi hain abhi'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Bookings aur payments add karne se entries automatic ban jaati hain
          </p>
        </div>
      ) : (
        <div className="space-y-3">

          {/* Receivable section */}
          {receivableParties.length > 0 && (
            <div>
              <p className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                <ArrowDownLeft size={14} />
                Humein Milna Hai — {formatCurrency(totalReceivable)}
              </p>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-50 border-b border-green-100">
                      <th className="text-left px-5 py-3 text-green-700 font-medium text-xs">Party</th>
                      <th className="text-left px-5 py-3 text-green-700 font-medium text-xs">Type</th>
                      <th className="text-right px-5 py-3 text-green-700 font-medium text-xs">Jo dena tha</th>
                      <th className="text-right px-5 py-3 text-green-700 font-medium text-xs">Jo diya</th>
                      <th className="text-right px-5 py-3 text-green-700 font-medium text-xs">Baaki hai</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {receivableParties
                      .sort((a, b) => Number(b.balance) - Number(a.balance))
                      .map(party => (
                        <PartyRow key={`${party.party_type}-${party.party_id}`} party={party} />
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payable section */}
          {payableParties.length > 0 && (
            <div>
              <p className="text-sm font-bold text-red-700 mt-4 mb-2 flex items-center gap-2">
                <ArrowUpRight size={14} />
                Hum Denge — {formatCurrency(totalPayable)}
              </p>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-50 border-b border-red-100">
                      <th className="text-left px-5 py-3 text-red-700 font-medium text-xs">Party</th>
                      <th className="text-left px-5 py-3 text-red-700 font-medium text-xs">Type</th>
                      <th className="text-right px-5 py-3 text-red-700 font-medium text-xs">Jo lena tha</th>
                      <th className="text-right px-5 py-3 text-red-700 font-medium text-xs">Jo liya</th>
                      <th className="text-right px-5 py-3 text-red-700 font-medium text-xs">Baaki hai</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payableParties
                      .sort((a, b) => Number(a.balance) - Number(b.balance))
                      .map(party => (
                        <PartyRow key={`${party.party_type}-${party.party_id}`} party={party} />
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settled section */}
          {settledParties.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-500 mt-4 mb-2">
                ✓ Settled / Barabar — {settledParties.length} parties
              </p>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Party</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs">Type</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Total transactions</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs">Balance</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {settledParties.map(party => (
                      <PartyRow key={`${party.party_type}-${party.party_id}`} party={party} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Reusable party row component
function PartyRow({ party }: { party: any }) {
  const balance      = Number(party.balance)
  const isReceivable = balance > 0
  const isPayable    = balance < 0
  const isSettled    = balance === 0

  const typeLabels: Record<string, string> = {
    client:    '👤 Client',
    sub_agent: '🤝 Sub-agent',
    supplier:  '🏢 Supplier',
    agency:    '✈️ Agency',
  }

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
            party.party_type === 'client'    ? 'bg-blue-100   text-blue-700'   :
            party.party_type === 'sub_agent' ? 'bg-purple-100 text-purple-700' :
                                                'bg-orange-100 text-orange-700'
          }`}>
            {party.party_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{party.party_name}</p>
            <p className="text-xs text-gray-400">
              {party.party_phone ?? party.party_email ?? ''}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <span className="text-xs text-gray-500">
          {typeLabels[party.party_type] ?? party.party_type}
        </span>
      </td>
      <td className="px-5 py-3 text-right text-gray-700 font-medium">
        {formatCurrency(party.total_debit)}
      </td>
      <td className="px-5 py-3 text-right text-gray-700 font-medium">
        {formatCurrency(party.total_credit)}
      </td>
      <td className="px-5 py-3 text-right">
        <span className={`font-bold text-base ${
          isReceivable ? 'text-green-600' :
          isPayable    ? 'text-red-600'   :
                          'text-gray-400'
        }`}>
          {isPayable ? '-' : ''}{formatCurrency(Math.abs(balance))}
        </span>
        {isSettled && (
          <p className="text-xs text-gray-400">Settled ✓</p>
        )}
      </td>
      <td className="px-5 py-3">
        <Link
          href={`/dashboard/ledger/party/${party.party_type}/${party.party_id}`}
          className="text-blue-600 hover:underline text-xs font-medium whitespace-nowrap"
        >
          Khata dekhein →
        </Link>
      </td>
    </tr>
  )
}