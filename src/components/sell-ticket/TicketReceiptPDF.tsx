'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'

// Works from a SAVED daily_ticket_sales row (flat fields) instead of the
// wizard's live SaleData (nested outbound/return_leg/legs) — so the exact
// same branded receipt can be regenerated any time later, not just in the
// moment right after a sale.
export type ReceiptSale = {
  id:                 string
  receipt_number:     string | null
  eticket_number:     string | null
  buyer_name:         string
  buyer_passport:     string | null
  buyer_nationality:  string | null
  age_category:       string
  route_from:         string
  route_to:           string
  return_from?:       string | null
  return_to?:         string | null
  airline:            string | null
  seat_class:         string
  seat_number:        string | null
  pnr:                string | null
  baggage_kg:         number | null
  sold_price:         number
  currency:           string
  payment_status:     string
  sale_date:          string
  return_airline?:    string | null
  return_flight_no?:  string | null
  return_pnr?:        string | null
}

export type ReceiptLeg = { departure_city: string; arrival_city: string }

export function buildRouteSummary(sale: ReceiptSale, legs?: ReceiptLeg[]) {
  if (legs && legs.length > 0) {
    const cities = [legs[0].departure_city, ...legs.map(l => l.arrival_city)].filter(Boolean)
    return cities.join(' → ')
  }
  if (sale.return_from) {
    return `${sale.route_from} ⇄ ${sale.route_to}`
  }
  return `${sale.route_from} → ${sale.route_to}`
}

