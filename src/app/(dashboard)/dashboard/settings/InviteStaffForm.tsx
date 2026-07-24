'use client'

import { useState } from 'react'

export default function InviteStaffForm({ orgId }: { orgId: string }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const generatePassword = () => {
    const pw = 'Travel@' + Math.random().toString(36).slice(-6).toUpperCase()
    setTempPassword(pw)
  }

  const handleInvite = async () => {
    if (!email || !name || !tempPassword) {
      setResult({ success: false, message: 'Fill in all fields and generate a password.' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, tempPassword, orgId }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to create staff account')

      if (data.emailSent) {
        setResult({
          success: true,
          message: `✅ Account created and email sent to ${email}.`,
        })
      } else {
        setResult({
          success: true,
          message: `⚠️ Account created but EMAIL FAILED TO SEND.\n\nShare these credentials manually:\n\nEmail: ${email}\nPassword: ${tempPassword}\n\nReason: ${data.warning || 'Unknown email error'}`,
        })
      }

      setEmail('')
      setName('')
      setTempPassword('')
    } catch (err: any) {
      setResult({ success: false, message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Add Staff Member</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Ahmed Khan"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="staff@email.com"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
          <input
            type="text"
            value={tempPassword}
            onChange={e => setTempPassword(e.target.value)}
            placeholder="Click Generate →"
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={generatePassword}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg border"
        >
          Generate
        </button>
      </div>

      <button
        onClick={handleInvite}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create Staff Account'}
      </button>

      {result && (
        <div className={`rounded-lg p-4 text-sm whitespace-pre-line ${
          result.success
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  )
}