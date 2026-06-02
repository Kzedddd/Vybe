'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

/**
 * Supabase client for Client Components (browser).
 * Singleton pattern — one instance per page lifecycle.
 *
 * Usage:
 *   const supabase = createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
