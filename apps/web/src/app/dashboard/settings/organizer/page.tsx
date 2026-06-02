import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileEditor from './ProfileEditor'

export default async function OrganizerProfileSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name, slug, city, genres, bio, logo_url, banner_url, media, badge')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) redirect('/auth/onboarding')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 32px', maxWidth: '760px', margin: '0 auto' }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>DASHBOARD</Link>
        {' / '}
        <Link href="/dashboard/settings" style={{ color: 'var(--text-muted)' }}>PARAMÈTRES</Link>
        {' / '}
        <span style={{ color: 'var(--text-secondary)' }}>PROFIL COLLECTIF</span>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 400, letterSpacing: '0.05em' }}>
          PROFIL COLLECTIF
        </h1>
        <Link
          href={`/o/${organizer.slug}`}
          target="_blank"
          style={{
            fontSize: '10px', letterSpacing: '0.12em', color: 'var(--violet)',
            textDecoration: 'none', border: '1px solid var(--violet)', padding: '6px 14px',
          }}
        >
          → VOIR MON PROFIL
        </Link>
      </div>

      <ProfileEditor organizer={organizer} userId={user.id} />
    </div>
  )
}
