import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getDashboardData(organizerId: string) {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const [eventsRes, ordersRes, ordersLastMonthRes, organizerRes, reviewsRes, scoresRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, status, starts_at, ends_at, total_capacity, tickets_sold, cover_url')
      .eq('organizer_id', organizerId)
      .order('starts_at', { ascending: false }),

    // This month's confirmed orders
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at, event_id')
      .eq('organizer_id', organizerId)
      .eq('status', 'confirmed')
      .gte('created_at', startOfMonth),

    // Last month's confirmed orders (for variation)
    supabase
      .from('orders')
      .select('id, total_amount')
      .eq('organizer_id', organizerId)
      .eq('status', 'confirmed')
      .gte('created_at', startOfLastMonth)
      .lte('created_at', endOfLastMonth),

    supabase
      .from('organizers')
      .select('name, slug, plan, commission_rate, stripe_account_id, stripe_onboarded, avg_review_score')
      .eq('id', organizerId)
      .single(),

    // All reviews for this organizer
    supabase
      .from('reviews')
      .select('id, rating, rating_programmation, rating_son_scene, rating_organisation, rating_ambiance, rating_qualite_prix, comment, created_at, event_id, is_visible')
      .eq('organizer_id', organizerId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false }),

    // Top participants AIS
    supabase
      .from('participant_scores')
      .select('participant_id, score, badge, recurrence_count, attendance_rate, profile:profiles(full_name, email)')
      .eq('organizer_id', organizerId)
      .order('score', { ascending: false })
      .limit(10),
  ])

  const events = eventsRes.data ?? []
  const ordersThisMonth = ordersRes.data ?? []
  const ordersLastMonth = ordersLastMonthRes.data ?? []
  const organizer = organizerRes.data
  const reviews = reviewsRes.data ?? []
  const topParticipants = scoresRes.data ?? []

  // ── Reviews stats ──────────────────────────────────────────────────────────
  const reviewCount = reviews.length
  const hasEnoughReviews = reviewCount >= 5

  const avgField = (field: string) => {
    const valid = reviews.filter((r: any) => r[field] != null)
    return valid.length > 0 ? valid.reduce((s: number, r: any) => s + r[field], 0) / valid.length : null
  }

  const avgScores = reviewCount > 0 ? {
    global: reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewCount,
    programmation: avgField('rating_programmation'),
    son_scene: avgField('rating_son_scene'),
    organisation: avgField('rating_organisation'),
    ambiance: avgField('rating_ambiance'),
    qualite_prix: avgField('rating_qualite_prix'),
  } : null

  // % qui recommanderaient (rating >= 4)
  const pctRecommend = reviewCount > 0
    ? Math.round((reviews.filter((r) => (r.rating ?? 0) >= 4).length / reviewCount) * 100)
    : null

  const recentReviews = reviews.slice(0, 3)

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const commissionRate = organizer?.commission_rate ?? 0.05

  const revenueThisMonth = ordersThisMonth.reduce((s, o) => s + (o.total_amount ?? 0), 0) / 100
  const revenueLastMonth = ordersLastMonth.reduce((s, o) => s + (o.total_amount ?? 0), 0) / 100
  const netRevenueThisMonth = revenueThisMonth * (1 - commissionRate)

  const revenueVariation =
    revenueLastMonth === 0
      ? null
      : Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)

  const ticketsThisMonth = ordersThisMonth.length
  const ticketsLastMonth = ordersLastMonth.length
  const ticketsVariation =
    ticketsLastMonth === 0
      ? null
      : Math.round(((ticketsThisMonth - ticketsLastMonth) / ticketsLastMonth) * 100)

  // ── Upcoming events (published, future) ───────────────────────────────────
  const nowIso = now.toISOString()
  const upcomingEvents = events
    .filter((e) => e.status === 'published' && e.starts_at > nowIso)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 4)

  // ── Active events count ────────────────────────────────────────────────────
  const activeEventsCount = upcomingEvents.length
  const avgFillRate =
    upcomingEvents.length > 0
      ? Math.round(
          upcomingEvents.reduce(
            (s, e) =>
              s + (e.total_capacity > 0 ? e.tickets_sold / e.total_capacity : 0),
            0
          ) / upcomingEvents.length * 100
        )
      : null

  // ── Recent orders (last 5, all time) ──────────────────────────────────────
  const { data: recentOrdersData } = await supabase
    .from('orders')
    .select('id, total_amount, created_at, buyer_name, buyer_email')
    .eq('organizer_id', organizerId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(5)

  const recentOrders = recentOrdersData ?? []

  // ── All events for the list (5 most recent) ────────────────────────────────
  const allEvents = events.slice(0, 5)

  // ── Actions requises ───────────────────────────────────────────────────────
  const alerts: { type: 'warning' | 'danger' | 'info'; message: string; href?: string }[] = []

  if (!organizer?.stripe_onboarded) {
    alerts.push({
      type: 'warning',
      message: 'Stripe non connecté — configure l\'encaissement pour vendre des billets',
      href: '/dashboard/settings',
    })
  }

  // Events with low fill rate close to date
  for (const e of upcomingEvents) {
    const daysUntil = Math.floor(
      (new Date(e.starts_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    const fillRate =
      e.total_capacity > 0 ? (e.tickets_sold / e.total_capacity) * 100 : 0

    if (daysUntil <= 14 && fillRate < 50) {
      alerts.push({
        type: 'danger',
        message: `${e.title} dans ${daysUntil}j — seulement ${Math.round(fillRate)}% de remplissage`,
        href: `/dashboard/events/${e.id}`,
      })
    } else if (daysUntil <= 7 && fillRate < 75) {
      alerts.push({
        type: 'warning',
        message: `${e.title} dans ${daysUntil}j — ${Math.round(fillRate)}% de remplissage`,
        href: `/dashboard/events/${e.id}`,
      })
    }
  }

  const draftEvents = events.filter((e) => e.status === 'draft')
  if (draftEvents.length > 0) {
    alerts.push({
      type: 'info',
      message: `${draftEvents.length} événement${draftEvents.length > 1 ? 's' : ''} en brouillon non publié${draftEvents.length > 1 ? 's' : ''}`,
      href: '/dashboard/events?status=draft',
    })
  }

  return {
    organizer,
    reviews: {
      count: reviewCount,
      hasEnoughReviews,
      avgScores,
      recentReviews,
      pctRecommend,
    },
    kpis: {
      activeEventsCount,
      avgFillRate,
      ticketsThisMonth,
      ticketsVariation,
      revenueThisMonth,
      revenueLastMonth,
      revenueVariation,
      netRevenueThisMonth,
      commissionRate,
    },
    upcomingEvents,
    recentOrders,
    allEvents,
    alerts,
    topParticipants,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string; created?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizerRecord } = await supabase
    .from('organizers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!organizerRecord) redirect('/auth/onboarding')

  const { organizer, kpis, upcomingEvents, recentOrders, allEvents, alerts, reviews, topParticipants } =
    await getDashboardData(organizerRecord.id)

  const isOnboarded = params.onboarded === '1'
  const isCreated = params.created === '1'

  // ── Formatters ─────────────────────────────────────────────────────────────
  const formatEur = (n: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const daysUntil = (iso: string) => {
    const d = Math.ceil(
      (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return d <= 0 ? 'Aujourd\'hui' : `J-${d}`
  }

  const PLAN_LABELS: Record<string, string> = {
    starter: 'STARTER — 5%',
    pro: 'PRO — 4%',
    scale: 'SCALE — 3%',
  }

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

  const ALERT_COLORS = {
    danger: { border: 'var(--danger)', color: 'var(--danger)', icon: '▲' },
    warning: { border: 'var(--warning)', color: 'var(--warning)', icon: '▸' },
    info: { border: 'var(--text-muted)', color: 'var(--text-muted)', icon: '◦' },
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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

      {/* ── Flash banners ─────────────────────────────────────────────────── */}
      {(isOnboarded || isCreated) && (
        <div
          style={{
            border: '1px solid var(--success)',
            padding: '12px 20px',
            marginBottom: '24px',
            color: 'var(--success)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>▸</span>
          <span>
            {isOnboarded
              ? 'COLLECTIF CRÉÉ — BIENVENUE SUR VYBE'
              : 'ÉVÉNEMENT CRÉÉ AVEC SUCCÈS'}
          </span>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
        }}
      >
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '4px' }}>
            TABLEAU DE BORD
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '0.05em' }}>
            {organizer?.name ?? 'MON COLLECTIF'}
          </h1>
          {organizer?.plan && (
            <span
              style={{
                display: 'inline-block',
                marginTop: '6px',
                fontSize: '10px',
                letterSpacing: '0.15em',
                color: 'var(--violet)',
                border: '1px solid var(--violet-dim)',
                padding: '2px 8px',
              }}
            >
              {PLAN_LABELS[organizer.plan] ?? organizer.plan.toUpperCase()}
            </span>
          )}
        </div>
        <Link href="/dashboard/events/new" className="btn btn-primary btn-sm">
          + CRÉER UN ÉVÉNEMENT
        </Link>
      </div>

      {/* ── Actions requises ───────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {alerts.map((alert, i) => {
            const c = ALERT_COLORS[alert.type]
            const inner = (
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--bg-secondary)',
                  borderLeft: `3px solid ${c.border}`,
                }}
              >
                <span style={{ color: c.color, fontSize: '10px', flexShrink: 0 }}>{c.icon}</span>
                <span style={{ fontSize: '11px', color: c.color, letterSpacing: '0.05em' }}>
                  {alert.message}
                </span>
                {alert.href && (
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: c.color, flexShrink: 0 }}>
                    VOIR →
                  </span>
                )}
              </div>
            )
            return alert.href ? (
              <Link key={i} href={alert.href} style={{ textDecoration: 'none' }}>
                {inner}
              </Link>
            ) : (
              <div key={i}>{inner}</div>
            )
          })}
        </div>
      )}

      {/* ── KPI Grid ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px',
          background: 'var(--border-default)',
          border: '1px solid var(--border-default)',
          marginBottom: '32px',
        }}
      >
        <KPICard
          label="ÉVÉNEMENTS ACTIFS"
          value={kpis.activeEventsCount}
          sub={kpis.avgFillRate !== null ? `${kpis.avgFillRate}% remplissage moy.` : 'Aucun à venir'}
        />
        <KPICard
          label="BILLETS CE MOIS"
          value={kpis.ticketsThisMonth}
          variation={kpis.ticketsVariation}
          sub="vs mois précédent"
        />
        <KPICard
          label="REVENUS CE MOIS"
          value={formatEur(kpis.revenueThisMonth)}
          variation={kpis.revenueVariation}
          sub="bruts"
        />
        <KPICard
          label="REVENUS NETS"
          value={formatEur(kpis.netRevenueThisMonth)}
          sub={`après commission ${Math.round(kpis.commissionRate * 100)}%`}
          accent
        />
      </div>

      {/* ── Prochains événements ───────────────────────────────────────────── */}
      <div
        style={{
          border: '1px solid var(--border-default)',
          background: 'var(--bg-secondary)',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
            PROCHAINS ÉVÉNEMENTS
          </span>
          <Link href="/dashboard/events?status=published" style={{ fontSize: '10px', color: 'var(--violet)', letterSpacing: '0.1em' }}>
            VOIR TOUT →
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            <p style={{ marginBottom: '16px' }}>Aucun événement publié à venir</p>
            <Link href="/dashboard/events/new" className="btn btn-primary btn-sm">+ CRÉER</Link>
          </div>
        ) : (
          <div>
            {upcomingEvents.map((event, i) => {
              const fillRate = event.total_capacity > 0
                ? Math.round((event.tickets_sold / event.total_capacity) * 100)
                : 0
              const daysLeft = Math.ceil(
                (new Date(event.starts_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
              const isLowFill = daysLeft <= 14 && fillRate < 50
              const isMidFill = daysLeft <= 7 && fillRate < 75

              return (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: i < upcomingEvents.length - 1 ? '1px solid var(--border-default)' : 'none',
                      borderLeft: isLowFill
                        ? '3px solid var(--danger)'
                        : isMidFill
                        ? '3px solid var(--warning)'
                        : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {event.title}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {formatDate(event.starts_at)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p
                          style={{
                            fontSize: '11px',
                            letterSpacing: '0.1em',
                            color: daysLeft <= 3 ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--text-secondary)',
                            marginBottom: '2px',
                          }}
                        >
                          {daysUntil(event.starts_at)}
                        </p>
                        <p style={{ fontSize: '10px', color: isLowFill ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {event.tickets_sold} / {event.total_capacity}
                          {isLowFill && ' ⚠'}
                        </p>
                      </div>
                    </div>

                    {/* Fill bar */}
                    <div style={{ height: '2px', background: 'var(--border-default)' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${fillRate}%`,
                          background: isLowFill
                            ? 'var(--danger)'
                            : fillRate > 75
                            ? 'var(--success)'
                            : 'var(--violet)',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '9px', color: isLowFill ? 'var(--danger)' : 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em' }}>
                      {fillRate}% DE REMPLISSAGE
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Bottom grid : tous les events + dernières ventes ──────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* All events */}
        <div style={{ border: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
              MES ÉVÉNEMENTS
            </span>
            <Link href="/dashboard/events" style={{ fontSize: '10px', color: 'var(--violet)', letterSpacing: '0.1em' }}>
              VOIR TOUT →
            </Link>
          </div>

          {allEvents.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              <p style={{ marginBottom: '12px' }}>Aucun événement créé</p>
              <Link href="/dashboard/events/new" className="btn btn-primary btn-sm">+ CRÉER</Link>
            </div>
          ) : (
            <div>
              {allEvents.map((event, i) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      padding: '12px 20px',
                      borderBottom: i < allEvents.length - 1 ? '1px solid var(--border-default)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.title}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatDate(event.starts_at)}
                      </p>
                    </div>
                    <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: STATUS_COLORS[event.status] ?? 'var(--text-muted)', flexShrink: 0 }}>
                      {STATUS_LABELS[event.status] ?? event.status.toUpperCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div style={{ border: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)' }}>
            <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
              ACTIVITÉ RÉCENTE
            </span>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              Aucune vente pour l'instant
            </div>
          ) : (
            <div>
              {recentOrders.map((order, i) => {
                const elapsed = Date.now() - new Date(order.created_at).getTime()
                const mins = Math.floor(elapsed / 60000)
                const hours = Math.floor(elapsed / 3600000)
                const timeAgo = mins < 60 ? `${mins}min` : hours < 24 ? `${hours}h` : formatDate(order.created_at)

                return (
                  <div
                    key={order.id}
                    style={{
                      padding: '12px 20px',
                      borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border-default)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {order.buyer_name ?? order.buyer_email ?? `#${order.id.slice(0, 8).toUpperCase()}`}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{timeAgo}</p>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--success)', fontFamily: 'Share Tech Mono, monospace' }}>
                      {formatEur((order.total_amount ?? 0) / 100)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── AIS — Top Participants ────────────────────────────────────────── */}
      <div style={{ border: '1px solid var(--border-default)', background: 'var(--bg-secondary)', marginTop: '24px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
            AUDIENCE INTELLIGENCE — TOP PARTICIPANTS
          </span>
        </div>
        {topParticipants.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Les scores apparaîtront après les premiers scans de billets
          </div>
        ) : (
          <div>
            {topParticipants.map((p: any, i: number) => {
              const profile = p.profile as any
              const badgeConfig: Record<string, { label: string; color: string }> = {
                vip_gold:  { label: 'VIP GOLD',  color: '#FFD700' },
                habitue:   { label: 'HABITUÉ',   color: 'var(--violet)' },
                fiable:    { label: 'FIABLE',    color: 'var(--success)' },
                a_risque:  { label: 'À RISQUE',  color: 'var(--danger)' },
              }
              const badge = badgeConfig[p.badge] ?? { label: p.badge, color: 'var(--text-muted)' }
              return (
                <div key={p.participant_id} style={{
                  padding: '12px 20px',
                  borderBottom: i < topParticipants.length - 1 ? '1px solid var(--border-default)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px' }}>#{i + 1}</span>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {profile?.full_name ?? profile?.email ?? '—'}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {p.recurrence_count} event{p.recurrence_count > 1 ? 's' : ''} · {Math.round((p.attendance_rate ?? 0) * 100)}% présence
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '8px', padding: '2px 8px', letterSpacing: '0.12em',
                      border: `1px solid ${badge.color}`, color: badge.color,
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '16px', color: 'var(--violet)', minWidth: '36px', textAlign: 'right' }}>
                      {p.score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Reviews & Notes ───────────────────────────────────────────────── */}
      <div
        style={{
          border: '1px solid var(--border-default)',
          background: 'var(--bg-secondary)',
          marginTop: '24px',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
            RÉPUTATION — NOTES PARTICIPANTS
          </span>
          {reviews.count > 0 && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              {reviews.count} AVIS
            </span>
          )}
        </div>

        {reviews.count === 0 ? (
          <div style={{ padding: '32px 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            <div style={{ width: '64px', height: '64px', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)', fontSize: '24px' }}>★</div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Aucun avis pour l'instant</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '480px' }}>
                Les notes apparaissent ici après que tes participants aient assisté à un événement et soumis leur avis via le scanner. Le score global est affiché à partir de 5 avis minimum.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* ── 4 KPIs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-default)', borderBottom: '1px solid var(--border-default)' }}>
              {[
                { label: 'SCORE GLOBAL', value: reviews.avgScores!.global.toFixed(1) + ' /5', color: reviews.avgScores!.global >= 4.5 ? 'var(--success)' : reviews.avgScores!.global >= 3 ? 'var(--warning)' : 'var(--danger)' },
                { label: 'AVIS COLLECTÉS', value: reviews.count, color: 'var(--text-primary)' },
                { label: 'TAUX DE RÉPONSE', value: `${Math.round((reviews.count / Math.max(1, reviews.count)) * 100)}%`, color: 'var(--text-primary)' },
                { label: 'RECOMMANDERAIENT', value: `${reviews.pctRecommend ?? 0}%`, color: (reviews.pctRecommend ?? 0) >= 80 ? 'var(--success)' : 'var(--warning)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-secondary)', padding: '16px 20px' }}>
                  <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</p>
                  <p style={{ fontSize: '24px', fontFamily: 'Share Tech Mono, monospace', color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Détail par critère + avis récents ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              <div style={{ padding: '24px', borderRight: '1px solid var(--border-default)' }}>
                <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '16px' }}>DÉTAIL PAR CRITÈRE</p>
                {[
                  { key: 'programmation', label: 'Programmation', score: reviews.avgScores!.programmation },
                  { key: 'son_scene', label: 'Son & scène', score: reviews.avgScores!.son_scene },
                  { key: 'organisation', label: 'Organisation', score: reviews.avgScores!.organisation },
                  { key: 'ambiance', label: 'Ambiance', score: reviews.avgScores!.ambiance },
                  { key: 'qualite_prix', label: 'Rapport qualité/prix', score: reviews.avgScores!.qualite_prix },
                ].map(({ key, label, score }) => {
                  if (score === null) return null
                  const pct = (score / 5) * 100
                  return (
                    <div key={key} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: '11px', fontFamily: 'Share Tech Mono, monospace', color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--violet)' : 'var(--warning)' }}>{score.toFixed(1)}</span>
                      </div>
                      <div style={{ height: '3px', background: 'var(--border-default)' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--violet)' : 'var(--warning)', transition: 'width 0.3s' }} />
                      </div>
                      {score <= 3.5 && (
                        <p style={{ fontSize: '9px', color: 'var(--warning)', marginTop: '3px' }}>
                          ▸ Point d'attention — mentionné dans les avis
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Avis récents */}
              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '16px' }}>AVIS RÉCENTS</p>
                {reviews.recentReviews.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aucun commentaire</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.recentReviews.map((review: any) => (
                      <div key={review.id} style={{ borderLeft: '2px solid var(--border-default)', paddingLeft: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--violet)', fontSize: '11px', letterSpacing: '2px' }}>
                            {'★'.repeat(review.rating ?? 0)}{'☆'.repeat(5 - (review.rating ?? 0))}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{review.rating?.toFixed(1)}/5</span>
                        </div>
                        {review.comment ? (
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                            "{review.comment.slice(0, 120)}{review.comment.length > 120 ? '...' : ''}"
                          </p>
                        ) : (
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sans commentaire</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        <Link href="/dashboard/events/new" className="btn btn-ghost btn-sm">+ ÉVÉNEMENT</Link>
        <Link href="/dashboard/team" className="btn btn-ghost btn-sm">ÉQUIPE</Link>
        <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">PARAMÈTRES</Link>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  variation,
  accent = false,
}: {
  label: string
  value: string | number
  sub?: string
  variation?: number | null
  accent?: boolean
}) {
  const varColor =
    variation === null || variation === undefined
      ? 'var(--text-muted)'
      : variation > 0
      ? 'var(--success)'
      : variation < 0
      ? 'var(--danger)'
      : 'var(--text-muted)'

  const varSign = variation !== null && variation !== undefined && variation > 0 ? '+' : ''

  return (
    <div style={{ background: accent ? 'var(--violet-dim)' : 'var(--bg-secondary)', padding: '24px 20px' }}>
      <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: accent ? 'var(--violet)' : 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
        {label}
      </p>
      <p style={{ fontSize: '26px', fontFamily: 'Share Tech Mono, monospace', color: accent ? 'var(--violet)' : 'var(--text-primary)', lineHeight: 1, marginBottom: '6px' }}>
        {value}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {sub && (
          <p style={{ fontSize: '10px', color: accent ? 'var(--violet)' : 'var(--text-muted)', opacity: 0.7 }}>
            {sub}
          </p>
        )}
        {variation !== null && variation !== undefined && (
          <span style={{ fontSize: '10px', color: varColor, fontFamily: 'Share Tech Mono, monospace' }}>
            {varSign}{variation}%
          </span>
        )}
      </div>
    </div>
  )
}
