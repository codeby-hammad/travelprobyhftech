import { createClient } from '@/lib/supabase/server'
import DocumentUploader from './DocumentUploader'
import DocumentList from './DocumentList'

type Props = {
  entityType: 'client' | 'booking' | 'visa_application'
  entityId: string
  organizationId: string
  documentTypes?: string[]
}

export default async function DocumentsSection({
  entityType,
  entityId,
  organizationId,
  documentTypes,
}: Props) {
const supabase = await createClient()
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Documents</h3>

      <DocumentUploader
        entityType={entityType}
        entityId={entityId}
        organizationId={organizationId}
        documentTypes={documentTypes}
      />

      <DocumentList documents={documents ?? []} />
    </div>
  )
}