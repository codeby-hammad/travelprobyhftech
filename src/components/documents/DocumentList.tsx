'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Image as ImageIcon, Download, Trash2, Loader2 } from 'lucide-react'


type Document = {
  id: string
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  document_type: string | null
  created_at: string
}

type Props = {
  documents: Document[]
}

export default function DocumentList({ documents }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadThumbnails() {
      const imageDocs = documents.filter(d => d.file_type?.startsWith('image/'))
      if (imageDocs.length === 0) return

      const entries = await Promise.all(
        imageDocs.map(async doc => {
          const { data } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.file_path, 3600)
          return [doc.id, data?.signedUrl ?? ''] as const
        })
      )

      if (!cancelled) {
        setThumbnails(Object.fromEntries(entries))
      }
    }

    loadThumbnails()
    return () => { cancelled = true }
  }, [documents])

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleView(doc: Document) {
    setLoadingId(doc.id)
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 60)

    setLoadingId(null)
    if (error) {
      alert('Could not open file: ' + error.message)
      return
    }

    if (doc.file_type?.startsWith('image/')) {
      setPreviewDoc(doc)
      setPreviewUrl(data.signedUrl)
    } else {
      window.open(data.signedUrl, '_blank')
    }
  }

  async function handleDelete(doc: Document) {
    setLoadingId(doc.id)
    await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setLoadingId(null)
    setConfirming(null)
    router.refresh()
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">No documents uploaded yet.</p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map(doc => {
          const isImage = doc.file_type?.startsWith('image/')
          const thumbUrl = thumbnails[doc.id]

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => handleView(doc)}
                  className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden hover:border-blue-300 transition-colors"
                  title="View"
                >
                  {isImage && thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={doc.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : isImage ? (
                    <ImageIcon size={16} className="text-blue-500" />
                  ) : (
                    <FileText size={16} className="text-red-500" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-400">
                    {doc.document_type?.replace(/_/g, ' ')} · {formatSize(doc.file_size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {confirming === doc.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={loadingId === doc.id}
                      className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      {loadingId === doc.id ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleView(doc)}
                      disabled={loadingId === doc.id}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View / Download"
                    >
                      {loadingId === doc.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Download size={15} />
                      )}
                    </button>
                    <button
                      onClick={() => setConfirming(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {previewDoc && previewUrl && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
          onClick={() => { setPreviewDoc(null); setPreviewUrl(null) }}
        >
          <div
            className="bg-white rounded-xl overflow-hidden max-w-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{previewDoc.file_name}</p>
              <button
                onClick={() => { setPreviewDoc(null); setPreviewUrl(null) }}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Close
              </button>
            </div>
            <div className="overflow-auto p-4 flex items-center justify-center bg-gray-50">
              <img src={previewUrl} alt={previewDoc.file_name} className="max-w-full max-h-[70vh] object-contain rounded" />
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <a href={previewUrl} download={previewDoc.file_name} className="text-xs text-blue-600 hover:underline">Download original</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}