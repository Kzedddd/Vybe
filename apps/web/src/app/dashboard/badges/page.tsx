import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BADGE_DEFS, EVENT_BADGES, REGULAR_BADGES } from '@/lib/badges'
import BadgesClient from './BadgesClient'

export default async function BadgesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) redirect('/auth/onboarding')

  // Tous les badges gagnés
  const { data: earnedBadges } = await supabaseAdmin
    .from('organizer_badges')
    .select(`
      id, badge_type, badge_category, is_public, earned_at,
      event_id,
      events(id, title, slug, starts_at)
    `)
    .eq('organizer_id', organizer.id)
    .order('earned_at', { ascending: false })

  // Événements passés avec stats reviews (pour afficher les critères)
  const { data: pastEvents } = await supabaseAdmin
    .from('events')
    .select(`
      id, title, slug, starts_at,
      reviews(rating, rating_programmation, rating_son_scene, rating_organisation)
    `)
    .eq('organizer_id', organizer.id)
    .eq('status', 'published')
    .lt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: false })
    .limit(20)

  // Calculer les stats par event pour afficher la progression
  const eventStats = (pastEvents ?? []).map(ev => {
    const reviews = (ev.reviews as any[]) ?? []
    const count = reviews.length
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
    return {
      id: ev.id,
      title: ev.title,
      slug: ev.slug,
      starts_at: ev.starts_at,
      review_count: count,
      avg_global: avg(reviews.map(r => r.rating).filter(Boolean)),
      avg_prog: avg(reviews.map(r => r.rating_programmation).filter(Boolean)),
      avg_son: avg(reviews.map(r => r.rating_son_scene).filter(Boolean)),
      avg_orga: avg(reviews.map(r => r.rating_organisation).filter(Boolean)),
    }
  })

  const earnedByEvent: Record<string, string[]> = {}
  const regularityBadges: typeof earnedBadges = []

  for (const b of (earnedBadges ?? [])) {
    if (b.badge_category === 'regularity') {
      regularityBadges.push(b)
    } else if (b.event_id) {
      if (!earnedByEvent[b.event_id]) earnedByEvent[b.event_id] = []
      earnedByEvent[b.event_id].push(b.badge_type)
    }
  }

  const totalEarned = (earnedBadges ?? []).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 32px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Breadcrumb */}
      <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>DASHBOARD</Link>
        {' / '}
        <span style={{ color: 'var(--text-secondary)' }}>BADGES</span>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 400, letterSpacing: '0.05em', marginBottom: '6px' }}>
            BADGES &amp; RÉPUTATION
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {totalEarned} badge{totalEarned !== 1 ? 's' : ''} gagné{totalEarned !== 1 ? 's' : ''}
          </p>
        </div>
        <BadgesClient organizerId={organizer.id} />
      </div>

      {/* ── Info bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        border: '1px solid var(--violet)',
        background: 'rgba(180,79,255,0.05)',
        padding: '12px 16px',
        fontSize: '10px',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        lineHeight: 1.7,
        marginBottom: '40px',
      }}>
        <span style={{ color: 'var(--violet)' }}>// </span>
        Fréquence de mise à jour : badges événement calculés à J+14 après la clôture des avis ·
        Badges régularité recalculés mensuellement en rolling 12 mois ·
        Visibilité publique opt-in par badge
      </div>

      {/* ── Badges régularité ─────────────────────────────────────────────────── */}
      <Section label="BADGES DE RÉGULARITÉ (12 MOIS)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {REGULAR_BADGES.map(def => {
            const earned = regularityBadges?.find(b => b.badge_type === def.type)
            return (
              <BadgeCard
                key={def.type}
                def={def}
                earned={!!earned}
                earnedAt={earned?.earned_at}
                isPublic={earned?.is_public ?? true}
                badgeId={earned?.id}
              />
            )
          })}
        </div>
      </Section>

      {/* ── Badges par événement ─────────────────────────────────────────────── */}
      <Section label="BADGES PAR ÉVÉNEMENT">
        {/* Catalogue */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          {EVENT_BADGES.map(def => {
            const totalEarned = Object.values(earnedByEvent).filter(bs => bs.includes(def.type)).length
            return (
              <BadgeCard
                key={def.type}
                def={def}
                earned={totalEarned > 0}
                count={totalEarned}
              />
            )
          })}
        </div>

        {/* Events avec stats */}
        <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '16px', borderTop: '1px solid var(--border-default)', paddingTop: '20px' }}>
          DÉTAIL PAR ÉVÉNEMENT
        </p>
        {eventStats.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px solid var(--border-default)' }}>
            Aucun événement passé avec des avis pour l'instant
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {eventStats.map(ev => {
              const badges = earnedByEvent[ev.id] ?? []
              return (
                <div key={ev.id} style={{
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-secondary)',
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: badges.length > 0 ? '12px' : '0' }}>
                    <div>
                      <Link href={`/dashboard/events/${ev.id}`} style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {ev.title}
                      </Link>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '12px' }}>
                        {new Date(ev.starts_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <Stat label="GLOBAL" val={ev.avg_global} min={4.5} />
                      <Stat label="PROG" val={ev.avg_prog} min={5.0} />
                      <Stat label="SON" val={ev.avg_son} min={4.8} />
                      <Stat label="ORGA" val={ev.avg_orga} min={4.7} />
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {ev.review_count} avis
                      </span>
                    </div>
                  </div>
                  {badges.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {badges.map(type => {
                        const def = BADGE_DEFS[type]
                        if (!def) return null
                        return (
                          <span key={type} style={{
                            fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px',
                            background: def.bg, color: def.color, fontWeight: 'bold',
                          }}>
                            {def.icon} {def.label.toUpperCase()}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', paddingBottom: '12px', borderBottom: '1px solid var(--border-default)', marginBottom: '20px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function BadgeCard({ def, earned, earnedAt, isPublic, badgeId, count }: {
  def: { label: string; desc: string; icon: string; color: string; bg: string; border: string; criteria: string }
  earned: boolean
  earnedAt?: string | null
  isPublic?: boolean
  badgeId?: string
  count?: number
}) {
  return (
    <div style={{
      border: `1px solid ${earned ? def.border : 'var(--border-default)'}`,
      background: earned ? 'var(--bg-secondary)' : 'var(--bg-primary)',
      padding: '16px',
      opacity: earned ? 1 : 0.5,
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
    }}>
      {/* Icon */}
      <div style={{
        width: '40px', height: '40px', flexShrink: 0,
        background: earned ? def.bg : 'var(--bg-elevated)',
        color: earned ? def.color : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: 'bold',
      }}>
        {def.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: earned ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: earned ? 'bold' : 'normal', marginBottom: '3px' }}>
            {def.label}
            {count !== undefined && count > 1 && (
              <span style={{ fontSize: '10px', color: def.border, marginLeft: '6px' }}>×{count}</span>
            )}
          </p>
          {earned && earnedAt && (
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>
              {new Date(earnedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {def.criteria}
        </p>
      </div>
    </div>
  )
}

function Stat({ label, val, min }: { label: string; val: number | null; min: number }) {
  if (val === null) return (
    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>{label} </span>—
    </span>
  )
  const ok = val >= min
  return (
    <span>
      <span style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label} </span>
      <span style={{ color: ok ? 'var(--success)' : 'var(--text-secondary)' }}>{val.toFixed(1)}</span>
    </span>
  )
}
