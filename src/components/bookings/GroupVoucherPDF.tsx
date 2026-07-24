import { Document } from '@react-pdf/renderer'
import { VoucherPageContent } from './BookingVoucherPDF'

type Passenger = {
  id: string
  client: any
  total_amount: number
  paid_amount: number
  flight_number?: string | null
  pnr?: string | null
  seat_no?: string | null
}

type Props = {
  booking:      any
  organization: any
  flights:      any[]
  hotels:       any[]
  umrah:        any
  payments:     any[]
  visas:        any[]
  passengers:   Passenger[]
}

export default function GroupVoucherPDF({
  booking, organization, flights, hotels, umrah, payments, visas, passengers,
}: Props) {
  return (
    <Document
      title={`Group Vouchers — ${booking?.booking_ref ?? ''}`}
      author={organization?.name ?? 'TravelPro'}
    >
      {passengers.map(p => (
        <VoucherPageContent
          key={p.id}
          booking={booking}
          organization={organization}
          flights={flights}
          hotels={hotels}
          umrah={umrah}
          payments={payments}
          visas={visas}
          passengerOverride={{
            client:        p.client,
            total_amount:  p.total_amount,
            paid_amount:   p.paid_amount,
            flight_number: p.flight_number,
            pnr:           p.pnr,
            seat_no:       p.seat_no,
          }}
        />
      ))}
    </Document>
  )
}