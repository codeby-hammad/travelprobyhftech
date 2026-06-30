'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Send, Mail, MessageCircle, ExternalLink } from 'lucide-react'
import { templates, type TemplateData } from '@/lib/notificationTemplates'
import { formatCurrency, formatDate } from '@/lib/utils'

type Props = {
  booking: any
  client:  any
  onClose: () => void
}

export default function SendNotificationModal({ booking, client, onClose }: Props) {
  const supabase = createClient()

  const [channel,      setChannel]      = useState<'email' | 'whatsapp'>('email')
  const [type,         setType]         = useState('booking_confirmation')
  const [subject,      setSubject]      = useState('')
  const [body,         setBody]         = useState('')
  const [loading,      setLoading]      = useState(false)
  const [sent,         setSent]         = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [whatsappUrl,  setWhatsappUrl]  = useState<string | null>(null)

  // Build template data from booking
  function getTemplateData(): TemplateData {
    return {
      clientName:   client?.full_name    ?? 'Valued Client',
      bookingRef:   booking?.booking_ref ?? '',
      destination:  booking?.package?.destination ?? '',
      travelDate:   booking?.travel_date  ? formatDate(booking.travel_date)  : '',
      returnDate:   booking?.return_date  ? formatDate(booking.return_date)  : '',
      totalAmount:  formatCurrency(booking?.total_amount ?? 0, booking?.currency ?? 'PKR'),
      paidAmount:   formatCurrency(booking?.paid_amount  ?? 0, booking?.currency ?? 'PKR'),
      balance:      formatCurrency(
        (booking?.total_amount ?? 0) - (booking?.paid_amount ?? 0),
        booking?.currency ?? 'PKR'
      ),
    }
  }

  // Load template on mount and when type changes
  useEffect(() => {
    applyTemplate(type)
  }, [type])

  function applyTemplate(templateType: string) {
    if (templateType === 'custom') {
      setSubject('')
      setBody('')
      return
    }
    const fn = templates[templateType as keyof typeof templates]
    if (fn) {
      const result = fn(getTemplateData())
      setSubject(result.subject ?? '')
      setBody(result.body ?? '')
    }
  }

  // Switch channel — auto-switch to whatsapp if no email
  useEffect(() => {
    if (!client?.email && channel === 'email') {
      setChannel('whatsapp')
    }
  }, [client])

  async function handleSend() {
    if (!body.trim()) { setError('Message body cannot be empty'); return }

    if (channel === 'email' && !client?.email) {
      setError('This client has no email address. Add one in their profile first.')
      return
    }
    if (channel === 'whatsapp' && !client?.phone) {
      setError('This client has no phone number. Add one in their profile first.')
      return
    }

    setLoading(true)
    setError(null)
    setWhatsappUrl(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user!.id)
      .single()

    const res = await fetch('/api/notifications/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        organizationId: profile!.organization_id,
        bookingId:      booking?.id,
        clientId:       client?.id,
        type,
        channel,
        recipientEmail: client?.email ?? null,
        recipientPhone: client?.phone ?? null,
        subject,
        body,
        createdBy:      user!.id,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    // WhatsApp returns a URL to open
    if (channel === 'whatsapp' && data.whatsappUrl) {
      setWhatsappUrl(data.whatsappUrl)
      setSent(true)
      setLoading(false)
      return
    }

    // Email sent
    setSent(true)
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
              <Send size={16} className="text-blue-600" />
              Notify client
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* Success state */}
            {sent && channel === 'email' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold text-sm">✅ Email sent successfully!</p>
                <p className="text-green-600 text-xs mt-1">Sent to {client?.email}</p>
                <button onClick={onClose}
                  className="mt-3 text-sm text-green-700 underline hover:no-underline">
                  Close
                </button>
              </div>
            )}

            {/* WhatsApp success — show open button */}
            {sent && channel === 'whatsapp' && whatsappUrl && (
              <div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold text-sm">✅ Message ready!</p>
                <p className="text-green-600 text-xs mt-1 mb-3">
                  Click below to open WhatsApp with the message pre-filled
                </p>
                
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                
                  <MessageCircle size={16} />
                  Open WhatsApp
                  <ExternalLink size={13} />
                </div>
              
                <button onClick={onClose}
                  className="block mx-auto mt-3 text-sm text-gray-400 hover:text-gray-600">
                  Close
                </button>
              </div>
          )}

            {!sent && (
              <>
                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Recipient info */}
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm">{client?.full_name}</p>
                  <div className="flex gap-4 mt-1">
                    {client?.email ? (
                      <p className="text-xs text-gray-500">✉️ {client.email}</p>
                    ) : (
                      <p className="text-xs text-red-400">✉️ No email saved</p>
                    )}
                    {client?.phone ? (
                      <p className="text-xs text-gray-500">📱 {client.phone}</p>
                    ) : (
                      <p className="text-xs text-red-400">📱 No phone saved</p>
                    )}
                  </div>
                </div>

                {/* Channel selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send via
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!client?.email}
                      onClick={() => setChannel('email')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition flex-1 justify-center ${
                        channel === 'email'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : !client?.email
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <Mail size={16} />
                      Email
                      {!client?.email && (
                        <span className="text-xs opacity-70">(no email)</span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={!client?.phone}
                      onClick={() => setChannel('whatsapp')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition flex-1 justify-center ${
                        channel === 'whatsapp'
                          ? 'bg-green-600 text-white border-green-600'
                          : !client?.phone
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'border-gray-300 text-gray-600 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                      {!client?.phone && (
                        <span className="text-xs opacity-70">(no phone)</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Template selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message template
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'booking_confirmation', label: '✅ Booking confirmation' },
                      { value: 'payment_receipt',      label: '💳 Payment receipt'      },
                      { value: 'travel_reminder',      label: '✈️ Travel reminder'      },
                      { value: 'custom',               label: '✏️ Custom message'        },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition ${
                          type === t.value
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject — email only */}
                {channel === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Message body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <span className="text-xs text-gray-400">{body.length} chars</span>
                  </div>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={9}
                    placeholder="Type your message here..."
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs leading-relaxed"
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={loading || !body.trim()}
                  className={`w-full py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm ${
                    channel === 'whatsapp'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {channel === 'whatsapp' ? <MessageCircle size={16} /> : <Send size={16} />}
                  {loading
                    ? 'Sending...'
                    : channel === 'whatsapp'
                      ? 'Open WhatsApp with message'
                      : `Send email to ${client?.email ?? 'client'}`}
                </button>

                {channel === 'whatsapp' && (
                  <p className="text-xs text-gray-400 text-center -mt-2">
                    WhatsApp will open with the message pre-filled. Just press send.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}