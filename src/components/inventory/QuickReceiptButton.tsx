'use client'

import { useEffect, useState } from 'react'
import { Download, Receipt }   from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Props = {
  seat:         any
  batch:        any
  organization: any
}

export default function QuickReceiptButton({ seat, batch, organization }: Props) {
  const [PDFComponents, setPDFComponents] = useState<any>(null)

  useEffect(() => {
    import('@react-pdf/renderer').then(mod => setPDFComponents(mod))
  }, [])

  if (!PDFComponents) {
    return (
      <button disabled
        className="flex items-center gap-1.5 border border-gray-200 px-2.5 py-1 rounded-lg text-xs text-gray-400">
        <Download size={12} /> Loading...
      </button>
    )
  }

  const { Document, Page, Text, View, StyleSheet, PDFDownloadLink } = PDFComponents

  const C = {
    blue:    '#1d4ed8',
    blueL:   '#eff6ff',
    gray:    '#374151',
    grayL:   '#f9fafb',
    grayMid: '#6b7280',
    border:  '#e5e7eb',
    white:   '#ffffff',
    green:   '#166534',
    greenL:  '#f0fdf4',
    red:     '#dc2626',
  }

  // Use spot info if this was a spot purchase, otherwise batch info
  const airline = seat.is_spot_purchase
    ? (seat.spot_airline ?? batch.airline)
    : batch.airline

  const route = seat.is_spot_purchase
    ? (seat.spot_route ?? `${batch.route_from} → ${batch.route_to}`)
    : `${batch.route_from} → ${batch.route_to}`

  const buyerName = seat.buyer_name ?? 'Walk-in customer'
  const balance   = seat.payment_status === 'received' ? 0 : Number(seat.sold_price)

  const s = StyleSheet.create({
    page:        { padding: 0, fontFamily: 'Helvetica', fontSize: 9, color: C.gray, backgroundColor: C.white },

    receipt:     { width: 320, margin: '24 auto', border: `1 solid ${C.border}`, borderRadius: 10, overflow: 'hidden' },

    header:      { backgroundColor: C.blue, padding: '16 20', alignItems: 'center' },
    agencyName:  { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.white },
    agencyTag:   { fontSize: 8, color: '#bfdbfe', marginTop: 3 },

    receiptTitle:{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 10,
                   backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },

    body:        { padding: '16 20' },

    metaRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10,
                   paddingBottom: 10, borderBottom: `1 dashed ${C.border}` },
    metaLabel:   { fontSize: 7, color: C.grayMid, textTransform: 'uppercase' },
    metaValue:   { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 2 },

    section:     { marginBottom: 12 },
    sectionLabel:{ fontSize: 7, color: C.grayMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

    row:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    label:       { fontSize: 9, color: C.grayMid },
    value:       { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.gray },

    divider:     { borderTop: `1 dashed ${C.border}`, marginVertical: 10 },

    totalRow:    { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.greenL,
                   padding: '10 12', borderRadius: 6, marginTop: 4 },
    totalLabel:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.green },
    totalValue:  { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.green },

    balanceRow:  { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fef2f2',
                   padding: '10 12', borderRadius: 6, marginTop: 8 },
    balanceLabel:{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.red },
    balanceValue:{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.red },

    footer:      { backgroundColor: C.grayL, padding: '12 20', alignItems: 'center',
                   borderTop: `1 solid ${C.border}` },
    footerText:  { fontSize: 7, color: C.grayMid, textAlign: 'center', lineHeight: 1.5 },
    thankYou:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.blue, marginBottom: 4 },
  })

  const ReceiptDoc = () => (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.receipt}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.agencyName}>{organization?.name}</Text>
            <Text style={s.agencyTag}>Travel Agency</Text>
            <Text style={s.receiptTitle}>PAYMENT RECEIPT</Text>
          </View>

          <View style={s.body}>

            {/* Receipt meta */}
            <View style={s.metaRow}>
              <View>
                <Text style={s.metaLabel}>Receipt No.</Text>
                <Text style={[s.metaValue, { color: C.blue, fontFamily: 'Courier' }]}>
                  {seat.receipt_number ?? 'N/A'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.metaLabel}>Date</Text>
                <Text style={s.metaValue}>
                  {seat.sold_date ? formatDate(seat.sold_date) : formatDate(new Date().toISOString())}
                </Text>
              </View>
            </View>

            {/* Customer */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Received from</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111827' }}>
                {buyerName}
              </Text>
            </View>

            {/* Flight details */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Flight details</Text>
              <View style={s.row}>
                <Text style={s.label}>Airline</Text>
                <Text style={s.value}>{airline}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Route</Text>
                <Text style={s.value}>{route}</Text>
              </View>
              {batch.flight_date && (
                <View style={s.row}>
                  <Text style={s.label}>Flight date</Text>
                  <Text style={s.value}>{formatDate(batch.flight_date)}</Text>
                </View>
              )}
              <View style={s.row}>
                <Text style={s.label}>Class</Text>
                <Text style={[s.value, { textTransform: 'capitalize' }]}>{batch.seat_class}</Text>
              </View>
              {seat.seat_number && (
                <View style={s.row}>
                  <Text style={s.label}>Seat number</Text>
                  <Text style={[s.value, { fontFamily: 'Courier' }]}>{seat.seat_number}</Text>
                </View>
              )}
              {seat.pnr && (
                <View style={s.row}>
                  <Text style={s.label}>PNR</Text>
                  <Text style={[s.value, { fontFamily: 'Courier' }]}>{seat.pnr}</Text>
                </View>
              )}
              {seat.is_spot_purchase && (
                <View style={[s.row, { marginTop: 2 }]}>
                  <Text style={[s.label, { color: '#9a3412' }]}>Booking type</Text>
                  <Text style={[s.value, { color: '#9a3412' }]}>Spot purchase</Text>
                </View>
              )}
            </View>

            <View style={s.divider} />

            {/* Payment info */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Payment details</Text>
              <View style={s.row}>
                <Text style={s.label}>Payment method</Text>
                <Text style={[s.value, { textTransform: 'capitalize' }]}>
                  {seat.payment_method?.replace('_', ' ') ?? '—'}
                </Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Ticket fare</Text>
                <Text style={s.value}>
                  {formatCurrency(seat.sold_price, batch.currency)}
                </Text>
              </View>
            </View>

            {/* Total paid */}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                {balance === 0 ? 'Total Paid' : 'Amount Received'}
              </Text>
              <Text style={s.totalValue}>
                {formatCurrency(
                  balance === 0 ? seat.sold_price : (Number(seat.sold_price) - balance),
                  batch.currency
                )}
              </Text>
            </View>

            {/* Balance if any */}
            {balance > 0 && (
              <View style={s.balanceRow}>
                <Text style={s.balanceLabel}>Balance Due</Text>
                <Text style={s.balanceValue}>
                  {formatCurrency(balance, batch.currency)}
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.thankYou}>Thank you for your business!</Text>
            <Text style={s.footerText}>
              {organization?.name}{'\n'}
              This receipt is computer generated and does not require a signature.{'\n'}
              Please keep this receipt for your records.
            </Text>
          </View>

        </View>
      </Page>
    </Document>
  )

  return (
    <PDFDownloadLink
      document={<ReceiptDoc />}
      fileName={`receipt-${seat.receipt_number ?? seat.id.slice(0,8)}.pdf`}
      className="flex items-center gap-1.5 bg-green-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-green-700 transition"
    >
      {({ loading }: { loading: boolean }) => (
        <>
          <Receipt size={12} />
          {loading ? 'Generating...' : 'Receipt'}
        </>
      )}
    </PDFDownloadLink>
  )
}