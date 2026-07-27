import { createClient }    from '@/lib/supabase/server'
import { notFound }        from 'next/navigation'
import Link                from 'next/link'
import PublicNav           from '@/app/(public)/components/PublicNav'
import FooterSection       from '@/app/(public)/components/FooterSection'
import SignOutButton       from '@/components/public/SignOutButton'
import { Inbox } from 'lucide-react'

export default async function CustomerAccountPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!org) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — send them to the homepage where they can log in via
  // the "Book Now" flow (there's no standalone login page for customers,
  // login happens naturally the first time they try to book)
  if (!user) {
    return (
      <main className="bg-[#f8f6f0] min-h-screen">
        <PublicNav orgSlug={slug} orgName={org.name} organizationId={org.id} />
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <h1 className="font-playfair text-2xl font-bold text-[#1a2744] mb-3">
            You're not logged in
          </h1>
          <p className="text-[#6b7a99] text-sm mb-6">
            Log in from the homepage by clicking "Book Now" on any package, or start a new booking to create an account.
          </p>
          <Link
            href={`/${slug}`}
            className="inline-block bg-[#0a1628] hover:bg-[#162a50] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </main>
    )
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, email, phone')
    .eq('auth_user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle()

  const { data: inquiries } = customer
    ? await supabase
        .from('umrah_inquiries')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const packageIds = Array.from(new Set((inquiries ?? []).map(i => i.selected_package_id).filter(Boolean)))
  const { data: packagesData } = packageIds.length
    ? await supabase.from('packages').select('id, name').in('id', packageIds)
    : { data: [] as any[] }
  const packageNameById = new Map((packagesData ?? []).map(p => [p.id, p.name]))

  const statusColors: Record<string, string> = {
    new:       'bg-blue-50   text-blue-700',
    contacted: 'bg-yellow-50 text-yellow-700',
    converted: 'bg-green-50  text-green-700',
    closed:    'bg-gray-100  text-gray-500',
  }

  return (
    <main className="bg-[#f8f6f0] min-h-screen">
      <PublicNav orgSlug={slug} orgName={org.name} organizationId={org.id} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-[#1a2744]">
              My Bookings
            </h1>
            <p className="text-[#6b7a99] text-sm mt-1">
              {customer?.full_name || customer?.email || user.email}
            </p>
          </div>
          <SignOutButton orgSlug={slug} />
        </div>

        {(!inquiries || inquiries.length === 0) ? (
          <div className="bg-white rounded-2xl border border-black/06 p-12 text-center">
            <Inbox className="mx-auto mb-3 text-[#6b7a99]/40" size={32} />
            <p className="text-[#1a2744] font-medium mb-1">No bookings yet</p>
            <p className="text-[#6b7a99] text-sm mb-5">
              Your Umrah queries will show up here once you submit one.
            </p>
            <Link
              href={`/${slug}/packages`}
              className="inline-block bg-[#0a1628] hover:bg-[#162a50] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse Packages
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq: any) => {
              const totalPilgrims = (inq.pilgrims_adult ?? 0) + (inq.pilgrims_child ?? 0) + (inq.pilgrims_infant ?? 0)
              return (
                <div key={inq.id} className="bg-white rounded-xl border border-black/06 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <p className="font-semibold text-[#1a2744]">
                        {packageNameById.get(inq.selected_package_id) ?? 'Umrah Package'}
                      </p>
                      <p className="text-[#6b7a99] text-xs mt-0.5 capitalize">
                        {inq.room_tier ?? '—'} room · {totalPilgrims} pilgrim{totalPilgrims !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0 ${
                      statusColors[inq.status] ?? 'bg-gray-100 text-gray-500'
                    }`}>
                      {inq.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-black/06">
                    <span className="text-[#6b7a99]">
                      Submitted {new Date(inq.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-semibold text-[#1a2744]">
                      {inq.currency ?? 'PKR'} {Number(inq.total_price ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <FooterSection />
    </main>
  )
}