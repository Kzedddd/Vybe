import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ScannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) redirect('/auth/onboarding')

  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at, location_name, status')
    .eq('organizer_id', organizer.id)
    .in('status', ['published'])
    .order('starts_at', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 32px', maxWidth: '600px', margin: '0 auto' }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>DASHBOARD</Link>
        {' / '}
        <span style={{ color: 'var(--text-secondary)' }}>SCANNER</span>
      </p>

      <h1 style={{ fontSize: '24px', fontWeight: 400, letterSpacing: '0.05em', marginBottom: '8px' }}>
        SCANNER
      </h1>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '40px' }}>
        Sélectionne l'événement à scanner.
      </p>

      {!events || events.length === 0 ? (
        <div style={{ border: '1px solid var(--border-default)', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Aucun événement publié pour le moment.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.map((event) => {
            const startsAt = new Date(event.starts_at)
            const fmtDate = startsAt.toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })

            return (
              <Link
                key={event.id}
                href={`/scanner/${event.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}>
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '0.03em' }}>
                      {event.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {fmtDate} · {event.location_name ?? '—'}
                    </p>
                  </div>
                  <span style={{ fontSize: '16px', color: 'var(--violet)' }}>→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
