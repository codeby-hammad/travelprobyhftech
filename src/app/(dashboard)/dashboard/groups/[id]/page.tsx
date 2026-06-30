import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import Link             from 'next/link'
import { ArrowLeft }    from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import BookingStatusBadge from '@/components/bookings/BookingStatusBadge'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: group } = await supabase
    .from('group_bookings')
    .select(`
      *,
      booking:bookings(*, package:packages(name, destination)),
      leader:clients(full_name, phone),
      passengers:group_passengers(
        *,
        client:clients(full_name, phone, passport_number, passport_expiry)
      )
    `)
    .eq('id', id)
    .single()

  if (!group) notFound()

  const totalPaid  = (group.passengers as any[])?.reduce((s: number, p: any) => s + Number(p.paid_amount),  0) ?? 0
  const totalOwed  = (group.passengers as any[])?.reduce((s: number, p: any) => s + Number(p.total_amount), 0) ?? 0
  const totalBalance = totalOwed - totalPaid

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/groups" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{group.group_name}</h1>
            {group.booking && (
              <BookingStatusBadge status={(group.booking as any).status} />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Link href={`/dashboard/bookings/${group.booking_id}`}
              className="text-blue-600 text-sm font-mono hover:underline">
              {(group.booking as any)?.booking_ref}
            </Link>
            {(group.booking as any)?.travel_date && (
              <span className="text-gray-400 text-sm">
                ✈ {formatDate((group.booking as any).travel_date)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total passengers', value: group.passengers?.length ?? 0,             color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Total collected',  value: formatCurrency(totalPaid,    (group.booking as any)?.currency ?? 'PKR'), color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Balance due',      value: formatCurrency(totalBalance, (group.booking as any)?.currency ?? 'PKR'), color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-opacity-20`}>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Passengers table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Passengers ({group.passengers?.length ?? 0})
          </h2>
          {group.leader && (
            <p className="text-sm text-gray-500">
              Leader: <span className="font-medium text-gray-700">{(group.leader as any).full_name}</span>
            </p>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Passenger</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Passport</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Paid</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Balance</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Visa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(group.passengers as any[])?.map((p: any, i: number) => {
              const balance = Number(p.total_amount) - Number(p.paid_amount)
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/clients/${p.client_id}`}
                      className="font-medium text-gray-900 hover:text-blue-600">
                      {p.client?.full_name}
                    </Link>
                    {p.client?.phone && (
                      <p className="text-xs text-gray-400">{p.client.phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.client?.passport_number ?? '—'}
                    {p.client?.passport_expiry && (
                      <p className="text-xs text-gray-400">
                        exp {formatDate(p.client.passport_expiry)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(p.total_amount, (group.booking as any)?.currency ?? 'PKR')}
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium">
                    {formatCurrency(p.paid_amount, (group.booking as any)?.currency ?? 'PKR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={balance > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {formatCurrency(balance, (group.booking as any)?.currency ?? 'PKR')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/visa/new?client_id=${p.client_id}&booking_id=${group.booking_id}`}
                      className="text-xs text-blue-600 hover:underline">
                      + Add visa
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">Total</td>
              <td className="px-4 py-3 font-bold text-gray-900">
                {formatCurrency(totalOwed, (group.booking as any)?.currency ?? 'PKR')}
              </td>
              <td className="px-4 py-3 font-bold text-green-600">
                {formatCurrency(totalPaid, (group.booking as any)?.currency ?? 'PKR')}
              </td>
              <td className="px-4 py-3 font-bold text-red-600">
                {formatCurrency(totalBalance, (group.booking as any)?.currency ?? 'PKR')}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}