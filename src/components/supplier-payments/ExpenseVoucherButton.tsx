'use client'

import { useEffect, useState } from 'react'
import { Download }            from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Props = {
  invoice:      any
  payments:     any[]
  organization: any
}

export default function ExpenseVoucherButton({
  invoice, payments, organization
}: Props) {
  const [PDFComponents, setPDFComponents] = useState<any>(null)

  useEffect(() => {
    import('@react-pdf/renderer').then(mod => setPDFComponents(mod))
  }, [])

  if (!PDFComponents) {
    return (
      <button disabled
        className="flex items-center gap-2 border border-gray-300 px-4
          py-2 rounded-lg text-sm text-gray-400">
        <Download size={15} /> Loading...
      </button>
    )
  }

  const {
    Document, Page, Text, View, StyleSheet, PDFDownloadLink
  } = PDFComponents

  const C = {
    orange:  '#c2410c',
    orangeL: '#fff7ed',
    blue:    '#1d4ed8',
    gray:    '#374151',
    grayL:   '#f9fafb',
    grayMid: '#6b7280',
    border:  '#e5e7eb',
    white:   '#ffffff',
    green:   '#166534',
    greenL:  '#f0fdf4',
    red:     '#dc2626',
  }

  const s = StyleSheet.create({
    page:         { padding: 40, fontFamily: 'Helvetica', fontSize: 9,
                    color: C.gray, backgroundColor: C.white              },
    header:       { flexDirection: 'row', justifyContent: 'space-between',
                    marginBottom: 24, paddingBottom: 16,
                    borderBottom: `2 solid ${C.orange}`                  },
    agencyName:   { fontSize: 20, fontFamily: 'Helvetica-Bold',
                    color: C.orange                                       },
    agencyTag:    { fontSize: 8, color: C.grayMid, marginTop: 3         },
    voucherBox:   { textAlign: 'right'                                   },
    vLabel:       { fontSize: 8, color: C.grayMid                       },
    vNumber:      { fontSize: 14, fontFamily: 'Helvetica-Bold',
                    color: C.orange, marginTop: 2                        },
    statusBadge:  { fontSize: 8, padding: '3 8', borderRadius: 4,
                    marginTop: 4, alignSelf: 'flex-end'                  },
    section:      { marginBottom: 16                                     },
    sHead:        { fontSize: 8, color: C.grayMid, textTransform: 'uppercase',
                    letterSpacing: 0.5, marginBottom: 6, paddingBottom: 4,
                    borderBottom: `0.5 solid ${C.border}`               },
    row:          { flexDirection: 'row', marginBottom: 5               },
    label:        { width: 120, color: C.grayMid, fontSize: 8          },
    value:        { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 8 },
    card:         { backgroundColor: C.grayL, borderRadius: 6,
                    padding: '10 12', marginBottom: 8                   },
    payRow:       { flexDirection: 'row', justifyContent: 'space-between',
                    padding: '5 8', borderBottom: `0.5 solid ${C.border}` },
    payHead:      { flexDirection: 'row', justifyContent: 'space-between',
                    backgroundColor: C.orange, borderRadius: '4 4 0 0',
                    padding: '5 8'                                       },
    payHeadText:  { fontSize: 7, color: C.white,
                    fontFamily: 'Helvetica-Bold'                         },
    totalRow:     { flexDirection: 'row', justifyContent: 'space-between',
                    backgroundColor: C.greenL, padding: '8 8',
                    borderTop: `1 solid #166534`                         },
    balRow:       { flexDirection: 'row', justifyContent: 'space-between',
                    backgroundColor: '#fef2f2', padding: '8 8'          },
    footer:       { position: 'absolute', bottom: 28, left: 40, right: 40,
                    textAlign: 'center', fontSize: 7, color: C.grayMid,
                    borderTop: `0.5 solid ${C.border}`, paddingTop: 8  },
    stamp:        { border: `2 solid ${C.green}`, borderRadius: 6,
                    padding: '6 14', alignSelf: 'flex-start',
                    marginTop: 16                                        },
    stampText:    { fontSize: 12, fontFamily: 'Helvetica-Bold',
                    color: C.green                                       },
  })

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const balance   = Number(invoice.amount) - totalPaid

  const VoucherDoc = () => (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.agencyName}>{organization?.name}</Text>
            <Text style={s.agencyTag}>Expense Payment Voucher</Text>
            <Text style={[s.agencyTag, { marginTop: 6 }]}>
              Date: {new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}
            </Text>
          </View>
          <View style={s.voucherBox}>
            <Text style={s.vLabel}>Supplier Invoice</Text>
            <Text style={s.vNumber}>{invoice.invoice_number}</Text>
            <Text style={[s.vLabel, { marginTop: 6 }]}>Status</Text>
            <View style={[s.statusBadge, {
              backgroundColor:
                invoice.status === 'paid'    ? C.greenL :
                invoice.status === 'partial' ? '#fefce8' : '#fef2f2',
              borderColor:
                invoice.status === 'paid'    ? C.green  :
                invoice.status === 'partial' ? '#ca8a04' : C.red,
              border: '1 solid',
            }]}>
              <Text style={{
                fontSize: 8, fontFamily: 'Helvetica-Bold',
                color:
                  invoice.status === 'paid'    ? C.green  :
                  invoice.status === 'partial' ? '#ca8a04' : C.red,
              }}>
                {invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Supplier info */}
        <View style={s.section}>
          <Text style={s.sHead}>Supplier details</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.label}>Supplier name</Text>
              <Text style={s.value}>{invoice.supplier?.name}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Supplier type</Text>
              <Text style={[s.value, { textTransform: 'capitalize' }]}>
                {invoice.supplier?.type}
              </Text>
            </View>
            {invoice.supplier?.phone && (
              <View style={s.row}>
                <Text style={s.label}>Phone</Text>
                <Text style={s.value}>{invoice.supplier.phone}</Text>
              </View>
            )}
            {invoice.supplier?.email && (
              <View style={s.row}>
                <Text style={s.label}>Email</Text>
                <Text style={s.value}>{invoice.supplier.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Invoice details */}
        <View style={s.section}>
          <Text style={s.sHead}>Invoice details</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.label}>Invoice number</Text>
              <Text style={[s.value, { fontFamily: 'Courier' }]}>
                {invoice.invoice_number}
              </Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Service type</Text>
              <Text style={[s.value, { textTransform: 'capitalize' }]}>
                {invoice.service_type}
              </Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Description</Text>
              <Text style={[s.value, { fontFamily: 'Helvetica' }]}>
                {invoice.description}
              </Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Invoice date</Text>
              <Text style={s.value}>{formatDate(invoice.invoice_date)}</Text>
            </View>
            {invoice.due_date && (
              <View style={s.row}>
                <Text style={s.label}>Due date</Text>
                <Text style={s.value}>{formatDate(invoice.due_date)}</Text>
              </View>
            )}
            <View style={s.row}>
              <Text style={s.label}>Invoice amount</Text>
              <Text style={[s.value, { fontSize: 11, color: C.orange }]}>
                {formatCurrency(invoice.amount, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment history */}
        <View style={s.section}>
          <Text style={s.sHead}>Payment history</Text>
          <View style={{ borderRadius: 6, overflow: 'hidden',
            border: `0.5 solid ${C.border}` }}>
            <View style={s.payHead}>
              <Text style={[s.payHeadText, { flex: 1.5 }]}>
                Payment no.
              </Text>
              <Text style={[s.payHeadText, { flex: 1.5 }]}>Date</Text>
              <Text style={[s.payHeadText, { flex: 2 }]}>Method</Text>
              <Text style={[s.payHeadText, { flex: 2 }]}>Reference</Text>
              <Text style={[s.payHeadText, { flex: 1.5, textAlign: 'right' }]}>
                Amount
              </Text>
            </View>

            {payments.length === 0 ? (
              <View style={s.payRow}>
                <Text style={{
                  flex: 1, fontSize: 8, color: C.grayMid,
                  textAlign: 'center'
                }}>
                  No payments recorded
                </Text>
              </View>
            ) : (
              payments.map((p: any, i: number) => (
                <View key={p.id} style={[
                  s.payRow,
                  i % 2 !== 0
                    ? { backgroundColor: C.grayL }
                    : {}
                ]}>
                  <Text style={{ flex: 1.5, fontSize: 8,
                    fontFamily: 'Courier', color: C.blue }}>
                    {p.payment_number}
                  </Text>
                  <Text style={{ flex: 1.5, fontSize: 8 }}>
                    {formatDate(p.payment_date)}
                  </Text>
                  <Text style={{ flex: 2, fontSize: 8, textTransform: 'capitalize' }}>
                    {p.payment_method?.replace('_', ' ')}
                    {p.bank_name ? ` (${p.bank_name})` : ''}
                  </Text>
                  <Text style={{
                    flex: 2, fontSize: 8, fontFamily: 'Courier'
                  }}>
                    {p.reference_no ?? '—'}
                  </Text>
                  <Text style={{
                    flex: 1.5, fontSize: 9,
                    fontFamily: 'Helvetica-Bold', textAlign: 'right',
                    color: C.green
                  }}>
                    {formatCurrency(p.amount, p.currency)}
                  </Text>
                </View>
              ))
            )}

            {/* Total paid */}
            <View style={s.totalRow}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                Total paid
              </Text>
              <Text style={{
                fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.green
              }}>
                {formatCurrency(totalPaid, invoice.currency)}
              </Text>
            </View>

            {/* Balance */}
            {balance > 0 && (
              <View style={s.balRow}>
                <Text style={{
                  fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.red
                }}>
                  Balance remaining
                </Text>
                <Text style={{
                  fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.red
                }}>
                  {formatCurrency(balance, invoice.currency)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Paid stamp */}
        {invoice.status === 'paid' && (
          <View style={s.stamp}>
            <Text style={s.stampText}>✓ FULLY PAID</Text>
            <Text style={{ fontSize: 7, color: C.green, marginTop: 2 }}>
              {formatDate(
                payments[0]?.payment_date ?? invoice.updated_at
              )}
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 12 }}>
            <Text style={s.sHead}>Notes</Text>
            <Text style={{ fontSize: 8, color: C.grayMid }}>
              {invoice.notes}
            </Text>
          </View>
        )}

        <Text style={s.footer}>
          {organization?.name} •
          Invoice: {invoice.invoice_number} •
          Generated: {new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })} •
          This is a computer generated payment voucher
        </Text>

      </Page>
    </Document>
  )

  return (
    <PDFDownloadLink
      document={<VoucherDoc />}
      fileName={`expense-voucher-${invoice.invoice_number}.pdf`}
      className="flex items-center gap-2 bg-orange-600 text-white px-4
        py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
    >
      {({ loading }: { loading: boolean }) => (
        <>
          <Download size={15} />
          {loading ? 'Generating...' : 'Download voucher PDF'}
        </>
      )}
    </PDFDownloadLink>
  )
}