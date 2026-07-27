import { createClient } from '@/lib/supabase/client'

export type CustomerProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

// Shared by CustomerAuthModal, BookingLauncher, and PublicNav so there's one
// place that turns a bare Supabase Auth user into "a customer of this org."
export async function ensureCustomerRow(
  supabase: ReturnType<typeof createClient>,
  authUserId: string,
  organizationId: string,
  fallback: { fullName?: string | null; email?: string | null } = {}
): Promise<CustomerProfile> {
  const { data: existing } = await supabase
    .from('customers')
    .select('id, full_name, email, phone')
    .eq('auth_user_id', authUserId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from('customers')
    .insert({
      auth_user_id:    authUserId,
      organization_id: organizationId,
      full_name:       fallback.fullName ?? null,
      email:           fallback.email ?? null,
    })
    .select('id, full_name, email, phone')
    .single()

  if (error) throw error
  return created
}

// Single letter shown on the navbar avatar — prefers the customer's name,
// falls back to their email, falls back to "?" if somehow neither exists
export function customerInitial(customer: Pick<CustomerProfile, 'full_name' | 'email'> | null): string {
  const source = customer?.full_name?.trim() || customer?.email?.trim()
  return source ? source[0].toUpperCase() : '?'
}