import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ReviewForm from './ReviewForm'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/events/${slug}/review`)

  const { data: event } = await supabase
    .from('events')
    .select('id, title, starts_at, cover_url, organizer:organizers(name)')
    .eq('slug', slug)
    .single()

  if (!event) notFound()

  // Vérifier que l'utilisateur a un billet scanné
  const { data: ticket } = await supabase
    .from('ticket_instances')
    .select('id')
    .eq('event_id', event.id)
    .eq('holder_id', user.id)
    .eq('status', 'scanned')
    .limit(1)
    .single()

  if (!ticket) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>✗</p>
          <p style={{ fontSize: '12px', color: 'var(--danger)', letterSpacing: '0.1em', marginBottom: '8px' }}>ACCÈS REFUSÉ</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tu dois avoir un billet pour cet événement pour laisser une review.</p>
        </div>
      </div>
    )
  }

  // Vérifier s'il a déjà reviewé
  const { data: existing } = await supabase
    .from('reviews')
    .select('id, rating, comment')
    .eq('event_id', event.id)
    .eq('reviewer_id', user.id)
    .single()

  const organizer = event.organizer as any

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* Event info */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          {event.cover_url && (
            <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', overflow: 'hidden' }}>
              <img
                src={event.cover_url}
                alt={event.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
          <h1 style={{ fontSize: '20px', fontWeight: 400, letterSpacing: '0.04em', marginBottom: '4px' }}>
            {event.title}
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>par {organizer?.name}</p>
        </div>

        {existing ? (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', marginBottom: '12px' }}>
              {'★'.repeat(existing.rating)}{'☆'.repeat(5 - existing.rating)}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--success)', letterSpacing: '0.1em', marginBottom: '8px' }}>REVIEW DÉJÀ SOUMISE</p>
            {existing.comment && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{existing.comment}"</p>
            )}
          </div>
        ) : (
          <ReviewForm eventId={event.id} eventSlug={slug} />
        )}
      </div>
    </div>
  )
}