export default function TicketReceiptPDF({
  sale,
  legs,
  organization,
}: {
  sale: ReceiptSale
  legs?: ReceiptLeg[]
  organization: any
}) {
  const [PDFComponents, setPDFComponents] = useState<any>(null)

  useEffect(() => {
    import('@react-pdf/renderer').then(mod => setPDFComponents(mod))
  }, [])

  if (!PDFComponents) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 text-blue-400 px-4 py-3 rounded-xl text-sm">
        <Download size={16} />
        Loading PDF...
      </div>
    )
  }

  const { Document, Page, Text, View, StyleSheet, PDFDownloadLink } = PDFComponents
  const routeSummary = buildRouteSummary(sale, legs)

  const C = {
    blue:    '#1d4ed8', blueL: '#eff6ff',
    green:   '#166534', greenL: '#f0fdf4',
    gray:    '#374151', grayL:  '#f9fafb',
    grayMid: '#6b7280', border: '#e5e7eb',
    white:   '#ffffff', orange: '#9a3412',
  }

  const s = StyleSheet.create({
    page:        { padding: 0, fontFamily: 'Helvetica', fontSize: 9, backgroundColor: C.white },
    receipt:     { width: 320, margin: '20 auto', border: `1 solid ${C.border}`, borderRadius: 8, overflow: 'hidden' },
    header:      { backgroundColor: C.blue, padding: '14 18', alignItems: 'center' },
    agencyName:  { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white },
    agencyTag:   { fontSize: 8, color: '#bfdbfe', marginTop: 2 },
    receiptBadge:{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 8,
                   backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10,
                   paddingVertical: 4, borderRadius: 4 },
    body:        { padding: '14 18' },
    metaRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10,
                   paddingBottom: 10, borderBottom: `1 dashed ${C.border}` },
    metaLabel:   { fontSize: 7, color: C.grayMid, textTransform: 'uppercase' },
    metaValue:   { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 2 },
    secLabel:    { fontSize: 7, color: C.grayMid, textTransform: 'uppercase',
                   letterSpacing: 0.5, marginBottom: 5 },
    row:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label:       { fontSize: 8, color: C.grayMid },
    value:       { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray },
    flightBox:   { backgroundColor: C.blueL, borderRadius: 6, padding: '8 10', marginBottom: 10 },
    routeText:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.blue, textAlign: 'center' },
    totalRow:    { flexDirection: 'row', justifyContent: 'space-between',
                   backgroundColor: C.greenL, padding: '8 10', borderRadius: 6, marginTop: 8 },
    footer:      { backgroundColor: C.grayL, padding: '10 18', alignItems: 'center',
                   borderTop: `1 solid ${C.border}` },
    footerText:  { fontSize: 7, color: C.grayMid, textAlign: 'center', lineHeight: 1.5 },
    thankYou:    { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.blue, marginBottom: 3 },
  })

  const ReceiptDoc = () => (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.receipt}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.agencyName}>{organization?.name}</Text>
            <Text style={s.agencyTag}>Travel Agency</Text>
            <Text style={s.receiptBadge}>TICKET RECEIPT</Text>
          </View>

          <View style={s.body}>

            {/* Receipt meta */}
            <View style={s.metaRow}>
              <View>
                <Text style={s.metaLabel}>Receipt no.</Text>
                <Text style={[s.metaValue, { color: C.blue, fontFamily: 'Courier' }]}>
                  {sale.receipt_number ?? 'N/A'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.metaLabel}>Date</Text>
                <Text style={s.metaValue}>{formatDate(sale.sale_date)}</Text>
              </View>
            </View>

            {/* Passenger */}
            <Text style={s.secLabel}>Passenger</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 3 }}>
              {sale.buyer_name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
              {sale.buyer_passport && (
                <View>
                  <Text style={s.label}>Passport</Text>
                  <Text style={[s.value, { fontFamily: 'Courier' }]}>{sale.buyer_passport}</Text>
                </View>
              )}
              <View>
                <Text style={s.label}>Category</Text>
                <Text style={[s.value, { textTransform: 'capitalize' }]}>{sale.age_category}</Text>
              </View>
              <View>
                <Text style={s.label}>Nationality</Text>
                <Text style={s.value}>{sale.buyer_nationality}</Text>
              </View>
            </View>

            {/* Flight */}
            <Text style={s.secLabel}>Flight details</Text>
            <View style={s.flightBox}>
              <Text style={s.routeText}>{routeSummary}</Text>
              <Text style={{ fontSize: 8, color: C.blue, textAlign: 'center', marginTop: 3, textTransform: 'capitalize' }}>
                {sale.airline || '—'} • {sale.seat_class}
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              {[
                { label: 'E-Ticket',  value: sale.eticket_number ?? '—' },
                { label: 'PNR',       value: sale.pnr || '—' },
                { label: 'Seat',      value: sale.seat_number || (sale.age_category === 'infant' ? 'LAP (Infant)' : '—') },
                { label: 'Baggage',   value: `${sale.age_category === 'infant' ? 10 : (sale.baggage_kg ?? 23)}kg` },
                { label: 'Class',     value: sale.seat_class },
              ].map(row => (
                <View key={row.label} style={s.row}>
                  <Text style={s.label}>{row.label}</Text>
                  <Text style={[s.value, { fontFamily: 'Courier', fontSize: 8 }]}>{row.value}</Text>
                </View>
              ))}

              {/* Return leg */}
              {sale.return_from && (
                <View style={{ marginTop: 6, paddingTop: 6, borderTop: `0.5 solid ${C.border}` }}>
                  <Text style={[s.label, { marginBottom: 3 }]}>↩ Return flight</Text>
                  {[
                    { label: 'Airline',     value: sale.return_airline || sale.airline },
                    { label: 'Flight no.',  value: sale.return_flight_no || '—' },
                    { label: 'Route',       value: `${sale.return_from} → ${sale.return_to}` },
                    { label: 'PNR',         value: sale.return_pnr || '—' },
                  ].map(row => (
                    <View key={row.label} style={s.row}>
                      <Text style={s.label}>{row.label}</Text>
                      <Text style={[s.value, { fontFamily: 'Courier', fontSize: 8 }]}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Total */}
            <View style={s.totalRow}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.green }}>
                Amount paid
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.green }}>
                {formatCurrency(sale.sold_price, sale.currency)}
              </Text>
            </View>

            {sale.payment_status !== 'received' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between',
                backgroundColor: '#fef2f2', padding: '6 10', borderRadius: 6, marginTop: 6 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626' }}>
                  Balance pending
                </Text>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#dc2626' }}>
                  {formatCurrency(sale.sold_price, sale.currency)}
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.thankYou}>Thank you for your business!</Text>
            <Text style={s.footerText}>
              {organization?.name}{'\n'}
              This is a computer generated receipt.{'\n'}
              Please keep it for your records.
            </Text>
          </View>

        </View>
      </Page>
    </Document>
  )

  return (
    <PDFDownloadLink
      document={<ReceiptDoc />}
      fileName={`ticket-receipt-${sale.receipt_number ?? sale.id.slice(0, 8)}.pdf`}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition text-sm"
    >
      {({ loading: pdfLoading }: { loading: boolean }) => (
        <>
          <Download size={16} />
          {pdfLoading ? 'Generating PDF...' : 'Download PDF receipt'}
        </>
      )}
    </PDFDownloadLink>
  )
}