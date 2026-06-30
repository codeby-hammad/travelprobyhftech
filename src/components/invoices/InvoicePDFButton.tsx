'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function InvoicePDFButton({
  invoice,
  organization,
}: {
  invoice:      any
  organization: any
}) {
  const [PDFComponents, setPDFComponents] = useState<any>(null)

  useEffect(() => {
    import('@react-pdf/renderer').then(mod => setPDFComponents(mod))
  }, [])

  if (!PDFComponents) {
    return (
      <button disabled
        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed">
        <Download size={15} /> Loading...
      </button>
    )
  }

  const { Document, Page, Text, View, StyleSheet, PDFDownloadLink } = PDFComponents

  const styles = StyleSheet.create({
    page:        { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
    header:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingBottom: 20, borderBottom: '1 solid #e5e5e5' },
    agencyName:  { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1d4ed8' },
    agencyTag:   { fontSize: 9, color: '#6b7280', marginTop: 3 },
    invoiceBox:  { textAlign: 'right' },
    invLabel:    { fontSize: 8, color: '#9ca3af' },
    invNumber:   { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1d4ed8', marginTop: 2 },
    section:     { marginBottom: 20 },
    sectionHead: { fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    row:         { flexDirection: 'row', marginBottom: 3 },
    label:       { width: 100, color: '#6b7280' },
    value:       { flex: 1 },
    tableHead:   { flexDirection: 'row', borderBottom: '1 solid #111', paddingBottom: 5, marginBottom: 5, fontFamily: 'Helvetica-Bold' },
    tableRow:    { flexDirection: 'row', borderBottom: '0.5 solid #f0f0f0', paddingVertical: 5 },
    desc:        { flex: 4 },
    qty:         { flex: 1, textAlign: 'center' },
    price:       { flex: 2, textAlign: 'right' },
    amount:      { flex: 2, textAlign: 'right' },
    totalsRow:   { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
    totalsLabel: { width: 100, color: '#6b7280', textAlign: 'right', marginRight: 8 },
    totalsValue: { width: 80, textAlign: 'right' },
    grandTotal:  { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#111827' },
    footer:      { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#9ca3af', borderTop: '0.5 solid #e5e5e5', paddingTop: 8 },
  })

  const InvoiceDoc = () => (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          <View>
            <Text style={styles.agencyName}>{organization?.name}</Text>
            <Text style={styles.agencyTag}>Travel Agency</Text>
          </View>
          <View style={styles.invoiceBox}>
            <Text style={styles.invLabel}>INVOICE</Text>
            <Text style={styles.invNumber}>{invoice.invoice_number}</Text>
            <Text style={[styles.invLabel, { marginTop: 6 }]}>Issue date: {formatDate(invoice.issue_date)}</Text>
            {invoice.due_date && (
              <Text style={styles.invLabel}>Due date: {formatDate(invoice.due_date)}</Text>
            )}
          </View>
        </View>

        {/* Bill to */}
        <View style={styles.section}>
          <Text style={styles.sectionHead}>Bill to</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>
            {invoice.booking?.client?.full_name}
          </Text>
          {invoice.booking?.client?.email && <Text style={{ color: '#6b7280' }}>{invoice.booking.client.email}</Text>}
          {invoice.booking?.client?.phone && <Text style={{ color: '#6b7280' }}>{invoice.booking.client.phone}</Text>}
        </View>

        {/* Booking ref */}
        <View style={[styles.section, { backgroundColor: '#f9fafb', padding: 8, borderRadius: 4 }]}>
          <Text>Booking ref: <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1d4ed8' }}>{invoice.booking?.booking_ref}</Text>
            {invoice.booking?.package?.name ? `  •  ${invoice.booking.package.name}` : ''}
          </Text>
        </View>

        {/* Line items */}
        <View style={styles.section}>
          <View style={styles.tableHead}>
            <Text style={styles.desc}>Description</Text>
            <Text style={styles.qty}>Qty</Text>
            <Text style={styles.price}>Unit price</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>
          {invoice.items?.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Text style={styles.price}>{formatCurrency(item.unit_price, invoice.currency)}</Text>
              <Text style={styles.amount}>{formatCurrency(item.total, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={{ marginBottom: 20 }}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text style={styles.totalsValue}>- {formatCurrency(invoice.discount, invoice.currency)}</Text>
            </View>
          )}
          {invoice.tax_rate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({invoice.tax_rate}%)</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.tax_amount, invoice.currency)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, { borderTop: '1 solid #111', paddingTop: 6, marginTop: 4 }]}>
            <Text style={[styles.totalsLabel, { fontFamily: 'Helvetica-Bold' }]}>Total</Text>
            <Text style={[styles.totalsValue, styles.grandTotal]}>
              {formatCurrency(invoice.total, invoice.currency)}
            </Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionHead}>Notes</Text>
            <Text style={{ color: '#374151' }}>{invoice.notes}</Text>
          </View>
        )}

        {invoice.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionHead}>Terms & conditions</Text>
            <Text style={{ color: '#6b7280', fontSize: 8 }}>{invoice.terms}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          {organization?.name} • {invoice.invoice_number} • Generated {new Date().toLocaleDateString()}
        </Text>

      </Page>
    </Document>
  )

  return (
    <PDFDownloadLink
      document={<InvoiceDoc />}
      fileName={`${invoice.invoice_number}.pdf`}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
    >
      {({ loading }: { loading: boolean }) => (
        <>
          <Download size={15} />
          {loading ? 'Generating...' : 'Download PDF'}
        </>
      )}
    </PDFDownloadLink>
  )
}