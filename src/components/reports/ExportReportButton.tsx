'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

type Props = {
  bookings: any[]
  monthlyPnl: any[]
  topClients: { name: string; total: number; count: number }[]
  revenueByPackage: { name: string; total: number; count: number }[]
  revenueByAgent: { name: string; total: number; count: number }[]
}

export default function ExportReportButton({
  bookings,
  monthlyPnl,
  topClients,
  revenueByPackage,
  revenueByAgent,
}: Props) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      // Sheet 1: All bookings
      const bookingsSheet = XLSX.utils.json_to_sheet(
        bookings.map((b: any) => ({
          'Booking Ref': b.booking_ref,
          'Client': b.client?.full_name ?? '',
          'Package': b.package?.name ?? 'Custom',
          'Status': b.status,
          'Travel Date': b.travel_date,
          'Total Amount': Number(b.total_amount),
          'Paid Amount': Number(b.paid_amount),
          'Balance': Number(b.total_amount) - Number(b.paid_amount),
          'Currency': b.currency,
        }))
      )
      XLSX.utils.book_append_sheet(wb, bookingsSheet, 'Bookings')

      // Sheet 2: Monthly P&L
      if (monthlyPnl.length > 0) {
        const pnlSheet = XLSX.utils.json_to_sheet(
          monthlyPnl.map((row: any) => ({
            'Month': row.month_label,
            'Bookings': row.total_bookings,
            'Revenue': Number(row.total_revenue),
            'Costs': Number(row.total_costs),
            'Profit': Number(row.gross_profit),
            'Margin %': Number(row.profit_margin),
          }))
        )
        XLSX.utils.book_append_sheet(wb, pnlSheet, 'Monthly P&L')
      }

      // Sheet 3: Revenue by package
      const pkgSheet = XLSX.utils.json_to_sheet(
        revenueByPackage.map(p => ({
          'Package': p.name,
          'Bookings': p.count,
          'Revenue': p.total,
        }))
      )
      XLSX.utils.book_append_sheet(wb, pkgSheet, 'Revenue by Package')

      // Sheet 4: Revenue by agent
      const agentSheet = XLSX.utils.json_to_sheet(
        revenueByAgent.map(a => ({
          'Agent': a.name,
          'Bookings': a.count,
          'Revenue': a.total,
        }))
      )
      XLSX.utils.book_append_sheet(wb, agentSheet, 'Revenue by Agent')

      // Sheet 5: Top clients
      const clientsSheet = XLSX.utils.json_to_sheet(
        topClients.map((c, i) => ({
          'Rank': i + 1,
          'Client': c.name,
          'Bookings': c.count,
          'Total Value': c.total,
        }))
      )
      XLSX.utils.book_append_sheet(wb, clientsSheet, 'Top Clients')

      // Generate and download
      const fileName = `TravelPro_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (err) {
      console.error('Export failed', err)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
    >
      {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      {exporting ? 'Exporting...' : 'Export to Excel'}
    </button>
  )
}