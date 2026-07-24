import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'

const S = StyleSheet.create({
 page: {
    fontFamily:      'Helvetica',
    fontSize:        9.5,   // was 10
    color:           '#1a1a2e',
    backgroundColor: '#ffffff',
    paddingTop:      30,     // was 36
    paddingBottom:   50,     // was 56
    paddingLeft:     32,     // was 36
    paddingRight:    32,     // was 36
  },

  // ── Header ──────────────────────────────────────────────────────
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
  },
  logo: {
    width:       48,
    height:      48,
    marginRight: 10,
  },
  flightLogo: {
    width:       28,
    height:      28,
    marginRight: 8,
  },
  flightHeaderRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  6,
  },
 watermark: {
    position:   'absolute',
    top:        '50%',
    left:       0,
    right:      0,
    textAlign:  'center',
    fontSize:   60,
    color:      '#1e3a5f',
    opacity:    0.06,
    fontFamily: 'Helvetica-Bold',
    transform:  'translateY(-50%) rotate(-30deg)',
  },
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'flex-start',
    marginBottom:      18,
    paddingBottom:     14,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  orgName: {
    fontSize:   16,
    fontFamily: 'Helvetica-Bold',
    color:      '#1e3a5f',
  },
  orgSub: {
    fontSize:  8,
    color:     '#6b7280',
    marginTop: 3,
  },
  voucherBadge: {
    backgroundColor:   '#1e3a5f',
    paddingVertical:    4,
    paddingHorizontal: 10,
    borderRadius:       3,
  },
  voucherBadgeText: {
    fontSize:   11,
    fontFamily: 'Helvetica-Bold',
    color:      '#ffffff',
  },
  refText: {
    fontSize:  8,
    color:     '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },

  // ── Section ──────────────────────────────────────────────────────
  section: {
    marginBottom: 9,
  },
  sectionBar: {
    flexDirection:     'row',
    alignItems:        'center',
    marginBottom:      7,
    paddingBottom:     4,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  sectionDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: '#1e3a5f',
    marginRight:     5,
  },
  sectionTitle: {
    fontSize:      9,
    fontFamily:    'Helvetica-Bold',
    color:         '#1e3a5f',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Card ─────────────────────────────────────────────────────────
 card: {
    backgroundColor: '#f8fafc',
    borderRadius:    5,
    padding:         8,      // was 10
    marginBottom:    5,      // was 6
    borderWidth:     1,
    borderColor:     '#e5e7eb',
  },

  // ── Field: label on top, value below ─────────────────────────────
  fieldRow: {
    flexDirection: 'row',
    marginBottom:  4,
  },
  field: {
    flex:        1,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize:      7.5,
    fontFamily:    'Helvetica-Bold',
    color:         '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom:  2,
  },
  fieldValue: {
    fontSize:  9.5,
    color:     '#111827',
    lineHeight: 1.3,
  },
  fieldValueBold: {
    fontSize:   9.5,
    fontFamily: 'Helvetica-Bold',
    color:      '#111827',
    lineHeight: 1.3,
  },

  // ── Two column layout ────────────────────────────────────────────
  twoCol: {
    flexDirection: 'row',
    gap:           8,
  },
  halfCol: {
    flex: 1,
  },

  // ── Payment box ──────────────────────────────────────────────────
  payBox: {
    backgroundColor: '#f0fdf4',
    borderRadius:    5,
    padding:         10,
    borderWidth:     1,
    borderColor:     '#bbf7d0',
  },
  payRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   4,
  },
  payLabel: {
    fontSize: 9,
    color:    '#374151',
    flex:     1,
  },
  payValue: {
    fontSize:   9,
    fontFamily: 'Helvetica-Bold',
    color:      '#111827',
  },
  payDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#86efac',
    marginVertical:    5,
  },
  totalLabel: {
    fontSize:   10,
    fontFamily: 'Helvetica-Bold',
    color:      '#166534',
    flex:       1,
  },
  totalValue: {
    fontSize:   10,
    fontFamily: 'Helvetica-Bold',
    color:      '#166534',
  },

  // ── Status / room type badge ──────────────────────────────────────
  badge: {
    paddingVertical:    2,
    paddingHorizontal:  7,
    borderRadius:       3,
    alignSelf:          'flex-start',
  },
  badgeText: {
    fontSize:      7.5,
    fontFamily:    'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  roomBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth:     1,
    borderColor:     '#a7f3d0',
    paddingVertical:   2,
    paddingHorizontal: 7,
    borderRadius:      3,
    alignSelf:         'flex-start',
  },
  roomBadgeText: {
    fontSize:      7.5,
    fontFamily:    'Helvetica-Bold',
    color:         '#047857',
    textTransform: 'capitalize',
  },

  // ── Footer ───────────────────────────────────────────────────────
  footer: {
    position:          'absolute',
    bottom:            20,
    left:              36,
    right:             36,
    paddingTop:        6,
    borderTopWidth:    1,
    borderTopColor:    '#e5e7eb',
    flexDirection:     'row',
    justifyContent:    'space-between',
  },
  footerText: {
    fontSize: 7.5,
    color:    '#9ca3af',
  },
})

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(v: any): string {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

function fmtDate(v: any): string {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleDateString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return String(v) }
}

