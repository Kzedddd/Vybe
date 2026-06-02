import { NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// GET /api/stripe/connect/refresh — Stripe redirige ici si le lien expire
export async function GET() {
  // Re-déclencher l'onboarding depuis les settings
  return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe=refresh`)
}
