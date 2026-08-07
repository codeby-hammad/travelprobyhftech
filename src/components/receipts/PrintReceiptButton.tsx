'use client'

import { Printer } from 'lucide-react'

export default function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
    >
      <Printer size={14} /> Print Receipt
    </button>
  )
}