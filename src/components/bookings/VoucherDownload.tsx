'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Props = {
  booking:      any
  organization: any
  flights:      any[]
  hotels:       any[]
  umrah:        any
  payments:     any[]
  visas:        any[]
}

export default function VoucherDownload({
  booking,
  organization,
  flights,
  hotels,
  umrah,
  payments,
  visas,
}: Props) {
  const [PDFComponents, setPDFComponents] = useState<any>(null)

  useEffect(() => {
    import('@react-pdf/renderer').then(mod => setPDFComponents(mod))
  }, [])

  if (!PDFComponents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Preparing voucher...</p>
        </div>
      </div>
    )
  }

  const {
    Document, Page, Text, View,
    StyleSheet, PDFDownloadLink, Line, Svg,
  } = PDFComponents

  const C = {
    blue:       '#1d4ed8',
    bluLight:   '#eff6ff',
    green:      '#166534',
    greenLight: '#f0fdf4',
    orange:     '#9a3412',
    orangeLight:'#fff7ed',
    purple:     '#5b21b6',
    purpleLight:'#faf5ff',
    gray:       '#374151',
    grayLight:  '#f9fafb',
    grayMid:    '#6b7280',
    border:     '#e5e7eb',
    black:      '#111827',
    white:      '#ffffff',
    red:        '#dc2626',
  }

  const s = StyleSheet.create({
    page:           { padding: 36, fontFamily: 'Helvetica', fontSize: 9, color: C.gray, backgroundColor: C.white },

    // Header
    header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: `2 solid ${C.blue}` },
    agencyName:     { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.blue },
    agencyTag:      { fontSize: 8, color: C.grayMid, marginTop: 3 },
    refBox:         { backgroundColor: C.bluLight, padding: '8 12', borderRadius: 6, alignItems: 'flex-end' },
    refLabel:       { fontSize: 7, color: C.grayMid, textTransform: 'uppercase', letterSpacing: 0.5 },
    refNumber:      { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.blue, marginTop: 2 },
    statusBadge:    { fontSize: 7, color: C.white, backgroundColor: C.blue, padding: '2 6', borderRadius: 4, marginTop: 4, alignSelf: 'flex-end' },

    // Section
    section:        { marginBottom: 14 },
    sectionHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    sectionTitle:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.black },
    sectionLine:    { flex: 1, height: 1, backgroundColor: C.border, marginLeft: 8 },

    // Cards
    card:           { backgroundColor: C.grayLight, borderRadius: 6, padding: '10 12', marginBottom: 6 },
    cardBlue:       { backgroundColor: C.bluLight,    borderRadius: 6, padding: '10 12', marginBottom: 6 },
    cardGreen:      { backgroundColor: C.greenLight,  borderRadius: 6, padding: '10 12', marginBottom: 6 },
    cardOrange:     { backgroundColor: C.orangeLight, borderRadius: 6, padding: '10 12', marginBottom: 6 },
    cardPurple:     { backgroundColor: C.purpleLight, borderRadius: 6, padding: '10 12', marginBottom: 6 },

    // Grid
    row:            { flexDirection: 'row', marginBottom: 4 },
    col2:           { flex: 1 },
    col3:           { flex: 1 },
    col4:           { flex: 1 },
    label:          { fontSize: 7, color: C.grayMid, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
    value:          { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.black },
    valueNormal:    { fontSize: 9, color: C.gray },

    // Table
    tableHeader:    { flexDirection: 'row', backgroundColor: C.blue, borderRadius: '4 4 0 0', padding: '5 8' },
    tableHeaderText:{ fontSize: 7, color: C.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
    tableRow:       { flexDirection: 'row', borderBottom: `0.5 solid ${C.border}`, padding: '5 8' },
    tableRowAlt:    { flexDirection: 'row', borderBottom: `0.5 solid ${C.border}`, padding: '5 8', backgroundColor: C.grayLight },
    tableCell:      { fontSize: 8, color: C.gray },
    tableCellBold:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.black },

    // Payment
    payRow:         { flexDirection: 'row', justifyContent: 'space-between', padding: '5 8', borderBottom: `0.5 solid ${C.border}` },
    payTotal:       { flexDirection: 'row', justifyContent: 'space-between', padding: '8 8', backgroundColor: C.greenLight },
    balanceRow:     { flexDirection: 'row', justifyContent: 'space-between', padding: '8 8', backgroundColor: '#fef2f2' },

    // Footer
    footer:         { position: 'absolute', bottom: 24, left: 36, right: 36 },
    footerLine:     { borderTop: `1 solid ${C.border}`, marginBottom: 6 },
    footerText:     { fontSize: 7, color: C.grayMid, textAlign: 'center' },

    // Misc
    tag:            { fontSize: 7, padding: '2 6', borderRadius: 4, alignSelf: 'flex-start' },
    divider:        { borderBottom: `0.5 solid ${C.border}`, marginVertical: 8 },
    bold:           { fontFamily: 'Helvetica-Bold' },
    green:          { color: C.green },
    red:            { color: C.red },
    blue:           { color: C.blue },
  })

  const totalPaid    = payments.reduce((s, p) => s + Number(p.amount), 0)
  const balance      = Number(booking.total_amount) - totalPaid
  const mealLabels: Record<string, string> = {
    room_only:     'Room only',
    bed_breakfast: 'Bed & Breakfast',
    half_board:    'Half Board',
    full_board:    'Full Board',
  }

  function SectionTitle({ title, emoji }: { title: string; emoji: string }) {
    return (
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{emoji}  {title}</Text>
        <View style={s.sectionLine} />
      </View>
    )
  }

  function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
      <View style={s.row}>
        <Text style={[s.col2, s.label]}>{label}</Text>
        <Text style={[s.col2, bold ? s.value : s.valueNormal]}>{value}</Text>
      </View>
    )
  }

  const VoucherDoc = () => (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ─────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.agencyName}>{organization?.name ?? 'Travel Agency'}</Text>
            <Text style={s.agencyTag}>✈  Official Booking Voucher</Text>
            <Text style={[s.agencyTag, { marginTop: 6 }]}>
              Issued: {new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}
            </Text>
          </View>
          <View style={s.refBox}>
            <Text style={s.refLabel}>Booking Reference</Text>
            <Text style={s.refNumber}>{booking.booking_ref}</Text>
            <Text style={s.statusBadge}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── CLIENT DETAILS ──────────────────────── */}
        <View style={s.section}>
          <SectionTitle title="Client Details" emoji="👤" />
          <View style={s.cardBlue}>
            <View style={s.row}>
              <View style={s.col2}>
                <Text style={s.label}>Full name</Text>
                <Text style={s.value}>{booking.client?.full_name}</Text>
              </View>
              <View style={s.col2}>
                <Text style={s.label}>Phone</Text>
                <Text style={s.value}>{booking.client?.phone ?? '—'}</Text>
              </View>
              <View style={s.col2}>
                <Text style={s.label}>Email</Text>
                <Text style={s.valueNormal}>{booking.client?.email ?? '—'}</Text>
              </View>
            </View>
            {booking.client?.passport_number && (
              <View style={[s.row, { marginTop: 6 }]}>
                <View style={s.col2}>
                  <Text style={s.label}>Passport number</Text>
                  <Text style={[s.value, { fontFamily: 'Courier', fontSize: 10 }]}>
                    {booking.client.passport_number}
                  </Text>
                </View>
                <View style={s.col2}>
                  <Text style={s.label}>Passport expiry</Text>
                  <Text style={s.value}>
                    {booking.client.passport_expiry
                      ? formatDate(booking.client.passport_expiry)
                      : '—'}
                  </Text>
                </View>
                <View style={s.col2}>
                  <Text style={s.label}>Nationality</Text>
                  <Text style={s.value}>{booking.client.nationality ?? '—'}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── TRIP DETAILS ────────────────────────── */}
        <View style={s.section}>
          <SectionTitle title="Trip Details" emoji="✈" />
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.col4}>
                <Text style={s.label}>Package</Text>
                <Text style={s.value}>{booking.package?.name ?? 'Custom booking'}</Text>
              </View>
              <View style={s.col4}>
                <Text style={s.label}>Destination</Text>
                <Text style={s.value}>{booking.package?.destination ?? '—'}</Text>
              </View>
              <View style={s.col4}>
                <Text style={s.label}>Passengers</Text>
                <Text style={s.value}>{booking.num_passengers}</Text>
              </View>
              <View style={s.col4}>
                <Text style={s.label}>Agent</Text>
                <Text style={s.value}>{booking.agent?.full_name ?? '—'}</Text>
              </View>
            </View>
            <View style={[s.row, { marginTop: 8 }]}>
              <View style={s.col4}>
                <Text style={s.label}>Travel date</Text>
                <Text style={s.value}>
                  {booking.travel_date ? formatDate(booking.travel_date) : '—'}
                </Text>
              </View>
              <View style={s.col4}>
                <Text style={s.label}>Return date</Text>
                <Text style={s.value}>
                  {booking.return_date ? formatDate(booking.return_date) : '—'}
                </Text>
              </View>
              <View style={s.col4}>
                <Text style={s.label}>Duration</Text>
                <Text style={s.value}>
                  {booking.package?.duration_days
                    ? `${booking.package.duration_days} days`
                    : '—'}
                </Text>
              </View>
              <View style={s.col4}>
                <Text style={s.label}>Status</Text>
                <Text style={[s.value, s.blue]}>
                  {booking.status.toUpperCase()}
                </Text>
              </View>
            </View>
            {booking.notes && (
              <View style={{ marginTop: 8, paddingTop: 8, borderTop: `0.5 solid ${C.border}` }}>
                <Text style={s.label}>Notes</Text>
                <Text style={s.valueNormal}>{booking.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── UMRAH DETAILS ───────────────────────── */}
        {umrah && (
          <View style={s.section}>
            <SectionTitle title="Umrah Details" emoji="🕋" />
            <View style={s.cardGreen}>
              <View style={s.row}>
                <View style={s.col4}>
                  <Text style={s.label}>Umrah type</Text>
                  <Text style={s.value}>{umrah.umrah_type}</Text>
                </View>
                <View style={s.col4}>
                  <Text style={s.label}>Visa type</Text>
                  <Text style={s.value}>{umrah.visa_type}</Text>
                </View>
                <View style={s.col4}>
                  <Text style={s.label}>Departure city</Text>
                  <Text style={s.value}>{umrah.departure_city}</Text>
                </View>
                <View style={s.col4}>
                  <Text style={s.label}>Transport</Text>
                  <Text style={s.value}>{umrah.transport_type.replace('_', ' ')}</Text>
                </View>
              </View>
              <View style={[s.row, { marginTop: 8 }]}>
                <View style={s.col4}>
                  <Text style={s.label}>Makkah nights</Text>
                  <Text style={s.value}>{umrah.makkah_nights} nights</Text>
                </View>
                <View style={s.col4}>
                  <Text style={s.label}>Madinah nights</Text>
                  <Text style={s.value}>{umrah.madinah_nights} nights</Text>
                </View>
                <View style={s.col4}>
                  <Text style={s.label}>Ziarat Makkah</Text>
                  <Text style={s.value}>{umrah.ziarat_makkah ? '✓ Yes' : '✗ No'}</Text>
                </View>
                <View style={s.col4}>
                  <Text style={s.label}>Ziarat Madinah</Text>
                  <Text style={s.value}>{umrah.ziarat_madinah ? '✓ Yes' : '✗ No'}</Text>
                </View>
              </View>
              {(umrah.maktab_number || umrah.group_leader || umrah.ihram_point) && (
                <View style={[s.row, { marginTop: 8 }]}>
                  {umrah.maktab_number && (
                    <View style={s.col3}>
                      <Text style={s.label}>Maktab no.</Text>
                      <Text style={s.value}>{umrah.maktab_number}</Text>
                    </View>
                  )}
                  {umrah.group_leader && (
                    <View style={s.col3}>
                      <Text style={s.label}>Group leader</Text>
                      <Text style={s.value}>{umrah.group_leader}</Text>
                    </View>
                  )}
                  {umrah.ihram_point && (
                    <View style={s.col3}>
                      <Text style={s.label}>Ihram point</Text>
                      <Text style={s.value}>{umrah.ihram_point}</Text>
                    </View>
                  )}
                </View>
              )}
              {umrah.special_requests && (
                <View style={{ marginTop: 8, paddingTop: 6, borderTop: `0.5 solid #bbf7d0` }}>
                  <Text style={s.label}>Special requests</Text>
                  <Text style={s.valueNormal}>{umrah.special_requests}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── PACKAGE INCLUDES ────────────────────── */}
        {booking.package?.includes?.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="What's Included" emoji="✅" />
            <View style={s.card}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {booking.package.includes.map((item: string, i: number) => (
                  <Text key={i} style={[s.valueNormal, { marginRight: 12, marginBottom: 3 }]}>
                    ✓  {item}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── FLIGHT DETAILS ──────────────────────── */}
        {flights.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Flight Details" emoji="✈" />
            {flights.map((f: any, i: number) => (
              <View key={f.id} style={[s.cardBlue, { marginBottom: 6 }]}>
                <View style={s.row}>
                  <View style={{ flex: 0.5 }}>
                    <Text style={[s.tag, {
                      backgroundColor: f.trip_type === 'outbound' ? C.blue : C.purple,
                      color:           C.white,
                    }]}>
                      {f.trip_type === 'outbound' ? 'OUTBOUND' : 'RETURN'}
                    </Text>
                  </View>
                  <View style={s.col3}>
                    <Text style={s.label}>Airline</Text>
                    <Text style={s.value}>{f.airline ?? '—'}</Text>
                  </View>
                  <View style={s.col3}>
                    <Text style={s.label}>Flight no.</Text>
                    <Text style={[s.value, { fontFamily: 'Courier' }]}>{f.flight_number ?? '—'}</Text>
                  </View>
                  <View style={s.col3}>
                    <Text style={s.label}>PNR</Text>
                    <Text style={[s.value, { fontFamily: 'Courier', fontSize: 11 }]}>{f.pnr ?? '—'}</Text>
                  </View>
                  <View style={s.col3}>
                    <Text style={s.label}>Class</Text>
                    <Text style={s.value}>{f.seat_class ?? 'Economy'} • {f.baggage_kg}kg</Text>
                  </View>
                </View>
                {(f.departure_city || f.arrival_city) && (
                  <View style={[s.row, { marginTop: 8, alignItems: 'center' }]}>
                    <View style={s.col3}>
                      <Text style={s.label}>From</Text>
                      <Text style={s.value}>{f.departure_city ?? '—'}</Text>
                      {f.departure_time && (
                        <Text style={[s.valueNormal, { fontSize: 8, marginTop: 2 }]}>
                          {new Date(f.departure_time).toLocaleString('en-PK', {
                            dateStyle: 'short', timeStyle: 'short'
                          })}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 0.3, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: C.blue }}>→</Text>
                    </View>
                    <View style={s.col3}>
                      <Text style={s.label}>To</Text>
                      <Text style={s.value}>{f.arrival_city ?? '—'}</Text>
                      {f.arrival_time && (
                        <Text style={[s.valueNormal, { fontSize: 8, marginTop: 2 }]}>
                          {new Date(f.arrival_time).toLocaleString('en-PK', {
                            dateStyle: 'short', timeStyle: 'short'
                          })}
                        </Text>
                      )}
                    </View>
                    {f.terminal && (
                      <View style={s.col3}>
                        <Text style={s.label}>Terminal</Text>
                        <Text style={s.value}>{f.terminal}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── HOTEL DETAILS ───────────────────────── */}
        {hotels.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Hotel Details" emoji="🏨" />
            {hotels.map((h: any) => (
              <View key={h.id} style={[s.cardOrange, { marginBottom: 6 }]}>
                <View style={s.row}>
                  <View style={s.col2}>
                    <Text style={s.label}>Hotel</Text>
                    <Text style={s.value}>{h.hotel_name}</Text>
                    <Text style={[s.valueNormal, { fontSize: 8 }]}>
                      {h.city}{h.stars ? ` • ${'★'.repeat(h.stars)}` : ''}
                    </Text>
                  </View>
                  <View style={s.col3}>
                    <Text style={s.label}>Check-in</Text>
                    <Text style={s.value}>{h.check_in ? formatDate(h.check_in) : '—'}</Text>
                  </View>
                  <View style={s.col3}>
                    <Text style={s.label}>Check-out</Text>
                    <Text style={s.value}>{h.check_out ? formatDate(h.check_out) : '—'}</Text>
                  </View>
                  <View style={s.col3}>
                    <Text style={s.label}>Nights</Text>
                    <Text style={s.value}>{h.nights ?? '—'}</Text>
                  </View>
                </View>
                <View style={[s.row, { marginTop: 6 }]}>
                  {h.room_type && (
                    <View style={s.col3}>
                      <Text style={s.label}>Room type</Text>
                      <Text style={s.valueNormal}>{h.room_type}</Text>
                    </View>
                  )}
                  {h.meal_plan && (
                    <View style={s.col3}>
                      <Text style={s.label}>Meal plan</Text>
                      <Text style={s.valueNormal}>{mealLabels[h.meal_plan] ?? h.meal_plan}</Text>
                    </View>
                  )}
                  {h.confirmation_no && (
                    <View style={s.col3}>
                      <Text style={s.label}>Confirmation no.</Text>
                      <Text style={[s.value, { fontFamily: 'Courier' }]}>{h.confirmation_no}</Text>
                    </View>
                  )}
                  {h.distance_haram && (
                    <View style={s.col3}>
                      <Text style={s.label}>Distance Haram</Text>
                      <Text style={s.valueNormal}>{h.distance_haram}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── VISA DETAILS ────────────────────────── */}
        {visas.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Visa Information" emoji="🛂" />
            <View style={{ borderRadius: 6, overflow: 'hidden' }}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderText, { flex: 2 }]}>Passenger</Text>
                <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Type</Text>
                <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Status</Text>
                <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Visa no.</Text>
                <Text style={[s.tableHeaderText, { flex: 1.5 }]}>Expiry</Text>
              </View>
              {visas.map((v: any, i: number) => (
                <View key={v.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 2 }]}>{v.client?.full_name ?? '—'}</Text>
                  <Text style={[s.tableCell, { flex: 1.5 }]}>{v.visa_type}</Text>
                  <Text style={[s.tableCellBold, { flex: 1.5 }]}>{v.status.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={[s.tableCell, { flex: 1.5, fontFamily: 'Courier' }]}>{v.visa_number ?? '—'}</Text>
                  <Text style={[s.tableCell, { flex: 1.5 }]}>{v.expiry_date ? formatDate(v.expiry_date) : '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── PAYMENT DETAILS ─────────────────────── */}
        <View style={s.section}>
          <SectionTitle title="Payment Details" emoji="💳" />
          <View style={{ borderRadius: 6, overflow: 'hidden', border: `0.5 solid ${C.border}` }}>

            {/* Header row */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderText, { flex: 2 }]}>Date</Text>
              <Text style={[s.tableHeaderText, { flex: 2 }]}>Method</Text>
              <Text style={[s.tableHeaderText, { flex: 2 }]}>Reference</Text>
              <Text style={[s.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Amount</Text>
            </View>

            {/* Payment rows */}
            {payments.length === 0 ? (
              <View style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1, textAlign: 'center', color: C.grayMid }]}>
                  No payments recorded
                </Text>
              </View>
            ) : (
              payments.map((p: any, i: number) => (
                <View key={p.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 2 }]}>{formatDate(p.paid_at)}</Text>
                  <Text style={[s.tableCell, { flex: 2 }]}>{p.method.replace('_', ' ')}</Text>
                  <Text style={[s.tableCell, { flex: 2, fontFamily: 'Courier' }]}>{p.reference_no ?? '—'}</Text>
                  <Text style={[s.tableCellBold, { flex: 1.5, textAlign: 'right', color: C.green }]}>
                    {formatCurrency(p.amount, p.currency)}
                  </Text>
                </View>
              ))
            )}

            {/* Total paid */}
            <View style={s.payTotal}>
              <Text style={[s.bold, { fontSize: 9 }]}>Total paid</Text>
              <Text style={[s.bold, { fontSize: 10, color: C.green }]}>
                {formatCurrency(totalPaid, booking.currency)}
              </Text>
            </View>

            {/* Balance due */}
            {balance > 0 && (
              <View style={s.balanceRow}>
                <Text style={[s.bold, { fontSize: 9, color: C.red }]}>Balance due</Text>
                <Text style={[s.bold, { fontSize: 10, color: C.red }]}>
                  {formatCurrency(balance, booking.currency)}
                </Text>
              </View>
            )}

            {balance <= 0 && (
              <View style={[s.payTotal, { backgroundColor: C.greenLight }]}>
                <Text style={[s.bold, { fontSize: 9, color: C.green }]}>✓ Fully paid</Text>
                <Text style={[s.bold, { fontSize: 9, color: C.green }]}>
                  {formatCurrency(booking.total_amount, booking.currency)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── FOOTER ──────────────────────────────── */}
        <View style={s.footer} fixed>
          <View style={s.footerLine} />
          <Text style={s.footerText}>
            {organization?.name}  •  Booking Ref: {booking.booking_ref}  •  Generated: {new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}
          </Text>
          <Text style={[s.footerText, { marginTop: 2 }]}>
            This is an official booking voucher. Please carry this document during your travel.
          </Text>
        </View>

      </Page>
    </Document>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center shadow-sm">

        {/* Icon */}
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">📄</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Booking Voucher</h1>
        <p className="text-blue-600 font-mono font-medium mb-1">{booking.booking_ref}</p>
        <p className="text-gray-500 text-sm mb-1">{booking.client?.full_name}</p>
        <p className="text-gray-400 text-xs mb-6">
          {booking.package?.destination ?? 'Custom booking'}
          {booking.travel_date ? ` • ${formatDate(booking.travel_date)}` : ''}
        </p>

        {/* Contents preview */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">This voucher includes:</p>
          {[
            { icon: '👤', label: 'Client & passport details', always: true },
            { icon: '✈️', label: 'Trip details & package info', always: true },
            { icon: '🕋', label: 'Umrah details',              show: !!umrah           },
            { icon: '✈️', label: `${flights.length} flight(s)`,show: flights.length > 0 },
            { icon: '🏨', label: `${hotels.length} hotel(s)`,  show: hotels.length  > 0 },
            { icon: '🛂', label: `${visas.length} visa(s)`,    show: visas.length   > 0 },
            { icon: '💳', label: 'Payment history',            always: true },
          ].filter(item => item.always || item.show).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <span className="text-green-500 ml-auto">✓</span>
            </div>
          ))}
        </div>

        <PDFDownloadLink
          document={<VoucherDoc />}
          fileName={`${booking.booking_ref}-voucher.pdf`}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-medium text-sm w-full"
        >
          {({ loading }: { loading: boolean }) =>
            loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF...
              </span>
            ) : (
              <span>⬇ Download Complete Voucher PDF</span>
            )
          }
        </PDFDownloadLink>

        </div>
    </div>
  )
}