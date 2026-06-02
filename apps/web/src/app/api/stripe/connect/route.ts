import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// POST /api/stripe/connect — crée ou reprend l'onboarding Stripe Connect Express
export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, stripe_account_id, stripe_onboarded, name, plan')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 404 })

  try {
    // Si déjà onboardé, retourner le dashboard Stripe
    if (organizer.stripe_onboarded && organizer.stripe_account_id) {
      const loginLink = await stripe.accounts.createLoginLink(organizer.stripe_account_id)
      return NextResponse.json({ url: loginLink.url })
    }

    // Créer un compte Express si pas encore fait
    let accountId = organizer.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      accountId = account.id

      // Sauvegarder l'account ID
      await supabase
        .from('organizers')
        .update({ stripe_account_id: accountId })
        .eq('id', organizer.id)
    }

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/stripe/connect/refresh`,
      return_url: `${APP_URL}/dashboard/settings?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: any) {
    console.error('[stripe/connect] Erreur:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
