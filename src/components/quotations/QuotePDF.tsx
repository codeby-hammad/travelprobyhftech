import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: 2, borderBottomColor: '#2563eb', paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' },
  label: { color: '#6b7280' },
  value: { color: '#111827', fontWeight: 'bold' },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 6 },
  tableRow: { flexDirection: 'row', padding: 6, borderBottom: 1, borderBottomColor: '#f3f4f6' },
  colType: { width: '15%', fontSize: 9, color: '#6b7280' },
  colDesc: { width: '40%', fontSize: 9 },
  colQty: { width: '10%', fontSize: 9, textAlign: 'right' },
  colPrice: { width: '15%', fontSize: 9, textAlign: 'right' },
  colTotal: { width: '20%', fontSize: 9, textAlign: 'right', fontWeight: 'bold' },
  totalsBox: { marginTop: 16, alignSelf: 'flex-end', width: 220 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: 1, borderTopColor: '#e5e7eb' },
  notes: { marginTop: 24, fontSize: 9, color: '#6b7280', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
})

export default function QuotePDF({ quote, items }: { quote: any; items: any[] }) {
  const recipientName = quote.client?.full_name ?? quote.lead_name
  const recipientEmail = quote.client?.email ?? quote.lead_email
  const recipientPhone = quote.client?.phone ?? quote.lead_phone

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>HAMMAD TRAVELERS</Text>
          <Text style={styles.subtitle}>Quotation {quote.quote_number}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prepared For</Text>
          <Text style={styles.value}>{recipientName}</Text>
          {recipientEmail && <Text style={styles.label}>{recipientEmail}</Text>}
          {recipientPhone && <Text style={styles.label}>{recipientPhone}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{quote.title}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Destination: {quote.destination ?? '-'}</Text>
            <Text style={styles.label}>Travel date: {quote.travel_date ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colType}>Type</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colType}>{item.item_type}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{Number(item.unit_price).toLocaleString()}</Text>
              <Text style={styles.colTotal}>{Number(item.total).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text>{Number(quote.subtotal).toLocaleString()}</Text>
          </View>
          {quote.discount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Discount</Text>
              <Text>-{Number(quote.discount).toLocaleString()}</Text>
            </View>
          )}
          {quote.tax > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Tax</Text>
              <Text>+{Number(quote.tax).toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={{ fontWeight: 'bold' }}>Total</Text>
            <Text style={{ fontWeight: 'bold' }}>Rs {Number(quote.total).toLocaleString()}</Text>
          </View>
        </View>

        {quote.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes & Terms</Text>
            <Text>{quote.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          This quotation is valid until {quote.valid_until ?? 'further notice'}. Prices subject to availability at time of booking.
        </Text>
      </Page>
    </Document>
  )
}