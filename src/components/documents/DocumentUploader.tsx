'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, X, Loader2 } from 'lucide-react'

type Props = {
  entityType: 'client' | 'booking' | 'visa_application'
  entityId: string
  organizationId: string
  documentTypes?: string[]   // e.g. ['passport', 'cnic', 'photo']
}

export default function DocumentUploader({
  entityType,
  entityId,
  organizationId,
  documentTypes = ['passport', 'cnic', 'photo', 'other'],
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState(documentTypes[0])
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFile(file: File) {
    setError(null)

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Only images (JPG, PNG) and PDF files allowed.')
      return
    }

    setUploading(true)

    try {
      // Build path: orgId/entityType/entityId/timestamp_filename
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const filePath = `${organizationId}/${entityType}/${entityId}/${timestamp}_${safeFileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Save record in documents table
      const { error: dbError } = await supabase.from('documents').insert({
        organization_id: organizationId,
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        document_type: selectedType,
        uploaded_by: user?.id,
      })

      if (dbError) throw dbError

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600">Document type:</label>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {documentTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-blue-600">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Upload size={24} />
            <p className="text-sm text-gray-500">
              Drag & drop or <span className="text-blue-600 font-medium">click to browse</span>
            </p>
            <p className="text-xs text-gray-400">Images or PDF, max 10MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}