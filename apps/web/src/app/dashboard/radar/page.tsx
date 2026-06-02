import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RadarCalendar from './RadarCalendar'

export default async function RadarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name, city')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) redirect('/auth/onboarding')

  // Tous les événements (publiés + brouillons) de tous les organisateurs
  const { data: events } = await supabase
    .from('events')
    .select(`
      id, title, slug, starts_at, ends_at, location_name, city, status,
      organizer:organizers(id, name, genres)
    `)
    .in('status', ['published', 'draft'])
    .order('starts_at', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>DASHBOARD</Link>
        {' / '}
        <span style={{ color: 'var(--text-secondary)' }}>RADAR TERRITORIAL</span>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 400, letterSpacing: '0.05em', marginBottom: '4px' }}>
            RADAR TERRITORIAL
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Tous les événements Vybe — évite les conflits de dates
          </p>
        </div>
      </div>

      <RadarCalendar
        organizerName={organizer.name}
        organizerCity={organizer.city}
        events={(events ?? []).map(e => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          starts_at: e.starts_at,
          ends_at: e.ends_at,
          location_name: e.location_name,
          city: (e as any).city ?? null,
          organizer_name: (e.organizer as any)?.name ?? '—',
          organizer_id: (e.organizer as any)?.id ?? '',
          organizer_genres: (e.organizer as any)?.genres ?? [],
          is_mine: (e.organizer as any)?.id === organizer.id,
          status: e.status,
        }))}
      />
    </div>
  )
}
