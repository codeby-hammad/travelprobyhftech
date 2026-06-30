// Ready-made message templates for common notifications
// Agents can use these as-is or edit before sending

export type TemplateData = {
  clientName:   string
  bookingRef:   string
  destination?: string
  travelDate?:  string
  returnDate?:  string
  totalAmount?: string
  paidAmount?:  string
  balance?:     string
  agencyName?:  string
  agentName?:   string
  paymentMethod?: string
  paymentAmount?: string
}

export const templates = {
  booking_confirmation: (d: TemplateData) => ({
    subject: `Booking Confirmed — ${d.bookingRef}`,
    body: `Dear ${d.clientName},

We are pleased to confirm your booking with us.

📋 Booking Reference: ${d.bookingRef}
${d.destination ? `🌍 Destination: ${d.destination}` : ''}
${d.travelDate  ? `✈️ Travel Date: ${d.travelDate}`   : ''}
${d.returnDate  ? `🔄 Return Date: ${d.returnDate}`   : ''}
${d.totalAmount ? `💰 Total Amount: ${d.totalAmount}`  : ''}
${d.paidAmount  ? `✅ Amount Paid: ${d.paidAmount}`    : ''}
${d.balance     ? `⏳ Balance Due: ${d.balance}`       : ''}

Please keep this reference number for your records. Our team will be in touch with further details.

Thank you for choosing ${d.agencyName ?? 'us'} for your travel needs.

Best regards,
${d.agentName ?? 'Your Travel Agent'}`,
  }),

  payment_receipt: (d: TemplateData) => ({
    subject: `Payment Received — ${d.bookingRef}`,
    body: `Dear ${d.clientName},

We have received your payment. Thank you!

📋 Booking Reference: ${d.bookingRef}
💳 Payment Method: ${d.paymentMethod ?? 'N/A'}
💰 Amount Received: ${d.paymentAmount ?? d.paidAmount ?? 'N/A'}
${d.balance && parseFloat(d.balance.replace(/[^0-9.]/g, '')) > 0
  ? `⏳ Remaining Balance: ${d.balance}`
  : '✅ Your account is fully paid'}

Thank you for your prompt payment.

Best regards,
${d.agentName ?? 'Your Travel Agent'}`,
  }),

  travel_reminder: (d: TemplateData) => ({
    subject: `Travel Reminder — Your trip is coming up!`,
    body: `Dear ${d.clientName},

This is a friendly reminder that your trip is approaching.

📋 Booking Reference: ${d.bookingRef}
${d.destination ? `🌍 Destination: ${d.destination}` : ''}
${d.travelDate  ? `✈️ Departure: ${d.travelDate}`    : ''}
${d.returnDate  ? `🔄 Return: ${d.returnDate}`        : ''}

Please ensure you have:
- Your valid passport
- Your visa documents
- Travel insurance documents
- All required vaccinations

Please arrive at the airport at least 3 hours before departure.

Have a wonderful trip!

Best regards,
${d.agentName ?? 'Your Travel Agent'}`,
  }),

  custom: (_d: TemplateData) => ({
    subject: '',
    body:    '',
  }),
}