'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function SignOutButton({ orgSlug }: { orgSlug: string }) {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push(`/${orgSlug}`)
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1.5 text-sm text-[#6b7a99] hover:text-[#1a2744] transition-colors"
    >
      <LogOut size={15} />
      Sign out
    </button>
  )
}