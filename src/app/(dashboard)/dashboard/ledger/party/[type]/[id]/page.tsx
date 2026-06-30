import { createClient }      from '@/lib/supabase/server'
import { notFound }          from 'next/navigation'
import Link                  from 'next/link'
import { ArrowLeft, Plus }   from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import AddLedgerEntryForm    from '@/components/ledger/AddLedgerEntryForm'

export default async function PartyLedgerPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  const { type, id } = await params
  const supabase     = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile  } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  // ── Get party info ──────────────────────────────────
  let party: any      = null
  let partyName       = ''
  let isWalkin        = false

  // Check if this is a real UUID from our tables
  const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  if (type === 'client' && isRealUuid) {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()
    party     = data
    partyName = data?.full_name ?? ''

  } else if (type === 'sub_agent' && isRealUuid) {
    const { data } = await supabase
      .from('sub_agents')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()
    party     = data
    partyName = data?.name ?? ''

  } else if (type === 'supplier' && isRealUuid) {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()
    party     = data
    partyName = data?.name ?? ''

  } else {
    // Walk-in customer — ID is an md5 hash, not a real UUID
    // Get party name from ledger entries directly
    isWalkin = true
  }

  // ── Get ledger entries ──────────────────────────────
  let entries: any[] = []

  if (isWalkin) {
    // For walk-in: find by matching the md5 hash of party_name + org_id
    // First get all entries with party_name for this org
    const { data: allEntries } = await supabase
      .from('ledger_entries')
      .select('*, journal_entry:journal_entries(entry_number, entry_date, description, reference_type)')
      .eq('organization_id', orgId)
      .is('client_id',    null)
      .is('sub_agent_id', null)
      .is('supplier_id',  null)
      .not('party_name',  'is', null)
      .order('created_at', { ascending: true })

    // Filter by matching the md5 hash
    // md5(party_name || org_id)::uuid is how party_balances view generates the ID
    // We need to find which party_name generates this ID
    // Group by party_name and find the one matching our ID
    const grouped: Record<string, any[]> = {}
    allEntries?.forEach(e => {
      if (!grouped[e.party_name]) grouped[e.party_name] = []
      grouped[e.party_name].push(e)
    })

    // Find which party_name matches the ID from the view
    // The view uses: md5(party_name || org_id)::uuid
    // We match by checking all party names
    for (const [name, nameEntries] of Object.entries(grouped)) {
      // Generate the same hash the view uses
      const { data: hashCheck } = await supabase
        .rpc('get_party_hash', { p_name: name, p_org_id: orgId })
        .single()

      if (hashCheck === id) {
        partyName = name
        entries   = nameEntries
        party     = { name, is_walkin: true }
        break
      }
    }

    // Fallback: if hash function not found, just get all walk-in entries
    // and try to match by showing the first unmatched group
    if (!party && Object.keys(grouped).length > 0) {
      const firstKey = Object.keys(grouped)[0]
      partyName = firstKey
      entries   = grouped[firstKey]
      party     = { name: firstKey, is_walkin: true }
    }

  } else {
    // Regular party — fetch by ID column
    const partyFilter =
      type === 'client'    ? 'client_id'    :
      type === 'sub_agent' ? 'sub_agent_id' :
                              'supplier_id'

    const { data } = await supabase
      .from('ledger_entries')
      .select('*, journal_entry:journal_entries(entry_number, entry_date, description, reference_type)')
      .eq('organization_id', orgId)
      .eq(partyFilter, id)
      .order('created_at', { ascending: true })

    entries = data ?? []
  }

  // If still no party found
  if (!party) notFound()

  // ── Calculate running balance ───────────────────────
  let runningBalance = 0
  const entriesWithBalance = entries.map(entry => {
    if (entry.entry_type === 'debit') {
      runningBalance += Number(entry.amount)
    } else {
      runningBalance -= Number(entry.amount)
    }
    return { ...entry, running_balance: runningBalance }
  })

  const totalDebit  = entries
    .filter(e => e.entry_type === 'debit')
    .reduce((s, e) => s + Number(e.amount), 0)

  const totalCredit = entries
    .filter(e => e.entry_type === 'credit')
    .reduce((s, e) => s + Number(e.amount), 0)

  const balance = totalDebit - totalCredit

  const displayName = party.full_name ?? party.name ?? partyName

  return (
    <div className="p-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ledger" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <span className={`capitalize text-xs px-2.5 py-1 rounded-full font-medium ${
              type === 'client'    ? 'bg-blue-50   text-blue-700'   :
              type === 'sub_agent' ? 'bg-purple-50 text-purple-700' :
                                      'bg-orange-50 text-orange-700'
            }`}>
              {isWalkin ? '👤 Walk-in customer' : type.replace('_', ' ')}
            </span>
            {isWalkin && (
              <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                Cash customer
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {!isWalkin && (party.phone ?? party.email ?? party.city ?? '')}
          </p>
        </div>
      </div>

      {/* Balance summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-400 mb-1">Jo dena tha</p>
          <p className="text-xl font-black text-gray-900">
            {formatCurrency(totalDebit)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total charged</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-400 mb-1">Jo diya</p>
          <p className="text-xl font-black text-gray-900">
            {formatCurrency(totalCredit)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total paid</p>
        </div>
        <div className={`rounded-xl p-5 text-center border ${
          balance > 0  ? 'bg-green-50 border-green-100' :
          balance < 0  ? 'bg-red-50   border-red-100'   :
                          'bg-gray-50  border-gray-100'
        }`}>
          <p className="text-xs text-gray-400 mb-1">Baaki hai</p>
          <p className={`text-xl font-black ${
            balance > 0 ? 'text-green-700' :
            balance < 0 ? 'text-red-700'   :
                           'text-gray-500'
          }`}>
            {balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance))}
          </p>
          <p className="text-xs mt-1">
            {balance > 0  ? '⬆ Humein dena hai' :
             balance < 0  ? '⬇ Hum denge'       :
                             '✓ Barabar'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Ledger table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Khata — Account statement
              </h2>
              <span className="text-xs text-gray-400">
                {entries.length} entries
              </span>
            </div>

            {entriesWithBalance.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm font-medium">Koi entries nahi hain</p>
                <p className="text-xs mt-1">
                  Ticket sale se entries automatic ban jaati hain
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">
                        Date
                      </th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">
                        Description
                      </th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">
                        Debit (dena tha)
                      </th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">
                        Credit (diya)
                      </th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entriesWithBalance.map((entry: any, i: number) => (
                      <tr key={entry.id ?? i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(
                            entry.journal_entry?.entry_date ?? entry.created_at
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 text-xs leading-snug">
                            {entry.description ??
                             entry.journal_entry?.description ?? '—'}
                          </p>
                          {entry.journal_entry?.entry_number && (
                            <p className="text-gray-400 text-xs mt-0.5 font-mono">
                              {entry.journal_entry.entry_number}
                            </p>
                          )}
                          {entry.journal_entry?.reference_type && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block ${
                              entry.journal_entry.reference_type === 'ticket_sale'
                                ? 'bg-blue-50  text-blue-600'   :
                              entry.journal_entry.reference_type === 'payment'
                                ? 'bg-green-50 text-green-600'  :
                                  'bg-gray-100  text-gray-500'
                            }`}>
                              {entry.journal_entry.reference_type.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {entry.entry_type === 'debit' ? (
                            <span className="font-medium text-gray-900 text-xs">
                              {formatCurrency(entry.amount)}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {entry.entry_type === 'credit' ? (
                            <span className="font-medium text-green-600 text-xs">
                              {formatCurrency(entry.amount)}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold text-xs ${
                            entry.running_balance > 0  ? 'text-green-600' :
                            entry.running_balance < 0  ? 'text-red-600'   :
                                                          'text-gray-400'
                          }`}>
                            {entry.running_balance < 0 ? '-' : ''}
                            {formatCurrency(Math.abs(entry.running_balance))}
                            {entry.running_balance === 0 && (
                              <span className="ml-1">✓</span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={2}
                        className="px-4 py-3 font-bold text-gray-900 text-xs">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">
                        {formatCurrency(totalDebit)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600 text-sm">
                        {formatCurrency(totalCredit)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-sm">
                        <span className={
                          balance > 0 ? 'text-green-600' :
                          balance < 0 ? 'text-red-600'   :
                                         'text-gray-400'
                        }>
                          {balance < 0 ? '-' : ''}
                          {formatCurrency(Math.abs(balance))}
                          {balance === 0 && ' ✓'}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column — add entry */}
        <div>
          {!isWalkin ? (
            <AddLedgerEntryForm
              partyType={type}
              partyId={id}
              partyName={displayName}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
              <p className="font-semibold text-yellow-800 text-sm mb-2">
                👤 Walk-in Customer
              </p>
              <p className="text-yellow-700 text-xs leading-relaxed">
                Yeh customer sirf cash transactions mein aata hai.
                Inki entries ticket sale se automatically ban jaati hain.
              </p>
              <div className="mt-3 pt-3 border-t border-yellow-200 text-xs text-yellow-600 space-y-1">
                <p>• Total purchases: {entries.length / 2} tickets</p>
                <p>• Total paid: {formatCurrency(totalCredit)}</p>
                <p>• Balance: {formatCurrency(Math.abs(balance))}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}