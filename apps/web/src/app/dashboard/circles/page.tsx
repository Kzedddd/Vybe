import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateCircleForm from './CreateCircleForm'

export default async function CirclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers').select('id, name').eq('profile_id', user.id).single()
  if (!organizer) redirect('/auth/onboarding')

  const { data: circles } = await supabase
    .from('circles')
    .select('id, name, description, access_type, members_count, is_active, invite_token, created_at')
    .eq('organizer_id', organizer.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>DASHBOARD</Link>
        {' / '}
        <span style={{ color: 'var(--text-secondary)' }}>CERCLES PRIVÉS</span>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 400, letterSpacing: '0.05em', marginBottom: '4px' }}>
            CERCLES PRIVÉS
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Tes communautés sur invitation — événements exclusifs, accès contrôlé
          </p>
        </div>
      </div>

      {/* Création */}
      <CreateCircleForm organizerId={organizer.id} />

      {/* Liste */}
      {circles && circles.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '16px' }}>
            MES CERCLES — {circles.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-default)' }}>
            {circles.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/circles/${c.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  background: 'var(--bg-secondary)',
                  textDecoration: 'none',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                      ◈ {c.name}
                    </span>
                    {!c.is_active && (
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', border: '1px solid var(--border-default)', padding: '1px 6px', letterSpacing: '0.1em' }}>
                        INACTIF
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '18px', color: 'var(--violet)', fontWeight: 400 }}>{c.members_count}</p>
                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>MEMBRES</p>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {circles?.length === 0 && (
        <div style={{ marginTop: '40px', textAlign: 'center', padding: '48px', border: '1px dashed var(--border-default)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            Aucun cercle encore — crée ton premier cercle ci-dessus
          </p>
        </div>
      )}
    </div>
  )
}
