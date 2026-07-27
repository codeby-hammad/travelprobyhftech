import { createClient }     from '@/lib/supabase/server'
import { formatDate }       from '@/lib/utils'
import { notFound }         from 'next/navigation'
import Link                 from 'next/link'
import { ArrowLeft }        from 'lucide-react'
import UmrahInquiryActions  from '@/components/umrah-inquiries/UmrahInquiryActions'

export default async function UmrahInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single()

  const { data: inquiry } = await supabase
    .from('umrah_inquiries')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (!inquiry) notFound()

  const { data: pkg } = inquiry.selected_package_id
    ? await supabase.from('packages').select('name, makkah_hotel, madinah_hotel, departure_date, return_date').eq('id', inquiry.selected_package_id).single()
    : { data: null }

  const pilgrimDetails: any[] = inquiry.pilgrim_details ?? []
  const q = inquiry.questionnaire ?? {}

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/umrah-inquiries" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={15} /> Back to Umrah Queries
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{inquiry.primary_contact_name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Submitted {formatDate(inquiry.created_at)} · {pilgrimDetails.length} pilgrim{pilgrimDetails.length !== 1 ? 's' : ''}
          </p>
        </div>
        <UmrahInquiryActions inquiry={inquiry} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Package & Accommodation</h3>
        <p className="text-gray-800 text-sm">{pkg?.name ?? '—'}</p>
        <p className="text-gray-500 text-xs mt-1">
          {pkg?.makkah_hotel && `Makkah: ${pkg.makkah_hotel}`}
          {pkg?.madinah_hotel && `  ·  Madina: ${pkg.madinah_hotel}`}
        </p>
        <p className="text-gray-500 text-xs mt-1 capitalize">
          Room tier: {inquiry.room_tier ?? '—'}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-500">
            {inquiry.pilgrims_adult}A / {inquiry.pilgrims_child}C / {inquiry.pilgrims_infant}I
            {' '}× {inquiry.currency ?? 'PKR'} {Number(inquiry.price_per_pilgrim ?? 0).toLocaleString()}
          </span>
          <span className="font-semibold text-gray-900">
            {inquiry.currency ?? 'PKR'} {Number(inquiry.total_price ?? 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Pilgrims</h3>
        <div className="divide-y divide-gray-50">
          {pilgrimDetails.map((p, i) => (
            <div key={i} className="py-3 grid grid-cols-2 gap-2 text-xs">
              <p className="col-span-2 font-medium text-gray-800 text-sm">
                {p.slotLabel} — {p.title} {p.firstName} {p.familyName}
              </p>
              <p className="text-gray-500">Nationality: {p.nationality || '—'}</p>
              <p className="text-gray-500">DOB: {p.dateOfBirth || '—'}</p>
              <p className="text-gray-500">Passport: {p.passportNumber || '—'} ({p.passportType || '—'})</p>
              <p className="text-gray-500">Passport expiry: {p.passportExpiryDate || '—'}</p>
              <p className="text-gray-500">Email: {p.email || '—'}</p>
              <p className="text-gray-500">Phone: {p.phone || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Questionnaire</h3>
        <div className="text-xs text-gray-600 space-y-1.5">
          <p>Emergency contact: {q.emergencyContactName} ({q.emergencyContactPhone})</p>
          <p>Medical condition: {q.hasMedicalCondition ? `Yes — ${q.medicalConditionDetails || 'no details given'}` : 'No'}</p>
          <p>Mobility assistance: {q.needsMobilityAssistance ? 'Yes' : 'No'}</p>
          <p>Dietary requirements: {q.dietaryRequirements || '—'}</p>
          <p>Prior visa refusal: {q.hasPriorVisaRefusal ? `Yes — ${q.priorVisaRefusalDetails || 'no details given'}` : 'No'}</p>
          <p>Special requests: {q.specialRequests || '—'}</p>
        </div>
      </div>
    </div>
  )
}