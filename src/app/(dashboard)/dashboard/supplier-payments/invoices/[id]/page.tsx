import { createClient }       from '@/lib/supabase/server'
import { notFound }           from 'next/navigation'
import Link                   from 'next/link'
import { ArrowLeft }          from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import RecordPaymentForm      from '@/components/supplier-payments/RecordPaymentForm'
import ExpenseVoucherButton   from '@/components/supplier-payments/ExpenseVoucherButton'

const statusStyles: Record<string, string> = {
  unpaid:    'bg-red-50    text-red-700    border-red-200',
  partial:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid:      'bg-green-50  text-green-700  border-green-200',
  overdue:   'bg-red-100   text-red-800    border-red-300',
  cancelled: 'bg-gray-100  text-gray-500   border-gray-200',
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const [{ data: invoice }, { data: payments }] = await Promise.all([
    supabase
      .from('supplier_invoices')
      .select('*, supplier:suppliers(*), booking:bookings(booking_ref)')
      .eq('id', id)
      .single(),
    supabase
      .from('supplier_payments')
      .select('*')
      .eq('supplier_invoice_id', id)
      .order('payment_date', { ascending: false }),
  ])

  if (!invoice) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', invoice.organization_id)
    .single()

  const balance    = Number(invoice.amount) - Number(invoice.paid_amount)
  const isOverdue  = invoice.due_date &&
    new Date(invoice.due_date) < new Date() &&
    invoice.status !== 'paid'

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/supplier-payments"
            className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 font-mono">
                {invoice.invoice_number}
              </h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                border capitalize ${statusStyles[invoice.status]}`}>
                {invoice.status}
              </span>
              {isOverdue && (
                <span className="text-xs bg-red-100 text-red-700 px-2.5
                  py-1 rounded-full font-bold">
                  ⚠ OVERDUE
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {invoice.supplier?.name} •{' '}
              {invoice.service_type} •{' '}
              {formatDate(invoice.invoice_date)}
            </p>
          </div>
        </div>

        {/* Expense voucher PDF button */}
        <ExpenseVoucherButton
          invoice={invoice}
          payments={payments ?? []}
          organization={org}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — invoice details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Invoice info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Invoice details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Supplier',      value: invoice.supplier?.name        },
                { label: 'Service type',  value: invoice.service_type          },
                { label: 'Invoice date',  value: formatDate(invoice.invoice_date) },
                { label: 'Due date',      value: invoice.due_date
                    ? formatDate(invoice.due_date) : '—'                       },
                { label: 'Invoice amount',value: formatCurrency(invoice.amount, invoice.currency) },
                { label: 'Booking ref',   value: invoice.booking?.booking_ref ?? '—' },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700">{invoice.description}</p>
            </div>
            {invoice.notes && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-500">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Payment history
            </h2>
            {(!payments || payments.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Koi payment nahi ki abhi tak
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id}
                    className="flex items-center justify-between py-3
                      border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-mono text-blue-600 text-xs font-medium">
                        {p.payment_number}
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {formatDate(p.payment_date)} •{' '}
                        {p.payment_method?.replace('_', ' ')}
                        {p.reference_no && ` • ${p.reference_no}`}
                      </p>
                      {p.bank_name && (
                        <p className="text-xs text-gray-400">{p.bank_name}</p>
                      )}
                    </div>
                    <p className="font-bold text-green-600">
                      {formatCurrency(p.amount, p.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — summary + pay */}
        <div className="space-y-4">

          {/* Financial summary */}
          <div className={`rounded-xl p-5 border-2 ${
            balance <= 0
              ? 'bg-green-50  border-green-200'
              : isOverdue
                ? 'bg-red-50   border-red-200'
                : 'bg-orange-50 border-orange-200'
          }`}>
            <h2 className="font-semibold text-gray-900 mb-4">
              Payment summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice amount</span>
                <span className="font-semibold">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total paid</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(invoice.paid_amount, invoice.currency)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-gray-700 font-medium">Balance due</span>
                <span className={`font-black text-lg ${
                  balance <= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(balance, invoice.currency)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: invoice.amount > 0
                      ? `${Math.min(
                          (invoice.paid_amount / invoice.amount) * 100, 100
                        )}%`
                      : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {invoice.amount > 0
                  ? `${Math.round((invoice.paid_amount / invoice.amount) * 100)}% paid`
                  : '0% paid'}
              </p>
            </div>

            {balance <= 0 && (
              <p className="text-green-700 font-semibold text-sm mt-3 text-center">
                ✓ Fully paid
              </p>
            )}
          </div>

          {/* Record payment form */}
          {balance > 0 && (
            <RecordPaymentForm
              invoiceId={invoice.id}
              supplierId={invoice.supplier_id}
              organizationId={invoice.organization_id}
              currency={invoice.currency}
              balance={balance}
              supplierName={invoice.supplier?.name}
            />
          )}
        </div>
      </div>
    </div>
  )
}