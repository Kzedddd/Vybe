import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/database.types'

// ── Route permission matrix ──────────────────────────────────────────────────

/** Routes that require authentication (any role) */
const AUTH_REQUIRED = ['/my']

/** Routes that require role === 'organizer' (or admin) */
const ORGANIZER_REQUIRED = ['/dashboard']

/** Routes that require team role >= billetterie (checked via DB) */
const SCANNER_REQUIRED = ['/scanner']

/** Routes that require role === 'admin' */
const ADMIN_REQUIRED = ['/admin']

/** Auth pages — redirect to / if already logged in */
const AUTH_PAGES = ['/auth/login', '/auth/register', '/auth/forgot-password']

// ── Helper ───────────────────────────────────────────────────────────────────

function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

// ── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚠️  IMPORTANT: Do NOT call supabase.auth.getSession() here.
  //     Always use getUser() to validate the JWT on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── 1. Auth pages — redirect connected users away ────────────────────────
  if (matchesAny(pathname, AUTH_PAGES) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── 2. Protected routes — require authentication ─────────────────────────
  if (
    matchesAny(pathname, [
      ...AUTH_REQUIRED,
      ...ORGANIZER_REQUIRED,
      ...SCANNER_REQUIRED,
      ...ADMIN_REQUIRED,
    ]) &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // ── 3. Role-based access (user is authenticated at this point) ───────────
  if (user) {
    // Fetch role from profiles table (cached in JWT custom claims ideally)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role: UserRole | null = (profile?.role as UserRole) ?? null

    // /admin/* — admin only
    if (matchesAny(pathname, ADMIN_REQUIRED) && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // /dashboard/* — organizer or admin
    if (
      matchesAny(pathname, ORGANIZER_REQUIRED) &&
      role !== 'organizer' &&
      role !== 'admin'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('error', 'organizer_required')
      return NextResponse.redirect(url)
    }

    // /scanner/* — organizer or admin
    // Note: granular team role check (billetterie+) is done in the page itself
    // to avoid extra DB calls on every request
    if (
      matchesAny(pathname, SCANNER_REQUIRED) &&
      role !== 'organizer' &&
      role !== 'admin'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

// ── Matcher ───────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder (images, fonts, etc.)
     * - API routes (webhooks handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
