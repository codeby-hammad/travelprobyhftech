'use client'

import { useEffect, useState } from 'react'
import { Download }            from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Props = {
  sale:         any
  batch:        any
  passengers:   any[]
  legs:         any[]
  organization: any
}

export default function TicketVoucherButton({
  sale, batch, passengers, legs, organization
}: Props) {

  const [PDFComponents, setPDFComponents] = useState<any>(null)

  useEffect(() => {
    import('@react-pdf/renderer').then(mod => setPDFComponents(mod))
  }, [])

  if (!PDFComponents) {
    return (
      <button disabled
        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-400">
        <Download size={15} /> Loading...
      </button>
    )
  }

  const { Document, Page, Text, View, StyleSheet, PDFDownloadLink } = PDFComponents

  const C = {
    blue:    '#1d4ed8',
    blueDk:  '#1e3a8a',
    blueL:   '#eff6ff',
    gray:    '#374151',
    grayL:   '#f9fafb',
    grayMid: '#6b7280',
    border:  '#e5e7eb',
    white:   '#ffffff',
    green:   '#166534',
    greenL:  '#f0fdf4',
    red:     '#dc2626',
    purple:  '#7c3aed',
    orange:  '#9a3412',
  }

  const ageCatLabels: Record<string, string> = {
    adult:  'ADT', child: 'CHD', infant: 'INF'
  }

  const s = StyleSheet.create({
    page:        { fontFamily: 'Helvetica', fontSize: 9, color: C.gray, backgroundColor: C.white },
    ticket:      { margin: '10 20', border: `1 solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },

    // Ticket header bar
    ticketHeader:   { backgroundColor: C.blue, padding: '12 16', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    agencyName:     { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white },
    agencyTag:      { fontSize: 8, color: '#93c5fd', marginTop: 2 },
    eticketBox:     { textAlign: 'right' },
    eticketLabel:   { fontSize: 7, color: '#93c5fd', textTransform: 'uppercase' },
    eticketNumber:  { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 2 },

    // Flight strip
    flightStrip: { backgroundColor: C.blueDk, padding: '10 16', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cityCode:    { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.white },
    cityName:    { fontSize: 8, color: '#93c5fd', marginTop: 2 },
    arrow:       { fontSize: 18, color: '#93c5fd', marginHorizontal: 16 },
    flightMeta:  { textAlign: 'right' },
    flightLabel: { fontSize: 7, color: '#93c5fd' },
    flightValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 1 },

    // Passenger section
    passengerSection: { padding: '12 16', backgroundColor: C.white },
    sectionLabel:     { fontSize: 7, color: C.grayMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    nameRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    passengerName:    { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.blue, flex: 1 },
    catBadge:         { fontSize: 9, fontFamily: 'Helvetica-Bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },

    // Info grid
    infoGrid:    { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    infoCell:    { width: '25%', marginBottom: 8 },
    infoLabel:   { fontSize: 7, color: C.grayMid, marginBottom: 2 },
    infoValue:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.gray },

    // Divider with cut marks
    divider:     { borderTop: `1 dashed ${C.border}`, marginHorizontal: 16, marginVertical: 4 },

    // Baggage / conditions strip
    bottomStrip: { backgroundColor: C.grayL, padding: '8 16', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fareBox:     { textAlign: 'right' },
    fareLabel:   { fontSize: 7, color: C.grayMid },
    fareValue:   { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.blue },

    // Summary page
    summaryPage:   { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: C.gray },
    summaryHeader: { backgroundColor: C.blue, padding: '16 20', borderRadius: '8 8 0 0', flexDirection: 'row', justifyContent: 'space-between' },
    summaryTitle:  { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white },
    tableHead:     { flexDirection: 'row', backgroundColor: C.blue, padding: '6 8' },
    tableHeadText: { fontSize: 7, color: C.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
    tableRow:      { flexDirection: 'row', borderBottom: `0.5 solid ${C.border}`, padding: '6 8' },
    tableRowAlt:   { flexDirection: 'row', borderBottom: `0.5 solid ${C.border}`, padding: '6 8', backgroundColor: C.grayL },
    tableCell:     { fontSize: 8, color: C.gray },
    tableBold:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111827' },
    totalRow:      { flexDirection: 'row', backgroundColor: C.blueL, padding: '8 8', borderTop: `1 solid ${C.blue}` },
    footer:        { position: 'absolute', bottom: 20, left: 30, right: 30, borderTop: `0.5 solid ${C.border}`, paddingTop: 6, textAlign: 'center', fontSize: 7, color: C.grayMid },
    conditions:    { fontSize: 7, color: C.grayMid, lineHeight: 1.5, marginTop: 4 },
  })

  const VoucherDoc = () => (
    <Document>

      {/* ── PAGE 1: Individual tickets ───────────────── */}
      <Page size="A4" style={s.page}>
        {passengers.map((pax: any, i: number) => {
          const catColor =
            pax.age_category === 'adult'  ? C.blue   :
            pax.age_category === 'child'  ? C.purple :
                                             C.orange

          return (
            <View key={pax.id} style={s.ticket}>

              {/* Agency header */}
              <View style={s.ticketHeader}>
                <View>
                  <Text style={s.agencyName}>{organization?.name}</Text>
                  <Text style={s.agencyTag}>Electronic Ticket / Boarding Pass</Text>
                </View>
                <View style={s.eticketBox}>
                  <Text style={s.eticketLabel}>E-Ticket Number</Text>
                  <Text style={s.eticketNumber}>
                    {pax.eticket_number ?? 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Flight strip — supports multi-leg */}
{legs && legs.length > 1 ? (
  <View>
    {legs.map((leg: any, li: number) => (
      <View key={leg.id} style={[s.flightStrip, { marginBottom: li < legs.length - 1 ? 2 : 0 }]}>
        <View>
          <Text style={s.cityCode}>
            {leg.departure_city?.match(/\(([^)]+)\)/)?.[1] ?? leg.departure_city?.slice(0,3).toUpperCase()}
          </Text>
          <Text style={s.cityName}>{leg.departure_city}</Text>
        </View>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 14, color: '#93c5fd' }}>✈</Text>
          <Text style={{ fontSize: 7, color: '#93c5fd', marginTop: 2 }}>
            {leg.airline}{leg.flight_number ? ' ' + leg.flight_number : ''}
            {legs.length > 1 ? ` (Leg ${li+1}/${legs.length})` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.cityCode}>
            {leg.arrival_city?.match(/\(([^)]+)\)/)?.[1] ?? leg.arrival_city?.slice(0,3).toUpperCase()}
          </Text>
          <Text style={[s.cityName, { textAlign: 'right' }]}>{leg.arrival_city}</Text>
        </View>
        <View style={[s.flightMeta, { marginLeft: 16 }]}>
          {leg.departure_time && (
            <>
              <Text style={s.flightLabel}>Depart</Text>
              <Text style={s.flightValue}>
                {new Date(leg.departure_time).toLocaleString('en-PK', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
              </Text>
            </>
          )}
          {leg.arrival_time && (
            <>
              <Text style={[s.flightLabel, { marginTop: 4 }]}>Arrive</Text>
              <Text style={s.flightValue}>
                {new Date(leg.arrival_time).toLocaleString('en-PK', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
              </Text>
            </>
          )}
        </View>
      </View>
    ))}
    {/* Layover notes between legs */}
    {legs.slice(0, -1).map((leg: any, li: number) => leg.layover_minutes && (
      <View key={`layover-${li}`} style={{ backgroundColor: '#fef9c3', padding: '4 16', flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 7, color: '#92400e', fontFamily: 'Helvetica-Bold' }}>
          🕐 Layover in {leg.arrival_city}: {
            leg.layover_minutes >= 60
              ? `${Math.floor(leg.layover_minutes/60)}h ${leg.layover_minutes%60}m`
              : `${leg.layover_minutes}m`
          }
        </Text>
      </View>
    ))}
  </View>
) : (
  /* Single leg — original layout */
  <View style={s.flightStrip}>
    <View>
      <Text style={s.cityCode}>
        {batch.route_from?.match(/\(([^)]+)\)/)?.[1] ??
         batch.route_from?.slice(0, 3).toUpperCase()}
      </Text>
      <Text style={s.cityName}>{batch.route_from}</Text>
    </View>

    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 18, color: '#93c5fd' }}>✈</Text>
      <Text style={{ fontSize: 7, color: '#93c5fd', marginTop: 2 }}>
        {batch.airline}
        {batch.flight_number ? ' ' + batch.flight_number : ''}
      </Text>
    </View>

    <View style={{ alignItems: 'flex-end' }}>
      <Text style={s.cityCode}>
        {batch.route_to?.match(/\(([^)]+)\)/)?.[1] ??
         batch.route_to?.slice(0, 3).toUpperCase()}
      </Text>
      <Text style={[s.cityName, { textAlign: 'right' }]}>
        {batch.route_to}
      </Text>
    </View>

    <View style={[s.flightMeta, { marginLeft: 20 }]}>
      <Text style={s.flightLabel}>Date</Text>
      <Text style={s.flightValue}>
        {new Date(batch.flight_date).toLocaleDateString('en-PK', {
          day: '2-digit', month: 'short', year: 'numeric'
        })}
      </Text>
      <Text style={[s.flightLabel, { marginTop: 4 }]}>Class</Text>
      <Text style={[s.flightValue, { textTransform: 'capitalize' }]}>
        {batch.seat_class}
      </Text>
    </View>
  </View>
)}

              {/* Passenger details */}
              <View style={s.passengerSection}>
                <Text style={s.sectionLabel}>Passenger details</Text>

                <View style={s.nameRow}>
                  <Text style={s.passengerName}>{pax.full_name}</Text>
                  <View style={[s.catBadge, {
                    backgroundColor: catColor + '20',
                    borderColor:     catColor,
                    border:          `1 solid ${catColor}`,
                  }]}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: catColor }}>
                      {ageCatLabels[pax.age_category]}
                    </Text>
                  </View>
                </View>

                <View style={s.infoGrid}>
                  {[
                    { label: 'Passport No.',   value: pax.passport_number ?? '—'       },
                    { label: 'Nationality',    value: pax.nationality     ?? '—'       },
                    { label: 'Date of birth',  value: pax.date_of_birth
                        ? formatDate(pax.date_of_birth) : '—'                           },
                    { label: 'Gender',         value: pax.gender === 'male' ? 'Male' : 'Female' },
                    { label: 'Seat',           value: pax.seat_number ??
                        (pax.age_category === 'infant' ? 'LAP (Infant)' : '—')         },
                    { label: 'PNR',            value: sale.pnr ?? '—'                  },
                    { label: 'Baggage',        value: `${pax.baggage_kg} KG`           },
                    { label: 'Booking Ref.',   value: sale.group_ref                   },
                  ].map(item => (
                    <View key={item.label} style={s.infoCell}>
                      <Text style={s.infoLabel}>{item.label}</Text>
                      <Text style={[s.infoValue, { fontFamily: 'Courier', fontSize: 8 }]}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={s.divider} />

              {/* Bottom strip */}
              <View style={s.bottomStrip}>
                <View>
                  <Text style={{ fontSize: 7, color: C.grayMid }}>
                    Issued by: {organization?.name}
                  </Text>
                  <Text style={{ fontSize: 7, color: C.grayMid, marginTop: 2 }}>
                    Issue date: {new Date().toLocaleDateString('en-PK')} •
                    Category: {pax.age_category.toUpperCase()}
                  </Text>
                  {pax.age_category === 'infant' && (
                    <Text style={{ fontSize: 7, color: C.orange, marginTop: 2 }}>
                      ⚠ Infant travels on adult's lap — no seat assigned
                    </Text>
                  )}
                </View>
                <View style={s.fareBox}>
                  <Text style={s.fareLabel}>TICKET FARE</Text>
                  <Text style={s.fareValue}>
                    {formatCurrency(pax.ticket_price, pax.currency)}
                  </Text>
                  <Text style={{ fontSize: 7, color: C.grayMid, marginTop: 2 }}>
                    {batch.currency} • {batch.seat_class}
                  </Text>
                </View>
              </View>

            </View>
          )
        })}

        {/* Footer */}
        <Text style={[s.footer, { position: 'absolute', bottom: 10, left: 20, right: 20 }]}>
          {organization?.name} • {sale.group_ref}
          {sale.pnr ? ` • PNR: ${sale.pnr}` : ''} •
          This is an electronic ticket. Please carry a valid photo ID and passport.
        </Text>
      </Page>

      {/* ── PAGE 2: Passenger manifest / invoice ─────── */}
      <Page size="A4" style={s.summaryPage}>

        {/* Header */}
        <View style={[s.summaryHeader, { marginBottom: 0, borderRadius: 0 }]}>
          <View>
            <Text style={s.summaryTitle}>Passenger Manifest</Text>
            <Text style={{ fontSize: 8, color: '#93c5fd', marginTop: 2 }}>
              {organization?.name} • Group booking invoice
            </Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>
              {sale.group_ref}
            </Text>
            {sale.pnr && (
              <Text style={{ fontSize: 8, color: '#93c5fd', marginTop: 2 }}>
                PNR: {sale.pnr}
              </Text>
            )}
          </View>
        </View>

        {/* Flight info bar */}
        <View style={{
          backgroundColor: C.blueDk, padding: '8 16',
          flexDirection: 'row', justifyContent: 'space-between',
          marginBottom: 16
        }}>
          {[
            { label: 'Route',   value: `${batch.route_from} → ${batch.route_to}` },
            { label: 'Flight',  value: `${batch.airline}${batch.flight_number ? ' ' + batch.flight_number : ''}` },
            { label: 'Date',    value: new Date(batch.flight_date).toLocaleDateString('en-PK', { dateStyle: 'medium' }) },
            { label: 'Class',   value: batch.seat_class?.toUpperCase() },
            { label: 'Pax',     value: `${sale.total_pax} (${sale.adult_count}A/${sale.child_count}C/${sale.infant_count}I)` },
          ].map(item => (
            <View key={item.label}>
              <Text style={{ fontSize: 7, color: '#93c5fd' }}>{item.label}</Text>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 1 }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Passenger table */}
        <View style={{ borderRadius: 6, overflow: 'hidden', border: `0.5 solid ${C.border}` }}>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadText, { width: 20 }]}>#</Text>
            <Text style={[s.tableHeadText, { flex: 3 }]}>Passenger name</Text>
            <Text style={[s.tableHeadText, { flex: 1, textAlign: 'center' }]}>Type</Text>
            <Text style={[s.tableHeadText, { flex: 2 }]}>Passport</Text>
            <Text style={[s.tableHeadText, { flex: 1.5 }]}>DOB</Text>
            <Text style={[s.tableHeadText, { flex: 1, textAlign: 'center' }]}>Seat</Text>
            <Text style={[s.tableHeadText, { flex: 2 }]}>E-Ticket</Text>
            <Text style={[s.tableHeadText, { flex: 1.5, textAlign: 'right' }]}>Fare</Text>
          </View>

          {passengers.map((pax: any, i: number) => (
            <View key={pax.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCell, { width: 20 }]}>{i + 1}</Text>
              <Text style={[s.tableBold, { flex: 3 }]}>{pax.full_name}</Text>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                {ageCatLabels[pax.age_category]}
              </Text>
              <Text style={[s.tableCell, { flex: 2, fontFamily: 'Courier', fontSize: 7 }]}>
                {pax.passport_number ?? '—'}
              </Text>
              <Text style={[s.tableCell, { flex: 1.5, fontSize: 7 }]}>
                {pax.date_of_birth ? formatDate(pax.date_of_birth) : '—'}
              </Text>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                {pax.seat_number ?? (pax.age_category === 'infant' ? 'LAP' : '—')}
              </Text>
              <Text style={[s.tableCell, { flex: 2, fontFamily: 'Courier', fontSize: 7, color: C.blue }]}>
                {pax.eticket_number ?? '—'}
              </Text>
              <Text style={[s.tableBold, { flex: 1.5, textAlign: 'right' }]}>
                {formatCurrency(pax.ticket_price, pax.currency)}
              </Text>
            </View>
          ))}

          {/* Total row */}
          <View style={s.totalRow}>
            <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
              Total — {sale.total_pax} passenger{sale.total_pax > 1 ? 's' : ''}
            </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.blue }}>
              {formatCurrency(sale.total_amount, sale.currency)}
            </Text>
          </View>
        </View>

        {/* Payment info */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          marginTop: 16, gap: 12
        }}>
          <View style={{
            flex: 1, backgroundColor: C.grayL,
            borderRadius: 6, padding: 12
          }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 6 }}>
              Payment details
            </Text>
            {[
              { label: 'Total amount', value: formatCurrency(sale.total_amount, sale.currency) },
              { label: 'Amount paid',  value: formatCurrency(sale.paid_amount,  sale.currency) },
              { label: 'Balance',      value: formatCurrency(sale.total_amount - sale.paid_amount, sale.currency) },
              { label: 'Method',       value: sale.payment_method?.replace('_', ' ') ?? '—' },
              { label: 'Status',       value: sale.payment_status?.toUpperCase()     ?? '—' },
            ].map(row => (
              <View key={row.label} style={{
                flexDirection: 'row', justifyContent: 'space-between',
                marginBottom: 3
              }}>
                <Text style={{ fontSize: 8, color: C.grayMid }}>{row.label}</Text>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1, backgroundColor: C.grayL, borderRadius: 6, padding: 12 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 6 }}>
              Booking info
            </Text>
            {[
              { label: 'Booking ref',  value: sale.group_ref                   },
              { label: 'PNR',          value: sale.pnr          ?? 'Pending'   },
              { label: 'Sale date',    value: formatDate(sale.sale_date)       },
              { label: 'Airline',      value: batch.airline                    },
              { label: 'Agency',       value: organization?.name ?? '—'        },
            ].map(row => (
              <View key={row.label} style={{
                flexDirection: 'row', justifyContent: 'space-between',
                marginBottom: 3
              }}>
                <Text style={{ fontSize: 8, color: C.grayMid }}>{row.label}</Text>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms */}
        <View style={{ marginTop: 16 }}>
          <Text style={[s.conditions, { borderTop: `0.5 solid ${C.border}`, paddingTop: 8 }]}>
            Terms & conditions: This ticket is non-refundable unless stated otherwise.
            Passengers must carry valid passport and this ticket at all times.
            Check-in closes 60 minutes before departure for domestic and 3 hours for international flights.
            Baggage allowance as stated. Infants must travel on adult lap.
            {organization?.name} is not responsible for flight delays or cancellations by the airline.
          </Text>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          {organization?.name} • Issued: {new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })} •
          This is a computer generated document
        </Text>

      </Page>
    </Document>
  )

  return (
    <PDFDownloadLink
      document={<VoucherDoc />}
      fileName={`${sale.group_ref}-tickets.pdf`}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
    >
      {({ loading }: { loading: boolean }) => (
        <>
          <Download size={15} />
          {loading ? 'Generating PDF...' : 'Download tickets PDF'}
        </>
      )}
    </PDFDownloadLink>
  )
}