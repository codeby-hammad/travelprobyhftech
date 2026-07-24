'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react'

type Hotel = {
  id: string
  name: string
  city: 'makkah' | 'madinah'
  distance: string | null
  is_active: boolean
}

function HotelList({
  title,
  city,
  hotels,
  onChanged,
}: {
  title: string
  city: 'makkah' | 'madinah'
  hotels: Hotel[]
  onChanged: () => void
}) {
  const supabase = createClient()
  const router = useRouter()

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDistance, setNewDistance] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDistance, setEditDistance] = useState('')

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) { setError('Could not determine your organization'); setSaving(false); return }

    const { error: insertError } = await supabase.from('hotels').insert({
      organization_id: profile.organization_id,
      name: newName.trim(),
      city,
      distance: newDistance.trim() || null,
    })

    setSaving(false)
    if (insertError) { setError(insertError.message); return }

    setNewName('')
    setNewDistance('')
    setAdding(false)
    onChanged()
    router.refresh()
  }

  function startEdit(hotel: Hotel) {
    setEditingId(hotel.id)
    setEditName(hotel.name)
    setEditDistance(hotel.distance ?? '')
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    const { error: updateError } = await supabase
      .from('hotels')
      .update({ name: editName.trim(), distance: editDistance.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    setSaving(false)
    if (updateError) { setError(updateError.message); return }
    setEditingId(null)
    onChanged()
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this hotel? Packages already using it keep their saved name — this only removes it from the dropdown.')) return
    const { error: deleteError } = await supabase.from('hotels').delete().eq('id', id)
    if (deleteError) { alert(deleteError.message); return }
    onChanged()
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
        <span className="text-[12px] text-slate-400">{hotels.length} hotels</span>
      </div>

      {hotels.length === 0 && !adding && (
        <p className="text-[13px] text-slate-400 text-center py-8">No {title.toLowerCase()} yet</p>
      )}

      <div className="divide-y divide-slate-50">
        {hotels.map(hotel => (
          <div key={hotel.id} className="px-5 py-3 flex items-center justify-between gap-3">
            {editingId === hotel.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hotel name"
                />
                <input
                  value={editDistance}
                  onChange={e => setEditDistance(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Distance, e.g. 450M Haram facing"
                />
                <button onClick={() => saveEdit(hotel.id)} disabled={saving} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-lg">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{hotel.name}</p>
                  {hotel.distance && <p className="text-[12px] text-slate-400 truncate">{hotel.distance}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(hotel)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(hotel.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Hotel name"
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <input
            value={newDistance}
            onChange={e => setNewDistance(e.target.value)}
            placeholder="Distance description, e.g. 450M Haram facing front row"
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(''); setNewDistance(''); setError(null) }}
              className="text-[12px] text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full px-5 py-3 border-t border-slate-100 flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Plus size={13} /> Add {title.slice(0, -1)}
        </button>
      )}
    </div>
  )
}

export default function HotelsManager({
  initialMakkah,
  initialMadinah,
}: {
  initialMakkah: Hotel[]
  initialMadinah: Hotel[]
}) {
  // onChanged just triggers router.refresh() inside each list, which
  // re-fetches server-side — no need to duplicate state up here.
  const noop = () => {}

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <HotelList title="Makkah Hotels" city="makkah" hotels={initialMakkah} onChanged={noop} />
      <HotelList title="Madinah Hotels" city="madinah" hotels={initialMadinah} onChanged={noop} />
    </div>
  )
}