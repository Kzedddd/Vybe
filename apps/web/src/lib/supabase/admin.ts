import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Supabase ADMIN client — uses the service role key.
 * Bypasses ALL Row Level Security policies.
 *
 * ⚠️  CRITICAL: NEVER expose this client to the browser.
 *     Use ONLY in:
 *       - Edge Functions (supabase/functions/)
 *       - Stripe webhook handlers (/api/webhooks/stripe)
 *       - Internal server-side jobs
 *
 * ⚠️  NEVER import this file from a Client Component or pages/ directory.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    '[VYBE] supabase/admin.ts must never be imported in browser context. ' +
    'Use lib/supabase/client.ts instead.'
  )
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('[VYBE] Missing env var: SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
