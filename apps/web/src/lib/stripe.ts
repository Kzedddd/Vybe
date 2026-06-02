import Stripe from 'stripe'

const apiKey = process.env.STRIPE_SECRET_KEY

if (!apiKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

export const stripe = new Stripe(apiKey, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

// ── Commission rates ──────────────────────────────────────────────────────────

export const COMMISSION_RATES: Record<string, number> = {
  starter: 0.05,
  pro: 0.04,
  scale: 0.03,
}

export function calcCommission(totalCents: number, plan: string): number {
  const rate = COMMISSION_RATES[plan] ?? 0.05
  return Math.round(totalCents * rate)
}
