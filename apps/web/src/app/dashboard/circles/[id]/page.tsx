import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CircleManager from './CircleManager'

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers').select('id, name').eq('profile_id', user.id).single()
  if (!organizer) redirect('/auth/onboarding')

  const { data: circle } = await supabaseAdmin
    .from('circles')
    .select('id, name, description, invite_token, members_count, is_active, created_at')
    .eq('id', id)
    .eq('organizer_id', organizer.id)
    .single()

  if (!circle) notFound()

  // Membres actifs avec leurs profils
  const { data: members } = await supabaseAdmin
    .from('circle_members')
    .select('id, profile_id, status, joined_at, profile:profiles(full_name, email, avatar_url)')
    .eq('circle_id', id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })

  // Anciens acheteurs de l'orga — on passe par holder_id directement
  const { data: ticketHolders } = await supabaseAdmin
    .from('ticket_instances')
    .select('holder_id')
    .eq('organizer_id', organizer.id)
    .eq('status', 'scanned')
    .not('holder_id', 'is', null)
    .limit(200)

  // Dédupliquer les holder_ids et exclure les membres actuels
  const memberIds = new Set((members ?? []).map(m => m.profile_id))
  const uniqueHolderIds = [...new Set((ticketHolders ?? []).map(t => t.holder_id as string))]
    .filter(id => !memberIds.has(id))

  // Fetcher les profils correspondants
  let uniqueBuyers: { id: string; full_name: string | null; email: string }[] = []
  if (uniqueHolderIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', uniqueHolderIds)
    uniqueBuyers = (profiles ?? []).map(p => ({
      id: p.id,
      full_name: (p as any).full_name ?? null,
      email: (p as any).email ?? '',
    }))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteLink = `${baseUrl}/join/${circle.invite_token}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 32px', maxWidth: '900px', margin: '0 auto' }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>DASHBOARD</Link>
        {' / '}
        <Link href="/dashboard/circles" style={{ color: 'var(--text-muted)' }}>CERCLES</Link>
        {' / '}
        <span style={{ color: 'var(--text-secondary)' }}>{circle.name.toUpperCase()}</span>
      </p>

      <CircleManager
        circle={circle as any}
        inviteLink={inviteLink}
        members={(members ?? []).map(m => ({
          id: m.id,
          profile_id: m.profile_id,
          full_name: (m.profile as any)?.full_name ?? null,
          email: (m.profile as any)?.email ?? '—',
          joined_at: m.joined_at,
        }))}
        buyers={uniqueBuyers}
        organizerName={organizer.name}
      />
    </div>
  )
}
