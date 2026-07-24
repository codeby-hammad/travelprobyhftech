import { createClient }  from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import VisaDetailForm    from '@/components/visa/VisaDetailForm'
import DocumentsSection from '@/components/documents/DocumentsSection'


export default async function VisaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: visa } = await supabase
    .from('visa_applications')
    .select('*, client:clients(full_name, passport_number, phone), booking:bookings(booking_ref)')
    .eq('id', id)
    .single()

  if (!visa) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <VisaDetailForm visa={visa} />


      <DocumentsSection
  entityType="visa_application"
  entityId={visa.id}
  organizationId={visa.organization_id}
  documentTypes={['visa_copy', 'application_form', 'sponsor_letter', 'other']}
/>
    </div>
  )
}