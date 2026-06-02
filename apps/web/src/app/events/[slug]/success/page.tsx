import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function EventSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string; free?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, title, slug, starts_at, location_name, cover_url, organizer:organizers(name)')
    .eq('slug', slug)
    .single()

  if (!event) notFound()

  const organizer = event.organizer as any

  // Récupérer les infos de la session Stripe si présente
  let buyerEmail = ''
  let ticketCount = 1
  let isFree = sp.free === 'true'

  if (sp.session_id && !isFree) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sp.session_id)
      buyerEmail = session.customer_details?.email ?? ''
      ticketCount = parseInt(session.metadata?.quantity ?? '1')
    } catch {
      // Session introuvable — on affiche quand même la page de succès
    }
  }

  const startsAt = new Date(event.starts_at)
  const fmtDate = startsAt.toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
    }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {/* Icône succès */}
        <div style={{
          width: '64px', height: '64px',
          border: '1px solid var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
          fontSize: '24px',
        }}>
          ✓
        </div>

        <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: 'var(--success)', marginBottom: '16px' }}>
          COMMANDE CONFIRMÉE
        </p>

        <h1 style={{ fontSize: '24px', fontWeight: 400, letterSpacing: '0.04em', marginBottom: '8px' }}>
          {event.title}
        </h1>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '40px' }}>
          {fmtDate} · {event.location_name}
        </p>

        {/* Détails commande */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          padding: '24px',
          marginBottom: '32px',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
            <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>BILLET(S)</span>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{ticketCount}</span>
          </div>
          {buyerEmail && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>EMAIL</span>
              <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{buyerEmail}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>ORGANISATEUR</span>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{organizer?.name}</span>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.7 }}>
          {buyerEmail
            ? `Tes billets ont été envoyés à ${buyerEmail}. Présente le QR code à l'entrée.`
            : 'Tes billets sont confirmés. Présente le QR code à l\'entrée.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href={`/events/${slug}/review`} className="btn btn-primary btn-sm">
            LAISSER UNE REVIEW →
          </Link>
          <Link href={`/events/${slug}`} className="btn btn-ghost btn-sm">
            ← RETOUR À L'ÉVÉNEMENT
          </Link>
        </div>
      </div>
    </div>
  )
}