function fmtMoney(v: any, cur = 'PKR'): string {
  const n = Number(v)
  if (!v || isNaN(n)) return '—'
  return `${cur} ${n.toLocaleString('en-PK')}`
}

function badgeColors(status: string) {
  const m: Record<string, [string, string]> = {
    confirmed: ['#dcfce7', '#166534'],
    completed: ['#dbeafe', '#1e40af'],
    cancelled: ['#fee2e2', '#991b1b'],
    inquiry:   ['#fef9c3', '#854d0e'],
    quoted:    ['#ede9fe', '#5b21b6'],
  }
  return m[status?.toLowerCase()] ?? ['#f3f4f6', '#374151']
}

// The room type chosen on the packages page's "Book Now" button is folded
// into the booking's notes as "Room type: X" (there's no dedicated column
// for it) — same convention as the booking detail page, so pull it out
// here too and show it as a badge next to the package summary.
function extractRoomType(notes?: string | null): string | null {
  if (!notes) return null
  const match = notes.match(/Room type:\s*(\w+)/i)
  return match ? match[1] : null
}

// flight_details has no logo/IATA field of its own, so the airline logo
// falls back to whatever IATA code the linked package stored — accurate
// for the common case of one airline per trip; if it's missing, no image
// is rendered rather than guessing wrong.
function airlineLogoUrl(iataCode?: string | null): string | null {
  if (!iataCode) return null
  return `https://pics.avs.io/200/200/${iataCode.toUpperCase()}.png`
}

// ─── Tiny building blocks ──────────────────────────────────────────────────
function SecTitle({ title }: { title: string }) {
  return (
    <View style={S.sectionBar}>
      <View style={S.sectionDot} />
      <Text style={S.sectionTitle}>{title}</Text>
    </View>
  )
}

function F({
  label, value, bold, flex,
}: {
  label: string
  value: string
  bold?: boolean
  flex?: number
}) {
  return (
    <View style={[S.field, flex ? { flex } : {}]}>
      <Text style={S.fieldLabel}>{label}</Text>
      <Text style={bold ? S.fieldValueBold : S.fieldValue}>{value}</Text>
    </View>
  )
}

// ─── Main Document ─────────────────────────────────────────────────────────
type Props = {
  booking:      any
  organization: any
  flights:      any[]
  hotels:       any[]
  umrah:        any
  payments:     any[]
  visas:        any[]
}

