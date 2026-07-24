import { createClient }    from '@/lib/supabase/server'
import { notFound }        from 'next/navigation'
import PublicNav           from '@/app/(public)/components/PublicNav'
import HeroSection         from '@/app/(public)/components/HeroSection'
import ServicesSection     from '@/app/(public)/components/ServicesSection'
import PackagesSection     from '@/app/(public)/components/PackagesSection'
import WhyUsSection        from '@/app/(public)/components/WhyUsSection'
import TestimonialsSection from '@/app/(public)/components/TestimonialsSection'
import BookingForm         from '@/app/(public)/components/BookingForm'
import FooterSection       from '@/app/(public)/components/FooterSection'
import ChatWidget          from '@/app/(public)/components/ChatWidget'

export default async function AgencyPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Find org by slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!org) notFound()

  // Fetch this org's packages
  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, destination, price, description, duration_days')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <main className="bg-[#f8f6f0] overflow-x-hidden">
      <PublicNav />
      <HeroSection />
      <ServicesSection />
      <PackagesSection packages={packages ?? []} />
      <WhyUsSection />
      <TestimonialsSection />
      <BookingForm orgId={org.id} orgName={org.name} />
      <FooterSection />
      <ChatWidget />
    </main>
  )
}