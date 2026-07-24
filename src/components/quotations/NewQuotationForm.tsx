'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2 } from 'lucide-react'

type Client = { id: string; full_name: string; email: string | null; phone: string | null }
type Package = { id: string; name: string; destination: string | null; price: number | null }

type LineItem = {
  item_type: string
  description: string
  quantity: number
  unit_price: number
}

const ITEM_TYPES = ['flight', 'hotel', 'visa', 'transport', 'package', 'other']

export default function NewQuotationForm({
  clients,
  packages,
}: {
  clients: Client[]
  packages: Package[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [recipientType, setRecipientType] = useState<'client' | 'lead'>('client')
  const [clientId, setClientId] = useState('')
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')

  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [packageId, setPackageId] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)

  const [items, setItems] = useState<LineItem[]>([
    { item_type: 'package', description: '', quantity: 1, unit_price: 0 },
  ])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    setItems([...items, { item_type: 'other', description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof LineItem, value: any) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  function applyPackage(pkgId: string) {
    setPackageId(pkgId)
    const pkg = packages.find(p => p.id === pkgId)
    if (pkg) {
      setTitle(pkg.name)
      setDestination(pkg.destination ?? '')
      setItems([
        { item_type: 'package', description: pkg.name, quantity: 1, unit_price: pkg.price ?? 0 },
      ])
    }
  }

  const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)
  const total = subtotal - discount + tax

  async function handleSubmit() {
    setError(null)

    if (recipientType === 'client' && !clientId) {
      setError('Please select a client.')
      return
    }
    if (recipientType === 'lead' && !leadName) {
      setError('Please enter lead name.')
      return
    }
    if (!title) {
      setError('Please enter a quote title.')
      return
    }
    if (items.length === 0 || items.some(i => !i.description)) {
      setError('Every line item needs a description.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single()

      const { data: quote, error: quoteError } = await supabase
        .from('quotations')
        .insert({
          organization_id: profile?.organization_id,
          client_id: recipientType === 'client' ? clientId : null,
          lead_name: recipientType === 'lead' ? leadName : null,
          lead_email: recipientType === 'lead' ? leadEmail : null,
          lead_phone: recipientType === 'lead' ? leadPhone : null,
          package_id: packageId || null,
          title,
          destination,
          travel_date: travelDate || null,
          valid_until: validUntil || null,
          notes,
          discount,
          tax,
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      const itemsToInsert = items.map((item, index) => ({
        quotation_id: quote.id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        sort_order: index,
      }))

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      router.push(`/dashboard/quotations/${quote.id}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Recipient */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quote for</h3>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setRecipientType('client')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              recipientType === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Existing Client
          </button>
          <button
            onClick={() => setRecipientType('lead')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              recipientType === 'lead' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            New Lead
          </button>
        </div>

        {recipientType === 'client' ? (
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="Lead name *"
              value={leadName}
              onChange={e => setLeadName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Email"
              value={leadEmail}
              onChange={e => setLeadEmail(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Phone"
              value={leadPhone}
              onChange={e => setLeadPhone(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Quote details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Quote details</h3>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Base on package (optional)</label>
          <select
            value={packageId}
            onChange={e => applyPackage(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Custom quote (no package)</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.destination ? `— ${p.destination}` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quote title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. 5-Day Umrah Package — Family of 4"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
            <input
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Travel date</label>
            <input
              type="date"
              value={travelDate}
              onChange={e => setTravelDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Valid until</label>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Line items</h3>
          <button
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
          >
            <Plus size={14} /> Add item
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <select
                value={item.item_type}
                onChange={e => updateItem(index, 'item_type', e.target.value)}
                className="col-span-2 border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ITEM_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <input
                placeholder="Description"
                value={item.description}
                onChange={e => updateItem(index, 'description', e.target.value)}
                className="col-span-5 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                className="col-span-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Price"
                value={item.unit_price}
                onChange={e => updateItem(index, 'unit_price', Number(e.target.value))}
                className="col-span-2 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="col-span-1 text-xs text-gray-600 font-medium text-right">
                {(item.quantity * item.unit_price).toLocaleString()}
              </p>
              <button
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="col-span-1 text-gray-300 hover:text-red-500 disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">Rs {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Discount</span>
          <input
            type="number"
            value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
            className="w-28 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Tax</span>
          <input
            type="number"
            value={tax}
            onChange={e => setTax(Number(e.target.value))}
            className="w-28 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between text-base pt-2 border-t border-gray-100">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-blue-600">Rs {total.toLocaleString()}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Terms</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Inclusions, exclusions, payment terms..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="animate-spin" size={16} /> : null}
        {saving ? 'Creating quotation...' : 'Create Quotation'}
      </button>
    </div>
  )
}