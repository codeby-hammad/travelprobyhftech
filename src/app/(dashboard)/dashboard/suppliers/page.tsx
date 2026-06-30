import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Plus, Phone, Mail, MapPin } from 'lucide-react'

const typeColors: Record<string, string> = {
  hotel:     'bg-blue-50   text-blue-700',
  airline:   'bg-purple-50 text-purple-700',
  transport: 'bg-yellow-50 text-yellow-700',
  visa:      'bg-orange-50 text-orange-700',
  insurance: 'bg-green-50  text-green-700',
  other:     'bg-gray-100  text-gray-600',
}

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 text-sm mt-1">{suppliers?.length ?? 0} suppliers</p>
        </div>
        <Link href="/dashboard/suppliers/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> Add supplier
        </Link>
      </div>

      {(!suppliers || suppliers.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No suppliers yet</p>
          <p className="text-gray-400 text-sm">Add hotels, airlines, and other partners</p>
          <Link href="/dashboard/suppliers/new"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            <Plus size={15} /> Add supplier
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers?.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                {s.contact_name && <p className="text-xs text-gray-400 mt-0.5">{s.contact_name}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${typeColors[s.type]}`}>
                {s.type}
              </span>
            </div>
            <div className="space-y-1">
              {(s.city || s.country) && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={11} /> {[s.city, s.country].filter(Boolean).join(', ')}
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={11} /> {s.phone}
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={11} /> {s.email}
                </div>
              )}
            </div>
            {!s.is_active && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs text-red-400">Inactive</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}