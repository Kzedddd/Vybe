import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase Auth callback handler.
 * Called after:
 *   - OAuth (Google) redirect
 *   - Magic link click
 *   - Email confirmation
 *   - Password reset link
 *
 * Exchanges the `code` param for a session, then redirects appropriately.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type') // 'recovery' for reset-password

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[auth/callback] exchangeCodeForSession error:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
  }

  // Password reset flow → redirect to reset-password page
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  // Check if organizer profile exists — if not, redirect to onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  // New user with organizer intent (stored in user metadata during signup)
  const wantsToOrganize = data.user.user_metadata?.wants_to_organize === true

  if (wantsToOrganize && profile?.role !== 'organizer') {
    // Check if organizer record exists
    const { data: organizer } = await supabase
      .from('organizers')
      .select('id')
      .eq('profile_id', data.user.id)
      .single()

    if (!organizer) {
      return NextResponse.redirect(`${origin}/auth/onboarding`)
    }
  }

  // Forward to `next` param or home
  const redirectTo = next.startsWith('/') ? `${origin}${next}` : origin
  return NextResponse.redirect(redirectTo)
}
