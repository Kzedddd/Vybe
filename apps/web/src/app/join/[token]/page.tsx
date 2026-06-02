import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import JoinButton from './JoinButton'

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Pas connecté → login puis retour ici
  if (!user) redirect(`/auth/login?next=/join/${token}`)

  // Trouver le cercle via le token (admin pour bypasser RLS)
  const { data: circle } = await supabaseAdmin
    .from('circles')
    .select('id, name, description, is_active, organizer:organizers(name, slug)')
    .eq('invite_token', token)
    .single()

  if (!circle || !circle.is_active) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>✗</p>
          <p style={{ fontSize: '12px', color: 'var(--danger)', letterSpacing: '0.1em', marginBottom: '8px' }}>LIEN INVALIDE</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ce lien d'invitation n'existe plus ou a expiré.</p>
        </div>
      </div>
    )
  }

  const organizer = circle.organizer as any

  // Vérifier si déjà membre
  const { data: existing } = await supabaseAdmin
    .from('circle_members')
    .select('id, status')
    .eq('circle_id', circle.id)
    .eq('profile_id', user.id)
    .single()

  const alreadyMember = existing?.status === 'active'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '8px' }}>
            INVITATION CERCLE PRIVÉ
          </p>
          <div style={{ fontSize: '32px', color: 'var(--violet)', marginBottom: '16px' }}>◈</div>
          <h1 style={{ fontSize: '22px', fontWeight: 400, letterSpacing: '0.05em', marginBottom: '6px' }}>
            {circle.name.toUpperCase()}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>par {organizer?.name}</p>
        </div>

        {circle.description && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', lineHeight: 1.6 }}>
            {circle.description}
          </p>
        )}

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '32px' }}>
          {alreadyMember ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '24px', marginBottom: '12px' }}>✓</p>
              <p style={{ fontSize: '11px', color: 'var(--success)', letterSpacing: '0.12em', marginBottom: '8px' }}>
                TU ES DÉJÀ MEMBRE
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Tu as déjà accès à tous les événements exclusifs de ce cercle.
              </p>
              <a
                href="/events"
                style={{
                  display: 'inline-block', padding: '12px 28px',
                  background: 'var(--violet)', color: '#fff', textDecoration: 'none',
                  fontFamily: 'inherit', fontSize: '11px', letterSpacing: '0.12em',
                }}
              >
                VOIR LES ÉVÉNEMENTS →
              </a>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                En rejoignant ce cercle, tu accéderas aux événements exclusifs de{' '}
                <span style={{ color: 'var(--text-primary)' }}>{organizer?.name}</span> en avant-première.
              </p>
              <JoinButton circleId={circle.id} token={token} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
