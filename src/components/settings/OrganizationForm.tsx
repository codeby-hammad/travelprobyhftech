'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, X } from 'lucide-react'

export default function OrganizationForm({
  organization,
  isAdmin,
}: {
  organization: any
  isAdmin: boolean
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading]   = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [name, setName]         = useState(organization?.name ?? '')

  const [logoUrl, setLogoUrl]   = useState<string | null>(organization?.logo_url ?? null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Logo must be an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be under 2MB.')
      return
    }

    setError(null)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function clearLogoSelection() {
    setLogoFile(null)
    setLogoPreview(null)
  }

  async function uploadLogoIfNeeded(): Promise<string | null> {
    if (!logoFile) return logoUrl

    setUploadingLogo(true)
    try {
      const ext  = logoFile.name.split('.').pop()
      // Cache-bust: without this, browsers/CDNs may keep serving the old
      // cached image at the same URL path even after upsert overwrites it
      const path = `${organization.id}/logo-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, logoFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      return data.publicUrl
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setLoading(true)
    setError(null)

    try {
      const finalLogoUrl = await uploadLogoIfNeeded()

      // .select().maybeSingle() is required here — without it, an RLS
      // policy silently blocking the update returns success with zero
      // rows affected, and you'd never know the save didn't actually happen
      const { data: updated, error: updateError } = await supabase
        .from('organizations')
        .update({ name, logo_url: finalLogoUrl })
        .eq('id', organization.id)
        .select()
        .maybeSingle()

      if (updateError) throw updateError
      if (!updated) {
        throw new Error('Update did not apply — you may not have permission to edit this organization.')
      }

      setLogoUrl(finalLogoUrl)
      setLogoFile(null)
      setLogoPreview(null)
      setSaved(true)

      // Sidebar.tsx is a separate client component that only fetches org
      // info once on mount — router.refresh() re-renders server components
      // but won't make an already-mounted client component re-fetch, so
      // notify it directly via a custom event
      window.dispatchEvent(new CustomEvent('org-updated', {
        detail: { name, logo_url: finalLogoUrl },
      }))

      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const displayedLogo = logoPreview ?? logoUrl

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-1">Agency settings</h2>
      <p className="text-sm text-gray-500 mb-5">
        {isAdmin ? 'Update your agency information' : 'Only agency admins can edit this'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            Agency updated successfully
          </div>
        )}

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Agency logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {displayedLogo ? (
                <img src={displayedLogo} alt="Agency logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-gray-300">No logo</span>
              )}
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 transition">
                  <Upload size={13} />
                  {logoUrl || logoPreview ? 'Change logo' : 'Upload logo'}
                  <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={clearLogoSelection}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <X size={13} /> Cancel
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">PNG or JPG, up to 2MB. Used on invoices and vouchers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              disabled={!isAdmin} required
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${!isAdmin ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <input
              value={organization?.plan ?? 'starter'} disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed capitalize"
            />
          </div>
        </div>

        {isAdmin && (
          <button type="submit" disabled={loading || uploadingLogo}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
            {(loading || uploadingLogo) && <Loader2 size={14} className="animate-spin" />}
            {uploadingLogo ? 'Uploading logo...' : loading ? 'Saving...' : 'Save agency'}
          </button>
        )}
      </form>
    </div>
  )
}