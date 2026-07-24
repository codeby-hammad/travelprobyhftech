'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function QuotePdfButton({ quote, items }: { quote: any; items: any[] }) {
  const [generating, setGenerating] = useState(false)

  async function handleDownload() {
    setGenerating(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { default: QuotePDF } = await import('./QuotePDF')

      const blob = await pdf(<QuotePDF quote={quote} items={items} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quote.quote_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed', err)
      alert('Could not generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
    >
      {generating ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      {generating ? 'Generating...' : 'Download PDF'}
    </button>
  )
}