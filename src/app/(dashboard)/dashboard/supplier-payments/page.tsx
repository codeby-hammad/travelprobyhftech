import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle, Plus, Building2, TrendingDown } from 'lucide-react'

const statusStyles: Record<string, string> = {
  unpaid:    'bg-red-50    text-red-700',
  partial:   'bg-yellow-50 text-yellow-700',
  paid:      'bg-green-50  text-green-700',
  overdue:   'bg-red-100   text-red-800',
  cancelled: 'bg-gray-100  text-gray-500',
}

const typeIcons: Record<string, string> = {
  hotel:     '🏨',
  airline:   '✈️',
  transport: '🚌',
  visa:      '🛂',
  insurance: '🛡️',
  other:     '📦',
}

export default async function SupplierPaymentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile  } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile!.organization_id

  const [
    { data: payables  },
    { data: invoices  },
    { data: overdue   },
  ] = await Promise.all([
    supabase
      .from('supplier_payables')
      .select('*')
      .eq('organization_id', orgId)
      .gt('total_outstanding', 0)
      .order('total_outstanding', { ascending: false }),
    supabase
      .from('supplier_invoices')
      .select('*, supplier:suppliers(name, type)')
      .eq('organization_id', orgId)
      .neq('status', 'paid')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true })
      .limit(20),
    supabase
      .from('supplier_invoices')
      .select('*, supplier:suppliers(name)')
      .eq('organization_id', orgId)
      .eq('status', 'unpaid')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .order('due_date'),
  ])

  const totalOutstanding = payables?.reduce(
    (s, p) => s + Number(p.total_outstanding), 0
  ) ?? 0

  const totalOverdue = overdue?.reduce(
    (s, i) => s + (Number(i.amount) - Number(i.paid_amount)), 0
  ) ?? 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={22} className="text-orange-600" />
            Supplier Payments
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Jo suppliers ko dena hai — invoices aur payments
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/supplier-payments/invoices/new"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
            + Add invoice
          </Link>
          <Link href="/dashboard/supplier-payments/pay"
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium">
            <Plus size={16} /> Record payment
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingDown size={20} className="text-orange-600" />
            </div>
            <p className="font-bold text-orange-900">Total outstanding</p>
          </div>
          <p className="text-3xl font-black text-orange-700">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-orange-600 text-sm mt-1">
            {payables?.length ?? 0} suppliers se
          </p>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <p className="font-bold text-red-900">Overdue payments</p>
          </div>
          <p className="text-3xl font-black text-red-700">
            {formatCurrency(totalOverdue)}
          </p>
          <p className="text-red-600 text-sm mt-1">
            {overdue?.length ?? 0} invoices past due date
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm text-gray-500 mb-2">Pending invoices</p>
          <p className="text-3xl font-black text-gray-900">
            {invoices?.length ?? 0}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Awaiting payment
          </p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue && overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <p className="font-semibold text-red-800 text-sm">
              {overdue.length} overdue invoice{overdue.length > 1 ? 's' : ''}
            </p>
          </div>
          {overdue.slice(0, 3).map((inv: any) => (
            <div key={inv.id}
              className="flex items-center justify-between text-sm text-red-700 py-1">
              <span>
                • {inv.supplier?.name} — {inv.invoice_number}
              </span>
              <span className="font-medium">
                {formatCurrency(inv.amount - inv.paid_amount)} overdue since{' '}
                {formatDate(inv.due_date)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Supplier outstanding balances */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Outstanding by supplier
            </h2>
            <Link href="/dashboard/supplier-payments/invoices"
              className="text-xs text-blue-600 hover:underline">
              View all invoices
            </Link>
          </div>

          {(!payables || payables.length === 0) ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Koi outstanding balance nahi hai 🎉
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {payables.map((p: any) => (
                <Link key={p.supplier_id}
                  href={`/dashboard/supplier-payments/supplier/${p.supplier_id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {typeIcons[p.supplier_type] ?? '🏢'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {p.supplier_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.total_invoices} invoice{p.total_invoices > 1 ? 's' : ''} •{' '}
                        {p.unpaid_count > 0 && (
                          <span className="text-red-500">
                            {p.unpaid_count} unpaid
                          </span>
                        )}
                        {p.overdue_count > 0 && (
                          <span className="text-red-700 font-medium ml-1">
                            • {p.overdue_count} overdue
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      {formatCurrency(p.total_outstanding)}
                    </p>
                    <p className="text-xs text-gray-400">outstanding</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending invoices */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Pending invoices
            </h2>
            <Link href="/dashboard/supplier-payments/invoices/new"
              className="text-xs text-blue-600 hover:underline">
              + Add invoice
            </Link>
          </div>

          {(!invoices || invoices.length === 0) ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Koi pending invoices nahi hain
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.map((inv: any) => {
                const balance    = Number(inv.amount) - Number(inv.paid_amount)
                const isOverdue  = inv.due_date &&
                  new Date(inv.due_date) < new Date() &&
                  inv.status !== 'paid'

                return (
                  <Link key={inv.id}
                    href={`/dashboard/supplier-payments/invoices/${inv.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-blue-600 text-xs font-medium">
                          {inv.invoice_number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          statusStyles[inv.status]
                        }`}>
                          {inv.status}
                        </span>
                        {isOverdue && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">
                        {inv.supplier?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {inv.description?.slice(0, 40)}
                        {inv.due_date && ` • Due: ${formatDate(inv.due_date)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600 text-sm">
                        {formatCurrency(balance)}
                      </p>
                      <p className="text-xs text-gray-400">remaining</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}