import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const badgeConfig: Record<string, { label: string; color: string; bg: string }> = {
  vip_gold: { label: '★ VIP GOLD',  color: '#000',      bg: '#FFD700' },
  habitue:  { label: '◈ HABITUÉ',   color: '#fff',      bg: '#b44fff' },
  fiable:   { label: '✓ FIABLE',    color: '#000',      bg: '#22c55e' },
  a_risque: { label: '⚠ À RISQUE',  color: '#fff',      bg: '#ef4444' },
}

export default async function MyTicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/my/tickets')

  // Récupérer les billets de l'utilisateur
  const { data: tickets } = await supabaseAdmin
    .from('ticket_instances')
    .select(`
      id, status, qr_hash, created_at, scanned_at,
      event_id,
      events(id, title, slug, starts_at, location_name, city, organizer_id,
        organizers(id, name)
      ),
      ticket_types(name, price)
    `)
    .eq('holder_id', user.id)
    .order('created_at', { ascending: false })

  if (!tickets || tickets.length === 0) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
            // MES BILLETS //
          </p>
        </div>
        <div style={{
          border: '1px solid var(--border-default)',
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}>
          Aucun billet pour l'instant.<br /><br />
          <Link href="/events" style={{ color: 'var(--violet)', textDecoration: 'none' }}>
            → Explorer les événements
          </Link>
        </div>
      </main>
    )
  }

  // Récupérer les scores AIS pour cet utilisateur
  const { data: scores } = await supabaseAdmin
    .from('participant_scores')
    .select('organizer_id, score, badge, attendance_rate, recurrence_count')
    .eq('participant_id', user.id)

  const scoresByOrga: Record<string, typeof scores[0]> = {}
  if (scores) {
    for (const s of scores) {
      scoresByOrga[s.organizer_id] = s
    }
  }

  return (
    <main style={{ padding: '40px 24px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
          // MES BILLETS //
        </p>
        <h1 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '8px' }}>
          {tickets.length} billet{tickets.length > 1 ? 's' : ''}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tickets.map((ticket: any) => {
          const event = ticket.events
          const organizer = event?.organizers
          const ticketType = ticket.ticket_types
          const organizerId = event?.organizer_id
          const aisScore = organizerId ? scoresByOrga[organizerId] : null
          const badge = aisScore?.badge ? badgeConfig[aisScore.badge] : null

          const eventDate = event?.starts_at
            ? new Date(event.starts_at).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })
            : null

          const isPast = event?.starts_at
            ? new Date(event.starts_at) < new Date()
            : false

          return (
            <div
              key={ticket.id}
              style={{
                border: `1px solid ${isPast ? 'var(--border-default)' : 'var(--violet)'}`,
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
              }}
            >
              {/* Header événement */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    {event?.title ?? '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {organizer?.name ?? ''}
                    {eventDate ? ` — ${eventDate}` : ''}
                  </div>
                  {event?.location_name && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📍 {event.location_name}{event.city ? `, ${event.city}` : ''}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '9px',
                    letterSpacing: '0.15em',
                    padding: '3px 8px',
                    border: `1px solid ${ticket.status === 'scanned' ? 'var(--success)' : ticket.status === 'cancelled' ? 'var(--danger)' : 'var(--violet)'}`,
                    color: ticket.status === 'scanned' ? 'var(--success)' : ticket.status === 'cancelled' ? 'var(--danger)' : 'var(--violet)',
                  }}>
                    {ticket.status === 'scanned' ? '✓ SCANNÉ' : ticket.status === 'cancelled' ? '✕ ANNULÉ' : '◉ VALIDE'}
                  </span>
                </div>
              </div>

              {/* Détails billet */}
              <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.1em' }}>TYPE </span>
                  {ticketType?.name ?? '—'}
                  {ticketType?.price > 0 && (
                    <span style={{ color: 'var(--violet)', marginLeft: '8px' }}>
                      {(ticketType.price / 100).toFixed(2)} €
                    </span>
                  )}
                </div>

                {/* Badge AIS */}
                {badge && aisScore && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      padding: '3px 10px',
                      background: badge.bg,
                      color: badge.color,
                      fontWeight: 'bold',
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {Math.round(aisScore.score ?? 0)}/100
                    </span>
                  </div>
                )}
              </div>

              {/* Stats AIS si score disponible */}
              {aisScore && (
                <div style={{
                  padding: '10px 20px',
                  borderTop: '1px solid var(--border-default)',
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  gap: '24px',
                  fontSize: '11px',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em', fontSize: '9px' }}>PRÉSENCES </span>
                    {aisScore.recurrence_count ?? 0}×
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em', fontSize: '9px' }}>TAUX </span>
                    {Math.round((aisScore.attendance_rate ?? 0) * 100)}%
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em', fontSize: '9px' }}>SCORE AIS </span>
                    <span style={{ color: 'var(--violet)' }}>{Math.round(aisScore.score ?? 0)}</span>
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
