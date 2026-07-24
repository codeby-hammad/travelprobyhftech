'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Check, X } from 'lucide-react'

export default function PassengerFlightCell({
  passengerId,
  seatNo,
  pnr,
}: {
  passengerId: string
  seatNo: string | null
  pnr: string | null
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(false)
  const [seat, setSeat] = useState(seatNo ?? '')
  const [pnrVal, setPnrVal] = useState(pnr ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('group_passengers')
      .update({ seat_no: seat || null, pnr: pnrVal || null })
      .eq('id', passengerId)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          value={seat}
          onChange={e => setSeat(e.target.value)}
          placeholder="Seat"
          className="w-14 border border-gray-300 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          value={pnrVal}
          onChange={e => setPnrVal(e.target.value)}
          placeholder="PNR (optional override)"
          className="w-24 border border-gray-300 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button onClick={handleSave} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-50">
          <Check size={13} />
        </button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 group"
    >
      {seatNo
        ? <span className="font-mono font-medium">{seatNo}</span>
        : <span className="text-amber-600">not set</span>}
      <Pencil size={10} className="opacity-0 group-hover:opacity-100" />
    </button>
  )
}