// Renders ONE page's worth of voucher content. Used directly for a single
// booking, and looped for group "download all" — each passenger gets their
// own page, sharing the same hotel/umrah/payment data but with their own
// client info, amount, and flight overrides if set.
export function VoucherPageContent({
  booking, organization, flights, hotels, umrah, payments, visas,
  passengerOverride,
}: Props & {
  passengerOverride?: {
    client: any
    total_amount: number
    paid_amount: number
    flight_number?: string | null
    pnr?: string | null
    seat_no?: string | null
  }
}) {
  const client     = passengerOverride?.client ?? booking?.client ?? {}
  const pkg        = booking?.package ?? {}
  const totalAmt   = passengerOverride ? passengerOverride.total_amount : Number(booking?.total_amount ?? 0)
  const paidAmt    = passengerOverride
    ? passengerOverride.paid_amount
    : (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)
  const balance    = totalAmt - paidAmt
  const [bgBadge, txtBadge] = badgeColors(booking?.status)
  const roomType   = extractRoomType(booking?.notes)
  const logoSrc    = airlineLogoUrl(pkg?.airline_iata_code)
  const displayPayments = (payments ?? []).slice(0, 4)
  const hiddenPaymentsCount = Math.max(0, (payments ?? []).length - displayPayments.length)

  // Per-passenger flight override — if this passenger has their own
  // flight_number/pnr/seat_no (split flights, individual seats), show
  // those instead of the shared booking-level flight rows for that field
  const effectiveFlights = (flights ?? []).map((f: any) => ({
    ...f,
    flight_number: passengerOverride?.flight_number || f.flight_number,
    pnr:           passengerOverride?.pnr           || f.pnr,
    seat_no:       passengerOverride?.seat_no       || f.seat_no,
  }))

  return (
    <Page size="A4" style={S.page}>

      <Text style={S.watermark} fixed>
        {fmt(organization?.name)}
      </Text>

      {/* ═══ HEADER ═════════════════════════════════════════════════ */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          {organization?.logo_url && (
            <Image src={organization.logo_url} style={S.logo} />
          )}
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={S.orgName}>{fmt(organization?.name)}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={S.voucherBadge}>
            <Text style={S.voucherBadgeText}>BOOKING VOUCHER</Text>
          </View>
          <Text style={S.refText}>Ref: {fmt(booking?.booking_ref)}</Text>
          <Text style={S.refText}>Date: {fmtDate(booking?.created_at)}</Text>
        </View>
      </View>

      {/* ═══ CLIENT + BOOKING ════════════════════════════════════════ */}
      <View style={S.section}>
        <SecTitle title="Booking Details" />
        <View style={S.twoCol}>

          <View style={[S.card, S.halfCol]}>
            <Text style={[S.fieldLabel, { marginBottom: 6 }]}>Client Information</Text>
            <View style={S.fieldRow}>
              <F label="Full Name"    value={fmt(client?.full_name)}      bold flex={2} />
            </View>
            <View style={S.fieldRow}>
              <F label="Phone"        value={fmt(client?.phone)}          />
              <F label="Nationality"  value={fmt(client?.nationality)}    />
            </View>
            {client?.passport_number && (
              <View style={S.fieldRow}>
                <F label="Passport No" value={fmt(client.passport_number)} />
                <F label="Date of Birth" value={fmtDate(client?.date_of_birth)} />
              </View>
            )}
          </View>

          <View style={[S.card, S.halfCol]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={S.fieldLabel}>Booking Summary</Text>
              {roomType && (
                <View style={S.roomBadge}>
                  <Text style={S.roomBadgeText}>{roomType} Room</Text>
                </View>
              )}
            </View>
            <View style={S.fieldRow}>
              <F label="Package"      value={fmt(pkg?.name ?? booking?.package_name)} bold flex={2} />
            </View>
            <View style={S.fieldRow}>
              <F label="Travel Date"  value={fmtDate(booking?.travel_date)}  />
              <F label="Return Date"  value={fmtDate(booking?.return_date)}  />
            </View>
            <View style={S.fieldRow}>
              <F
                label="Amount"
                value={fmtMoney(totalAmt, booking?.currency)}
                bold
              />
              <F
                label={balance > 0 ? 'Balance Due' : 'Payment'}
                value={balance > 0 ? fmtMoney(balance, booking?.currency) : 'Fully Paid'}
                bold
              />
            </View>
            <View style={[S.fieldRow, { marginTop: 2 }]}>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Status</Text>
                <View style={[S.badge, { backgroundColor: bgBadge }]}>
                  <Text style={[S.badgeText, { color: txtBadge }]}>
                    {fmt(booking?.status)}
                  </Text>
                </View>
              </View>
              {booking?.booking_ref && (
                <F label="Booking Ref" value={fmt(booking.booking_ref)} bold />
              )}
            </View>
          </View>
          
        </View>
      </View>

      {/* ═══ FLIGHTS ═════════════════════════════════════════════════ */}
      {effectiveFlights.length > 0 && (
        <View style={S.section}>
          <SecTitle title="Flight Details" />
          {effectiveFlights.map((f: any, i: number) => (
            <View key={i} style={S.card}>
              <View style={S.flightHeaderRow}>
                {logoSrc && <Image src={logoSrc} style={S.flightLogo} />}
                <View style={{ flex: 1 }}>
                  <View style={S.fieldRow}>
                    <F label="Airline"        value={fmt(f.airline)}          bold />
                    <F label="Flight No"      value={fmt(f.flight_number)}    />
                    <F label="Class"          value={fmt(f.seat_class)}       />
                    <F label="PNR"            value={fmt(f.pnr)}              />
                  </View>
                </View>
              </View>
              <View style={S.fieldRow}>
                <F label="From"           value={fmt(f.departure_city)}   bold />
                <F label="To"             value={fmt(f.arrival_city)}     bold />
                <F label="Seat No"        value={fmt(f.seat_no)}          />
                <F label="Baggage"        value={f.baggage_kg ? `${f.baggage_kg} kg` : '—'} />
              </View>
              <View style={S.fieldRow}>
                <F label="Trip Type"      value={fmt(f.trip_type)}        />
                <F label="Departure"      value={fmtDate(f.departure_time)} />
                <F label="Arrival"        value={fmtDate(f.arrival_time)}   />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ═══ HOTELS — shared across the whole group ══════════════════ */}
      {hotels?.length > 0 && (
        <View style={S.section}>
          <SecTitle title="Hotel Details" />
          {hotels.map((h: any, i: number) => (
            <View key={i} style={S.card}>
              <View style={S.fieldRow}>
                <F label="Hotel Name"     value={fmt(h.hotel_name)}  bold flex={2} />
                <F label="City"           value={fmt(h.city)}       />
              </View>
              <View style={S.fieldRow}>
                <F label="Check-in"       value={fmtDate(h.check_in)}   />
                <F label="Check-out"      value={fmtDate(h.check_out)} />
                <F label="Room Type"      value={fmt(h.room_type)}     />
                <F label="Nights"         value={fmt(h.nights)}        />
              </View>
            </View>
          ))}
        </View>
      )}

     {/* ═══ UMRAH — shared across the whole group ════════════════════ */}
      {umrah && (
        <View style={S.section}>
          <SecTitle title="Umrah Details" />
            <View style={S.card}>
            <View style={S.fieldRow}>
              <F label="Umrah Type"      value={fmt(umrah.umrah_type)}      bold />
              <F label="Maktab No"       value={fmt(umrah.maktab_number)}   />
              <F label="Group Leader"    value={fmt(umrah.group_leader)}    />
              <F label="Makkah Nights"   value={fmt(umrah.makkah_nights)}   />
              <F label="Madinah Nights"  value={fmt(umrah.madinah_nights)}  />
            </View>
          </View>
        </View>
      )}

    {/* ═══ PAYMENT SUMMARY ═════════════════════════════════════════
      <View style={S.section}>
        <SecTitle title="Payment Summary" />
        <View style={S.payBox}>
          <View style={S.payRow}>
            <Text style={S.payLabel}>{passengerOverride ? 'Passenger Amount' : 'Total Package Amount'}</Text>
            <Text style={S.payValue}>{fmtMoney(totalAmt, booking?.currency)}</Text>
          </View>
          {!passengerOverride && displayPayments.map((p: any, i: number) => (
            <View key={i} style={S.payRow}>
              <Text style={S.payLabel}>
                Payment {i + 1}
                {p.paid_at ? `  —  ${fmtDate(p.paid_at)}` : ''}
                {p.method  ? `  (${p.method})`            : ''}
              </Text>
              <Text style={S.payValue}>{fmtMoney(p.amount, booking?.currency)}</Text>
            </View>
          ))}
          {!passengerOverride && hiddenPaymentsCount > 0 && (
            <Text style={{ fontSize: 7, color: '#9ca3af', marginTop: 2 }}>
              +{hiddenPaymentsCount} more payment{hiddenPaymentsCount > 1 ? 's' : ''} — see booking page for full history
            </Text>
          )}
          <View style={S.payDivider} />
          <View style={S.payRow}>
            <Text style={S.totalLabel}>Amount Paid</Text>
            <Text style={S.totalValue}>{fmtMoney(paidAmt, booking?.currency)}</Text>
          </View>
          {balance > 0 ? (
            <View style={S.payRow}>
              <Text style={[S.payLabel, { color: '#dc2626' }]}>Balance Due</Text>
              <Text style={[S.payValue, { color: '#dc2626' }]}>{fmtMoney(balance, booking?.currency)}</Text>
            </View>
          ) : (
            <View style={S.payRow}>
              <Text style={[S.payLabel, { color: '#166534' }]}>Payment Status</Text>
              <Text style={[S.payValue, { color: '#166534' }]}>FULLY PAID</Text>
            </View>
          )}
        </View>
      </View> */}
      
      {/* ═══ FOOTER ══════════════════════════════════════════════════ */}
      <View style={S.footer} fixed>
        <Text style={S.footerText}>
          {fmt(organization?.name)}  —  Ref: {fmt(booking?.booking_ref)}
        </Text>
        <Text style={S.footerText}>
          {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>
    </Page>
  )
}

// ─── Single-booking wrapper — unchanged usage everywhere else ──────────────
export default function BookingVoucherPDF(props: Props) {
  return (
    <Document
      title={`Voucher — ${props.booking?.booking_ref ?? ''}`}
      author={props.organization?.name ?? 'TravelPro'}
    >
      <VoucherPageContent {...props} />
    </Document>
  )
}