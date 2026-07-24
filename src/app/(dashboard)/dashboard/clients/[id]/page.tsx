import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import EditClientForm   from '@/components/clients/EditClientForm'
import Link             from 'next/link'
import { ArrowLeft }    from 'lucide-react'
import { formatDate }   from '@/lib/utils'
import DocumentsSection from '@/components/documents/DocumentsSection'


export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const [{ data: client }, { data: bookings }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('bookings')
      .select('*, package:packages(name, destination)')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ])


  
  if (!client) notFound()

  const statusColors: Record<string, string> = {
    inquiry:   'bg-yellow-50 text-yellow-700',
    quoted:    'bg-blue-50   text-blue-700',
    confirmed: 'bg-green-50  text-green-700',
    cancelled: 'bg-red-50    text-red-700',
    completed: 'bg-gray-100  text-gray-600',
  }


  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/clients" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.full_name}</h1>
          <p className="text-gray-500 text-sm">{client.nationality ?? 'Client profile'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Edit form */}
        <div className="lg:col-span-2">
          <EditClientForm client={client} />
        </div>

        {/* Booking history */}
        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Booking history ({bookings?.length ?? 0})
            </h2>
            {(!bookings || bookings.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-4">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b: any) => (
                  <Link key={b.id} href={`/dashboard/bookings/${b.id}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-blue-600 font-medium">
                        {b.booking_ref}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[b.status]}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      {b.package?.name ?? 'Custom booking'}
                    </p>
                    {b.travel_date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(b.travel_date)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="lg:col-span-3">
          <DocumentsSection
            entityType="client"
            entityId={client.id}
            organizationId={client.organization_id}
            documentTypes={['passport', 'cnic', 'photo', 'other']}
          />
        </div>

      </div>
    </div>
  )
}