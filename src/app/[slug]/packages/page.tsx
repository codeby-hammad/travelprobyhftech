import { createClient }    from '@/lib/supabase/server'
import { notFound }        from 'next/navigation'
import PublicNav           from '@/app/(public)/components/PublicNav'
import FooterSection       from '@/app/(public)/components/FooterSection'
import ChatWidget          from '@/app/(public)/components/ChatWidget'
import PackagesListing     from '@/components/public/PackagesListing'
import { PACKAGE_SELECT_FIELDS } from '@/components/public/packageTypes'

export default async function PackagesListingPage({
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

  // Every active package for this org — no limit, unlike the homepage's
  // featured-4 preview — since this is the full "browse all" listing
  const { data: packages } = await supabase
    .from('packages')
    .select(PACKAGE_SELECT_FIELDS)
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <main className="bg-[#f8f6f0] min-h-screen overflow-x-hidden">
      <PublicNav orgSlug={slug} orgName={org.name} organizationId={org.id} />
      <PackagesListing packages={packages ?? []} orgSlug={slug} />
      <FooterSection />
      <ChatWidget />
    </main>
  )
}