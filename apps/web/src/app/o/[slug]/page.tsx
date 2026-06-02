import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrgaProfileTabs from './OrgaProfileTabs'
import { BADGE_DEFS } from '@/lib/badges'

const profileBadgeConfig: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  legendaire: { label: '★ LÉGENDAIRE', color: '#000',    bg: '#FFD700', desc: 'Excellence confirmée — 10+ avis, note ≥ 4.5' },
  reconnu:    { label: '◈ RECONNU',   color: '#fff',    bg: '#b44fff', desc: 'Collectif établi — 5+ avis, note ≥ 4.0' },
  etabli:     { label: '✓ ÉTABLI',    color: '#000',    bg: '#22c55e', desc: 'Réputation solide — 3+ avis, note ≥ 3.5' },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: org } = await supabaseAdmin
    .from('organizers')
    .select('name, bio, city')
    .eq('slug', slug)
    .single()
  if (!org) return { title: 'Collectif introuvable — Vybe' }
  return {
    title: `${org.name} — Vybe`,
    description: org.bio ?? `Collectif ${org.city ?? ''} sur Vybe`,
  }
}

export default async function OrgaProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: organizer } = await supabaseAdmin
    .from('organizers')
    .select('id, name, slug, city, genres, bio, logo_url, banner_url, media, badge, created_at')
    .eq('slug', slug)
    .single()

  if (!organizer) notFound()

  // Événements à venir
  const { data: upcomingEvents } = await supabaseAdmin
    .from('events')
    .select('id, title, slug, starts_at, location_name, city, cover_url, status, min_price_cents, tickets_sold')
    .eq('organizer_id', organizer.id)
    .eq('status', 'published')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(20)

  // Événements passés
  const { data: pastEvents } = await supabaseAdmin
    .from('events')
    .select('id, title, slug, starts_at, location_name, city, cover_url, status, min_price_cents, tickets_sold')
    .eq('organizer_id', organizer.id)
    .eq('status', 'published')
    .lt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: false })
    .limit(20)

  // Stats reviews
  const { data: reviewsData } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('organizer_id', organizer.id)

  const reviewCount = reviewsData?.length ?? 0
  const avgRating = reviewCount > 0
    ? reviewsData!.reduce((s, r) => s + r.rating, 0) / reviewCount
    : null

  // Badges gagnés (publics uniquement)
  const { data: earnedBadges } = await supabaseAdmin
    .from('organizer_badges')
    .select('badge_type, badge_category, earned_at')
    .eq('organizer_id', organizer.id)
    .eq('is_public', true)
    .order('earned_at', { ascending: false })

  const regularityBadges = (earnedBadges ?? []).filter(b => b.badge_category === 'regularity')
  const eventBadgeTypes = [...new Set((earnedBadges ?? [])
    .filter(b => b.badge_category === 'event')
    .map(b => b.badge_type))]

  // Follower count
  const { count: followersCount } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', organizer.id)

  // Is current user following?
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isFollowing = false
  if (user) {
    const { data: follow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('organizer_id', organizer.id)
      .eq('follower_id', user.id)
      .single()
    isFollowing = !!follow
  }

  const badge = organizer.badge ? profileBadgeConfig[organizer.badge] : null
  const media: Array<{ type: string; url: string; caption?: string }> = organizer.media ?? []

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: '100%',
        height: '280px',
        background: organizer.banner_url
          ? `url(${organizer.banner_url}) center/cover no-repeat`
          : 'linear-gradient(135deg, #0f0f0f 0%, #1a0a2e 50%, #0f0f0f 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Overlay gradient bas */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '120px',
          background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
        }} />
        {/* Grid texture */}
        {!organizer.banner_url && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.3,
          }} />
        )}
      </div>

      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

        {/* Logo + infos */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '24px',
          marginTop: '-60px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          {/* Logo */}
          <div style={{
            width: '100px',
            height: '100px',
            border: '3px solid var(--bg-primary)',
            background: organizer.logo_url
              ? `url(${organizer.logo_url}) center/cover no-repeat`
              : 'var(--bg-elevated)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'var(--violet)',
          }}>
            {!organizer.logo_url && organizer.name[0].toUpperCase()}
          </div>

          {/* Nom + badge + stats */}
          <div style={{ flex: 1, paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 400, letterSpacing: '0.05em' }}>
                {organizer.name}
              </h1>
              {badge && (
                <span style={{
                  fontSize: '9px', letterSpacing: '0.15em', padding: '3px 10px',
                  background: badge.bg, color: badge.color, fontWeight: 'bold',
                }} title={badge.desc}>
                  {badge.label}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {organizer.city && (
                <span>📍 {organizer.city}</span>
              )}
              <span>
                <span style={{ color: 'var(--text-primary)' }}>{followersCount ?? 0}</span> followers
              </span>
              <span>
                <span style={{ color: 'var(--text-primary)' }}>{(upcomingEvents?.length ?? 0) + (pastEvents?.length ?? 0)}</span> événements
              </span>
              {avgRating !== null && (
                <span>
                  ★ <span style={{ color: 'var(--text-primary)' }}>{avgRating.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)' }}> ({reviewCount} avis)</span>
                </span>
              )}
            </div>
          </div>

          {/* Follow button */}
          <OrgaProfileTabs
            organizerId={organizer.id}
            userId={user?.id ?? null}
            isFollowing={isFollowing}
            upcomingEvents={upcomingEvents ?? []}
            pastEvents={pastEvents ?? []}
            media={media}
            bio={organizer.bio}
            genres={organizer.genres ?? []}
            initialView="events"
          />
        </div>

        {/* Genres */}
        {organizer.genres && organizer.genres.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {organizer.genres.map((g: string) => (
              <span key={g} style={{
                fontSize: '9px', letterSpacing: '0.12em', padding: '3px 8px',
                border: '1px solid var(--border-default)', color: 'var(--text-muted)',
              }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {organizer.bio && (
          <p style={{
            fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7,
            marginBottom: '24px', maxWidth: '600px',
          }}>
            {organizer.bio}
          </p>
        )}

        {/* ── Badges section ─────────────────────────────────────────────── */}
        {(regularityBadges.length > 0 || eventBadgeTypes.length > 0) && (
          <div style={{ marginBottom: '24px' }}>
            {/* Badges régularité */}
            {regularityBadges.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {regularityBadges.map((b, i) => {
                  const def = BADGE_DEFS[b.badge_type]
                  if (!def) return null
                  return (
                    <span key={i} style={{
                      fontSize: '10px', letterSpacing: '0.12em', padding: '5px 12px',
                      background: def.bg, color: def.color, fontWeight: 'bold',
                    }} title={def.criteria}>
                      {def.icon} {def.label.toUpperCase()}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Badges événement */}
            {eventBadgeTypes.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {eventBadgeTypes.map((type, i) => {
                  const def = BADGE_DEFS[type]
                  if (!def) return null
                  return (
                    <span key={i} style={{
                      fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px',
                      border: `1px solid ${def.border}`, color: def.border,
                    }} title={def.criteria}>
                      {def.icon} {def.label}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', marginBottom: '32px' }} />
      </div>
    </div>
  )
}
