import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ⚠️ Utiliser le client admin (service_role) pour bypasser RLS dans le webhook
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getAdminClient()

  // ── Checkout Session completed ────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    const metadata = session.metadata ?? {}
    const eventId = metadata.event_id
    const organizerId = metadata.organizer_id
    const ticketTypeId = metadata.ticket_type_id
    const quantity = parseInt(metadata.quantity ?? '1')
    const buyerEmail = session.customer_details?.email ?? metadata.buyer_email ?? ''
    const buyerName = session.customer_details?.name ?? null

    if (!eventId || !organizerId || !ticketTypeId) {
      console.error('[webhook] Metadata manquante', metadata)
      return NextResponse.json({ error: 'Metadata manquante' }, { status: 400 })
    }

    const totalAmount = session.amount_total ?? 0
    const commissionAmount = Math.round(totalAmount * (parseFloat(metadata.commission_rate ?? '0.05')))
    const subtotalAmount = totalAmount - commissionAmount

    // Créer l'order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        event_id: eventId,
        organizer_id: organizerId,
        buyer_id: metadata.buyer_id ?? null,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        is_guest: !metadata.buyer_id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string ?? null,
        subtotal_amount: subtotalAmount,
        commission_amount: commissionAmount,
        total_amount: totalAmount,
        status: 'confirmed',
        refund_amount: 0,
        confirmed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('[webhook] Erreur création order:', orderError)
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }

    // Créer les ticket_instances
    const ticketInstances = Array.from({ length: quantity }, () => {
      const qrHash = crypto
        .createHmac('sha256', process.env.SCANNER_HMAC_SECRET ?? 'fallback')
        .update(`${order.id}-${ticketTypeId}-${Date.now()}-${Math.random()}`)
        .digest('hex')

      return {
        order_id: order.id,
        ticket_type_id: ticketTypeId,
        event_id: eventId,
        organizer_id: organizerId,
        holder_id: metadata.buyer_id ?? null,
        holder_email: buyerEmail,
        holder_name: buyerName,
        qr_hash: qrHash,
        status: 'valid',
      }
    })

    const { error: ticketError } = await supabase
      .from('ticket_instances')
      .insert(ticketInstances)

    if (ticketError) {
      console.error('[webhook] Erreur création tickets:', ticketError)
    }

    // Incrémenter tickets_sold sur l'event et quantity_sold sur ticket_type
    await supabase.rpc('increment_tickets_sold', {
      p_event_id: eventId,
      p_ticket_type_id: ticketTypeId,
      p_quantity: quantity,
    })

    console.log(`[webhook] ✅ Order ${order.id} créé — ${quantity} billet(s)`)
  }

  // ── Connect Account updated (onboarding complété) ─────────────────────────
  if (event.type === 'account.updated') {
    const account = event.data.object
    const chargesEnabled = account.charges_enabled
    const payoutsEnabled = account.payouts_enabled

    if (chargesEnabled && payoutsEnabled) {
      await supabase
        .from('organizers')
        .update({ stripe_onboarded: true })
        .eq('stripe_account_id', account.id)

      console.log(`[webhook] ✅ Compte Stripe ${account.id} onboardé`)
    }
  }

  return NextResponse.json({ received: true })
}

// Désactiver le body parsing de Next.js — Stripe a besoin du raw body pour vérifier la signature
export const config = {
  api: { bodyParser: false },
}
