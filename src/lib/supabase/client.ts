// This file creates a Supabase connection for use inside the browser
// (React components, pages, forms)

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // createBrowserClient reads your .env.local values automatically
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}