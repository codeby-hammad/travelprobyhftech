'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { SaleData } from './SellTicketWizard'
import { MessageCircle, Download, Plus, Check } from 'lucide-react'

type Props = {
  sale:         any
  data:         SaleData
  organization: any
  onSellAnother: () => void
}

export default function SaleSuccess({ sale, data, organization, onSellAnother }: Props) {
  const [PDFComponents, setPDFComponents] = useState<any>(null)
  const [whatsappSent,  setWhatsappSent]  = useState(false)

  useEffect(() => {
    import('@react-pdf/renderer').then(mod => setPDFComponents(mod))
  }, [])

  const cost   = parseFloat(data.cost_price || '0')
  const sell   = parseFloat(data.sold_price || '0')
  const profit = sell - cost

  // Build route summary for display
  const routeSummary = (() => {
    if (data.journey_type === 'one_way')
      return `${data.outbound.departure_city} → ${data.outbound.arrival_city}`
    if (data.journey_type === 'return')
      return `${data.outbound.departure_city} ⇄ ${data.outbound.arrival_city}`
    if (data.journey_type === 'connecting' || data.journey_type === 'multi_city') {
      const cities = [
        data.legs[0]?.departure_city,
        ...data.legs.map(l => l.arrival_city),
      ].filter(Boolean)
      return cities.join(' → ')
    }
    if (data.journey_type === 'open_jaw')
      return `${data.outbound.departure_city} → ${data.outbound.arrival_city} / ${data.return_leg.departure_city} → ${data.return_leg.arrival_city || data.outbound.departure_city}`
    return '—'
  })()

  // WhatsApp message
  function openWhatsApp() {
    if (!data.buyer_phone) return
    const phone = data.buyer_phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')
    const finalPhone = phone.startsWith('0')
      ? '92' + phone.slice(1)
      : phone.startsWith('92')
        ? phone
        : '92' + phone

    const msg = [
      `✈ Ticket Confirmation`,
      `${organization?.name}`,
      ``,
      `Receipt: ${sale.receipt_number ?? 'N/A'}`,
      `E-Ticket: ${sale.eticket_number ?? 'N/A'}`,
      ``,
      `Passenger: ${data.buyer_name}`,
      `Route: ${routeSummary}`,
      `Airline: ${data.outbound.airline || data.legs[0]?.airline || '—'}`,
      data.outbound.pnr ? `PNR: ${data.outbound.pnr}` : '',
      data.seat_number  ? `Seat: ${data.seat_number}` : '',
      `Date: ${data.outbound.departure_time
        ? formatDate(data.outbound.departure_time.split('T')[0])
        : data.legs[0]?.departure_time
          ? formatDate(data.legs[0].departure_time.split('T')[0])
          : '—'
      }`,
      `Class: ${data.seat_class}`,
      `Baggage: ${data.baggage_kg}kg`,
      ``,
      `Amount paid: ${formatCurrency(sell, data.currency)}`,
      `Payment: ${data.payment_method.replace('_', ' ')}`,
      ``,
      `Safe travels! — ${organization?.name}`,
    ].filter(line => line !== null && line !== undefined).join('\n')

    window.open(
      `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`,
      '_blank'
    )
    setWhatsappSent(true)
  }

  // PDF receipt
  function buildPDF() {
    if (!PDFComponents) return null

    const { Document, Page, Text, View, StyleSheet, PDFDownloadLink } = PDFComponents

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
                  <Text style={s.metaValue}>{formatDate(data.sale_date)}</Text>
                </View>
              </View>

              {/* Passenger */}
              <Text style={s.secLabel}>Passenger</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 3 }}>
                {data.buyer_name}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                {data.buyer_passport && (
                  <View>
                    <Text style={s.label}>Passport</Text>
                    <Text style={[s.value, { fontFamily: 'Courier' }]}>{data.buyer_passport}</Text>
                  </View>
                )}
                <View>
                  <Text style={s.label}>Category</Text>
                  <Text style={[s.value, { textTransform: 'capitalize' }]}>{data.age_category}</Text>
                </View>
                <View>
                  <Text style={s.label}>Nationality</Text>
                  <Text style={s.value}>{data.buyer_nationality}</Text>
                </View>
              </View>

              {/* Flight */}
              <Text style={s.secLabel}>Flight details</Text>
              <View style={s.flightBox}>
                <Text style={s.routeText}>{routeSummary}</Text>
                <Text style={{ fontSize: 8, color: C.blue, textAlign: 'center', marginTop: 3, textTransform: 'capitalize' }}>
                  {data.journey_type.replace('_', ' ')} •{' '}
                  {data.outbound.airline || data.legs[0]?.airline || '—'} •{' '}
                  {data.seat_class}
                </Text>
              </View>

              <View style={{ marginBottom: 10 }}>
                {[
                  { label: 'E-Ticket',  value: sale.eticket_number ?? '—' },
                  { label: 'PNR',       value: data.outbound.pnr || data.legs[0]?.pnr || '—' },
                  { label: 'Seat',      value: data.seat_number || (data.age_category === 'infant' ? 'LAP (Infant)' : '—') },
                  { label: 'Baggage',   value: `${data.age_category === 'infant' ? 10 : data.baggage_kg}kg` },
                  { label: 'Class',     value: data.seat_class },
                ].map(row => (
                  <View key={row.label} style={s.row}>
                    <Text style={s.label}>{row.label}</Text>
                    <Text style={[s.value, { fontFamily: 'Courier', fontSize: 8 }]}>{row.value}</Text>
                  </View>
                ))}

                {/* Return leg */}
                {data.journey_type === 'return' && data.return_leg.departure_city && (
                  <View style={{ marginTop: 6, paddingTop: 6, borderTop: `0.5 solid ${C.border}` }}>
                    <Text style={[s.label, { marginBottom: 3 }]}>↩ Return flight</Text>
                    {[
                      { label: 'Airline',     value: data.return_leg.airline || data.outbound.airline },
                      { label: 'Flight no.',  value: data.return_leg.flight_number || '—' },
                      { label: 'Route',       value: `${data.return_leg.departure_city} → ${data.return_leg.arrival_city}` },
                      { label: 'PNR',         value: data.return_leg.pnr || '—' },
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
                  {formatCurrency(sell, data.currency)}
                </Text>
              </View>

              {data.payment_status !== 'received' && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between',
                  backgroundColor: '#fef2f2', padding: '6 10', borderRadius: 6, marginTop: 6 }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626' }}>
                    Balance pending
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#dc2626' }}>
                    {formatCurrency(sell, data.currency)}
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
        fileName={`ticket-receipt-${sale.receipt_number ?? sale.id.slice(0,8)}.pdf`}
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

  return (
    <div className="space-y-5">

      {/* Success banner */}
      <div className="bg-green-600 rounded-2xl p-6 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black">Ticket Sold!</h2>
        <p className="text-green-200 mt-1">
          {sale.receipt_number && `Receipt: ${sale.receipt_number}`}
          {sale.eticket_number && ` • E-Ticket: ${sale.eticket_number}`}
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Sale summary</h3>

        <div className="bg-blue-50 rounded-xl p-3">
          <p className="font-bold text-blue-900">{routeSummary}</p>
          <p className="text-blue-600 text-xs mt-0.5 capitalize">
            {data.journey_type.replace('_', ' ')} •{' '}
            {data.outbound.airline || data.legs[0]?.airline} •{' '}
            {data.seat_class}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: 'Passenger',     value: data.buyer_name },
            { label: 'Passport',      value: data.buyer_passport || '—' },
            { label: 'PNR',           value: data.outbound.pnr || data.legs[0]?.pnr || '—' },
            { label: 'Seat',          value: data.seat_number || '—' },
            { label: 'Amount paid',   value: formatCurrency(sell, data.currency) },
            { label: 'Profit',        value: formatCurrency(profit, data.currency) },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs text-gray-400">{row.label}</p>
              <p className="font-medium text-gray-900">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Send to customer:</p>

        {/* WhatsApp */}
        {data.buyer_phone ? (
          <button
            onClick={openWhatsApp}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${
              whatsappSent
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <MessageCircle size={18} />
            {whatsappSent
              ? '✓ WhatsApp opened — send the message'
              : `Send via WhatsApp — ${data.buyer_phone}`
            }
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 text-gray-400 text-sm border border-gray-100">
            <MessageCircle size={18} />
            No phone number — WhatsApp not available
          </div>
        )}

        {/* PDF */}
        {PDFComponents ? buildPDF() : (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-400 px-4 py-3 rounded-xl text-sm">
            <Download size={16} />
            Loading PDF...
          </div>
        )}
      </div>

      {/* Sell another */}
      <button
        onClick={onSellAnother}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition text-sm font-medium"
      >
        <Plus size={16} />
        Sell another ticket
      </button>
    </div>
  )
}