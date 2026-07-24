import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import Link             from 'next/link'
import { ArrowLeft }    from 'lucide-react'
import PackageEditForm  from '@/components/packages/PackageEditForm'

export default async function PackageEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: pkg } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .single()

  if (!pkg) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/packages" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Package</h1>
          <p className="text-gray-500 text-sm">{pkg.name}</p>
        </div>
      </div>

      <PackageEditForm pkg={pkg} />
    </div>
  )
}