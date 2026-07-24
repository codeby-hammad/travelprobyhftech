import { createClient } from '@/lib/supabase/server'
import { Building2 } from 'lucide-react'
import HotelsManager from '@/components/hotels/HotelsManager'

export default async function HotelsPage() {
  const supabase = await createClient()

  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .order('city')
    .order('name')

  const makkahHotels  = hotels?.filter(h => h.city === 'makkah')  ?? []
  const madinahHotels = hotels?.filter(h => h.city === 'madinah') ?? []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
          <Building2 size={18} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hotels</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Manage your Makkah & Madinah hotel list — reused across all packages
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3">
          <span className="text-xl">🕋</span>
          <div>
            <p className="text-sm font-bold text-gray-900">Makkah</p>
            <p className="text-xs text-gray-400">{makkahHotels.length} hotel{makkahHotels.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3">
          <span className="text-xl">🕌</span>
          <div>
            <p className="text-sm font-bold text-gray-900">Madinah</p>
            <p className="text-xs text-gray-400">{madinahHotels.length} hotel{madinahHotels.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <HotelsManager initialMakkah={makkahHotels} initialMadinah={madinahHotels} />
    </div>
  )
}