import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, calcCommission } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// POST /api/stripe/checkout — crée une Checkout Session pour un billet
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json()
  const { ticket_type_id, quantity = 1 } = body

  if (!ticket_type_id) {
    return NextResponse.json({ error: 'ticket_type_id requis' }, { status: 400 })
  }

  // Récupérer le ticket type avec l'event et l'organisateur
  const { data: ticketType } = await supabase
    .from('ticket_types')
    .select(`
      id, name, price, is_free, quantity_total, quantity_sold, type,
      event:events (
        id, title, slug, starts_at, cover_url, status,
        organizer:organizers (
          id, name, plan, commission_rate,
          stripe_account_id, stripe_onboarded
        )
      )
    `)
    .eq('id', ticket_type_id)
    .single()

  if (!ticketType) {
    return NextResponse.json({ error: 'Billet introuvable' }, { status: 404 })
  }

  const event = ticketType.event as any
  const organizer = event?.organizer as any

  if (!event || event.status !== 'published') {
    return NextResponse.json({ error: 'Événement non disponible' }, { status: 400 })
  }

  if (!organizer?.stripe_onboarded || !organizer?.stripe_account_id) {
    return NextResponse.json({ error: 'Paiement non disponible pour cet événement' }, { status: 400 })
  }

  // Vérifier la disponibilité
  const remaining = ticketType.quantity_total - (ticketType.quantity_sold ?? 0)
  if (remaining < quantity) {
    return NextResponse.json({ error: 'Plus assez de billets disponibles' }, { status: 400 })
  }

  // Billet gratuit → pas de Checkout, créer directement l'order
  if (ticketType.is_free || ticketType.price === 0) {
    return NextResponse.json({ free: true, message: 'Billet gratuit — enregistrement direct' })
  }

  const unitPrice = ticketType.price // en centimes
  const totalAmount = unitPrice * quantity
  const commissionAmount = calcCommission(totalAmount, organizer.plan)
  const transferAmount = totalAmount - commissionAmount

  // Créer la Checkout Session Stripe
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${ticketType.name} — ${event.title}`,
            description: `${new Date(event.starts_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
            images: event.cover_url ? [event.cover_url] : [],
          },
          unit_amount: unitPrice,
        },
        quantity,
      },
    ],
    payment_intent_data: {
      // Transfert vers le compte de l'organisateur moins la commission Vybe
      transfer_data: {
        destination: organizer.stripe_account_id,
        amount: transferAmount,
      },
    },
    success_url: `${APP_URL}/events/${event.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/events/${event.slug}`,
    customer_email: user?.email ?? undefined,
    metadata: {
      event_id: event.id,
      organizer_id: organizer.id,
      ticket_type_id: ticketType.id,
      quantity: String(quantity),
      buyer_id: user?.id ?? '',
      buyer_email: user?.email ?? '',
      commission_rate: String(organizer.commission_rate ?? 0.05),
    },
  })

  return NextResponse.json({ url: session.url })
}
