import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  draft: 'BROUILLON',
  published: 'PUBLIÉ',
  cancelled: 'ANNULÉ',
  completed: 'TERMINÉ',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-muted)',
  published: 'var(--success)',
  cancelled: 'var(--danger)',
  completed: 'var(--text-secondary)',
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) redirect('/auth/onboarding')

  // Fetch all events for this organizer
  let query = supabase
    .from('events')
    .select('id, title, slug, status, starts_at, ends_at, total_capacity, tickets_sold, cover_url, visibility')
    .eq('organizer_id', organizer.id)
    .order('starts_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: events } = await query

  const allEvents = events ?? []

  // Counts per status for filter tabs
  const { data: allForCount } = await supabase
    .from('events')
    .select('status')
    .eq('organizer_id', organizer.id)

  const counts = (allForCount ?? []).reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1
      acc.all = (acc.all ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const FILTERS = [
    { key: '', label: 'TOUS', count: counts.all ?? 0 },
    { key: 'published', label: 'PUBLIÉS', count: counts.published ?? 0 },
    { key: 'draft', label: 'BROUILLONS', count: counts.draft ?? 0 },
    { key: 'completed', label: 'TERMINÉS', count: counts.completed ?? 0 },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '48px 32px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '40px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}
          >
            <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>
              DASHBOARD
            </Link>{' '}
            / ÉVÉNEMENTS
          </p>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 400,
              letterSpacing: '0.05em',
            }}
          >
            MES ÉVÉNEMENTS
          </h1>
        </div>
        <Link href="/dashboard/events/new" className="btn btn-primary btn-sm">
          + CRÉER
        </Link>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: '32px',
        }}
      >
        {FILTERS.map(({ key, label, count }) => {
          const isActive = (params.status ?? '') === key
          return (
            <Link
              key={key}
              href={key ? `/dashboard/events?status=${key}` : '/dashboard/events'}
              style={{
                padding: '10px 20px',
                fontSize: '10px',
                letterSpacing: '0.15em',
                color: isActive ? 'var(--violet)' : 'var(--text-muted)',
                borderBottom: isActive
                  ? '2px solid var(--violet)'
                  : '2px solid transparent',
                marginBottom: '-1px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
            >
              {label}
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  background: isActive ? 'var(--violet-dim)' : 'var(--bg-elevated)',
                  color: isActive ? 'var(--violet)' : 'var(--text-muted)',
                }}
              >
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Events list */}
      {allEvents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>
            {params.status
              ? `Aucun événement avec le statut "${STATUS_LABELS[params.status] ?? params.status}"`
              : 'Aucun événement créé pour l\'instant'}
          </p>
          <Link href="/dashboard/events/new" className="btn btn-primary btn-sm">
            + CRÉER UN ÉVÉNEMENT
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-default)' }}>
          {allEvents.map((event) => {
            const fillRate =
              event.total_capacity > 0
                ? Math.round((event.tickets_sold / event.total_capacity) * 100)
                : 0

            return (
              <div
                key={event.id}
                style={{
                  background: 'var(--bg-secondary)',
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr auto',
                  gap: '20px',
                  alignItems: 'center',
                  padding: '16px 20px',
                }}
              >
                {/* Cover thumbnail */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {event.cover_url ? (
                    <img
                      src={event.cover_url}
                      alt={event.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '20px',
                      }}
                    >
                      ▸
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <p
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        fontFamily: "'Share Tech Mono', monospace",
                      }}
                    >
                      {event.title}
                    </p>
                    <span
                      style={{
                        fontSize: '9px',
                        letterSpacing: '0.15em',
                        color: STATUS_COLORS[event.status] ?? 'var(--text-muted)',
                      }}
                    >
                      {STATUS_LABELS[event.status] ?? event.status.toUpperCase()}
                    </span>
                    {event.visibility === 'circle_only' && (
                      <span
                        style={{
                          fontSize: '9px',
                          letterSpacing: '0.1em',
                          color: 'var(--violet)',
                          border: '1px solid var(--violet-dim)',
                          padding: '1px 5px',
                        }}
                      >
                        CERCLE
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatDate(event.starts_at)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {event.tickets_sold} / {event.total_capacity} billets
                      <span
                        style={{
                          marginLeft: '6px',
                          color: fillRate > 80 ? 'var(--success)' : 'var(--text-muted)',
                        }}
                      >
                        ({fillRate}%)
                      </span>
                    </span>
                  </div>

                  {/* Fill rate bar */}
                  <div
                    style={{
                      marginTop: '8px',
                      height: '2px',
                      background: 'var(--border-default)',
                      width: '200px',
                      maxWidth: '100%',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${fillRate}%`,
                        background:
                          fillRate > 80
                            ? 'var(--success)'
                            : fillRate > 40
                            ? 'var(--violet)'
                            : 'var(--text-muted)',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    GÉRER
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
