import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BuyTicketButton from './BuyTicketButton'

export default async function EventPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select(`
      id, title, slug, description, starts_at, ends_at, doors_open_at,
      location_name, location_address, cover_url, status,
      total_capacity, tickets_sold,
      organizer:organizers (
        id, name, slug, stripe_onboarded
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('id, name, type, price, is_free, quantity_total, quantity_sold, sale_starts_at, sale_ends_at')
    .eq('event_id', event.id)
    .order('price', { ascending: true })

  const organizer = event.organizer as any
  const now = new Date()

  const startsAt = new Date(event.starts_at)
  const doorsAt = event.doors_open_at ? new Date(event.doors_open_at) : null
  const endsAt = event.ends_at ? new Date(event.ends_at) : null

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const remaining = (event.total_capacity ?? 0) - (event.tickets_sold ?? 0)
  const fillRate = event.total_capacity
    ? Math.round(((event.tickets_sold ?? 0) / event.total_capacity) * 100)
    : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Cover */}
      <div style={{ position: 'relative', width: '100%', height: '420px', overflow: 'hidden' }}>
        {event.cover_url ? (
          <img
            src={event.cover_url}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)' }} />
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, var(--bg-primary) 100%)',
        }} />
        {/* Breadcrumb */}
        <div style={{ position: 'absolute', top: '24px', left: '32px' }}>
          <Link href="/" style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)' }}>
            VYBE
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 8px' }}>/</span>
          <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)' }}>
            {organizer?.name ?? 'ÉVÉNEMENT'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '0 32px 80px', marginTop: '-80px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px', alignItems: 'start' }}>

          {/* Left — Infos */}
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--violet)', marginBottom: '12px' }}>
              {fmtDate(startsAt).toUpperCase()}
            </p>
            <h1 style={{ fontSize: '32px', fontWeight: 400, letterSpacing: '0.04em', marginBottom: '8px', lineHeight: 1.2 }}>
              {event.title}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px', letterSpacing: '0.05em' }}>
              par {organizer?.name}
            </p>

            {/* Infos pratiques */}
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-default)' }}>
                INFOS PRATIQUES
              </p>
              <InfoRow label="DATE" value={fmtDate(startsAt)} />
              {doorsAt && <InfoRow label="OUVERTURE DES PORTES" value={fmtTime(doorsAt)} />}
              <InfoRow label="DÉBUT" value={fmtTime(startsAt)} />
              {endsAt && <InfoRow label="FIN" value={fmtTime(endsAt)} />}
              <InfoRow label="LIEU" value={event.location_name ?? '—'} />
              {event.location_address && (
                <InfoRow label="ADRESSE" value={event.location_address} />
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-default)' }}>
                  À PROPOS
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {event.description}
                </p>
              </div>
            )}

            {/* Complet uniquement si plus de places */}
            {remaining <= 0 && (
              <div>
                <p style={{ fontSize: '11px', color: 'var(--danger)', letterSpacing: '0.1em' }}>ÉVÉNEMENT COMPLET</p>
              </div>
            )}
          </div>

          {/* Right — Billetterie */}
          <div style={{ position: 'sticky', top: '32px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '24px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '20px' }}>
                BILLETTERIE
              </p>

              {!organizer?.stripe_onboarded ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Paiement en ligne non disponible pour cet événement.
                </p>
              ) : remaining <= 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--danger)', letterSpacing: '0.1em' }}>
                  ÉVÉNEMENT COMPLET
                </p>
              ) : !ticketTypes || ticketTypes.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Aucun billet disponible.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ticketTypes.map((tt) => {
                    const ttRemaining = tt.quantity_total - (tt.quantity_sold ?? 0)
                    const saleStarted = !tt.sale_starts_at || new Date(tt.sale_starts_at) <= now
                    const saleEnded = tt.sale_ends_at && new Date(tt.sale_ends_at) < now
                    const available = ttRemaining > 0 && saleStarted && !saleEnded

                    return (
                      <div key={tt.id} style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>{tt.name}</p>
                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                              {tt.is_free || tt.price === 0
                                ? 'GRATUIT'
                                : `${(tt.price / 100).toFixed(2)} €`}
                            </p>
                          </div>
                          {!available && (
                            <span style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                              {ttRemaining <= 0 ? 'ÉPUISÉ' : saleEnded ? 'VENTE TERMINÉE' : 'BIENTÔT'}
                            </span>
                          )}
                        </div>
                        {available && (
                          <BuyTicketButton
                            ticketTypeId={tt.id}
                            isFree={tt.is_free || tt.price === 0}
                            eventSlug={event.slug}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border-default)', gap: '16px' }}>
      <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-primary)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
