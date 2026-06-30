import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Package, Plus, MapPin, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-500 text-sm mt-1">
            {packages?.length ?? 0} packages
          </p>
        </div>
        <Link
          href="/dashboard/packages/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <Plus size={16} /> Add package
        </Link>
      </div>

      {(!packages || packages.length === 0) && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No packages yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first travel package</p>
          <Link
            href="/dashboard/packages/new"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus size={15} /> Add package
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages?.map(pkg => (
          <Link
            key={pkg.id}
            href={`/dashboard/packages/${pkg.id}`}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-100 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                pkg.is_active
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {pkg.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={13} /> {pkg.destination}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={13} /> {pkg.duration_days} days
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(pkg.base_price, pkg.currency)}
              </span>
              <span className="text-xs text-gray-400 ml-1">per person</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}