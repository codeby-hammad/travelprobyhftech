import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, Phone, Mail } from 'lucide-react'
import ClientSearch from '@/components/clients/ClientSearch'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q }    = await searchParams
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('full_name')

  const filtered = clients?.filter(c => {
    if (!q) return true
    const s = q.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s)     ||
      c.phone?.includes(s)                   ||
      c.passport_number?.toLowerCase().includes(s) ||
      c.nationality?.toLowerCase().includes(s)
    )
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered?.length ?? 0} clients
            {q && ` matching "${q}"`}
          </p>
        </div>
        <Link href="/dashboard/clients/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> Add client
        </Link>
      </div>

      <ClientSearch currentQ={q} />

      {(!filtered || filtered.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 mt-4">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {q ? 'No clients match your search' : 'No clients yet'}
          </p>
          {!q && (
            <Link href="/dashboard/clients/new"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
              <Plus size={15} /> Add client
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filtered?.map(client => (
          <Link key={client.id} href={`/dashboard/clients/${client.id}`}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-100 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {client.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{client.full_name}</p>
                {client.nationality && (
                  <p className="text-xs text-gray-400">{client.nationality}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {client.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={12} /> {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={12} /> {client.phone}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}