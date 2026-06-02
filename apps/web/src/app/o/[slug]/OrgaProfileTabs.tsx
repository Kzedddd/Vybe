"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  slug: string
  starts_at: string
  location_name: string | null
  city: string | null
  cover_url: string | null
  min_price_cents: number | null
  tickets_sold: number
}

interface MediaItem {
  type: string
  url: string
  caption?: string
}

interface Props {
  organizerId: string
  userId: string | null
  isFollowing: boolean
  upcomingEvents: Event[]
  pastEvents: Event[]
  media: MediaItem[]
  bio: string | null
  genres: string[]
  initialView: string
}

type Tab = 'events' | 'past' | 'media'

export default function OrgaProfileTabs({
  organizerId,
  userId,
  isFollowing: initialFollowing,
  upcomingEvents,
  pastEvents,
  media,
}: Props) {
  const [tab, setTab] = useState<Tab>('events')
  const [following, setFollowing] = useState(initialFollowing)
  const [followLoading, setFollowLoading] = useState(false)

  const supabase = createClient()

  const toggleFollow = async () => {
    if (!userId) {
      window.location.href = '/auth/login'
      return
    }
    setFollowLoading(true)
    if (following) {
      await supabase.from('follows').delete()
        .eq('organizer_id', organizerId)
        .eq('follower_id', userId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({
        organizer_id: organizerId,
        follower_id: userId,
      })
      setFollowing(true)
    }
    setFollowLoading(false)
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'events', label: 'À VENIR', count: upcomingEvents.length },
    { key: 'past',   label: 'PASSÉS',  count: pastEvents.length },
    { key: 'media',  label: 'MÉDIAS',  count: media.length },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Follow button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={toggleFollow}
          disabled={followLoading}
          style={{
            padding: '8px 24px',
            border: `1px solid ${following ? 'var(--border-default)' : 'var(--violet)'}`,
            background: following ? 'transparent' : 'var(--violet)',
            color: following ? 'var(--text-muted)' : '#fff',
            cursor: followLoading ? 'wait' : 'pointer',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: followLoading ? 0.6 : 1,
          }}
        >
          {following ? '✓ SUIVI' : '+ SUIVRE'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-default)',
        marginBottom: '24px',
        gap: '0',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--violet)' : '2px solid transparent',
              color: tab === t.key ? 'var(--violet)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.15em',
              marginBottom: '-1px',
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span style={{
                marginLeft: '6px',
                fontSize: '9px',
                color: tab === t.key ? 'var(--violet)' : 'var(--border-default)',
              }}>
                [{t.count}]
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 48px' }}>

        {/* À venir */}
        {tab === 'events' && (
          <div>
            {upcomingEvents.length === 0 ? (
              <EmptyState text="Aucun événement à venir pour l'instant" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingEvents.map(e => <EventCard key={e.id} event={e} upcoming />)}
              </div>
            )}
          </div>
        )}

        {/* Passés */}
        {tab === 'past' && (
          <div>
            {pastEvents.length === 0 ? (
              <EmptyState text="Aucun événement passé" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pastEvents.map(e => <EventCard key={e.id} event={e} upcoming={false} />)}
              </div>
            )}
          </div>
        )}

        {/* Médias */}
        {tab === 'media' && (
          <div>
            {media.length === 0 ? (
              <EmptyState text="Aucun média partagé pour l'instant" />
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
              }}>
                {media.map((item, i) => (
                  <MediaCard key={i} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EventCard({ event, upcoming }: { event: Event; upcoming: boolean }) {
  const date = new Date(event.starts_at)
  const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const price = event.min_price_cents != null
    ? event.min_price_cents === 0 ? 'GRATUIT' : `À partir de ${(event.min_price_cents / 100).toFixed(0)} €`
    : null

  return (
    <Link href={`/events/${event.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex',
        gap: '16px',
        border: `1px solid ${upcoming ? 'var(--violet)' : 'var(--border-default)'}`,
        background: 'var(--bg-secondary)',
        padding: '0',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--violet)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = upcoming ? 'var(--violet)' : 'var(--border-default)')}
      >
        {/* Cover */}
        <div style={{
          width: '80px',
          height: '80px',
          flexShrink: 0,
          background: event.cover_url
            ? `url(${event.cover_url}) center/cover no-repeat`
            : 'var(--bg-elevated)',
        }} />

        {/* Info */}
        <div style={{ flex: 1, padding: '12px 16px 12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {event.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {dateStr} — {timeStr}
            {(event.location_name || event.city) && (
              <span> · {event.location_name ?? event.city}</span>
            )}
          </div>
          {price && (
            <div style={{ fontSize: '10px', color: upcoming ? 'var(--violet)' : 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.05em' }}>
              {price}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div style={{ padding: '12px 16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontSize: '12px' }}>
          →
        </div>
      </div>
    </Link>
  )
}

function MediaCard({ item }: { item: MediaItem }) {
  if (item.type === 'video') {
    return (
      <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
        <video
          src={item.url}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted
          onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
          onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
        />
        <div style={{
          position: 'absolute', bottom: '6px', right: '6px',
          fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 5px',
        }}>
          ▶
        </div>
        {item.caption && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            padding: '16px 8px 8px',
            fontSize: '10px', color: '#fff',
          }}>
            {item.caption}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative',
      aspectRatio: '1',
      background: `url(${item.url}) center/cover no-repeat var(--bg-elevated)`,
      overflow: 'hidden',
    }}>
      {item.caption && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '16px 8px 8px',
          fontSize: '10px', color: '#fff',
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
        >
          {item.caption}
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontSize: '12px',
      border: '1px solid var(--border-default)',
    }}>
      {text}
    </div>
  )
}
