import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/scanner/validate
// Body: { qr_hash: string, event_id: string }
export async function POST(req: NextRequest) {
  const supabase = getAdminClient()

  // Vérifier que c'est bien un organisateur authentifié
  const authClient = await import('@/lib/supabase/server').then(m => m.createClient())
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { qr_hash, event_id } = body

  if (!qr_hash || !event_id) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  // Vérifier que l'organisateur possède cet événement
  const { data: organizer } = await authClient
    .from('organizers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) {
    return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 403 })
  }

  const { data: event } = await authClient
    .from('events')
    .select('id, title')
    .eq('id', event_id)
    .eq('organizer_id', organizer.id)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Événement non autorisé' }, { status: 403 })
  }

  // Chercher le billet par qr_hash
  const { data: ticket } = await supabase
    .from('ticket_instances')
    .select('id, status, holder_name, holder_email, ticket_type_id, ticket_types(name)')
    .eq('qr_hash', qr_hash)
    .eq('event_id', event_id)
    .single()

  if (!ticket) {
    return NextResponse.json({
      valid: false,
      reason: 'BILLET INTROUVABLE',
      code: 'not_found',
    }, { status: 200 })
  }

  if (ticket.status === 'scanned') {
    return NextResponse.json({
      valid: false,
      reason: 'BILLET DÉJÀ SCANNÉ',
      code: 'already_used',
      holder: ticket.holder_name ?? ticket.holder_email,
    }, { status: 200 })
  }

  if (ticket.status === 'cancelled') {
    return NextResponse.json({
      valid: false,
      reason: 'BILLET ANNULÉ',
      code: 'cancelled',
    }, { status: 200 })
  }

  // Marquer comme utilisé
  const { error: updateError } = await supabase
    .from('ticket_instances')
    .update({ status: 'scanned', scanned_at: new Date().toISOString() })
    .eq('id', ticket.id)

  if (updateError) {
    console.error('[scanner] Erreur update:', updateError)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  const ticketType = ticket.ticket_types as any

  // Déclencher le calcul AIS en arrière-plan (non bloquant)
  const { data: fullTicket } = await supabase
    .from('ticket_instances')
    .select('holder_id, organizer_id')
    .eq('id', ticket.id)
    .single()

  if (fullTicket?.holder_id && fullTicket?.organizer_id) {
    supabase.rpc('calculate_ais', {
      p_organizer_id: fullTicket.organizer_id,
      p_participant_id: fullTicket.holder_id,
    }).then(({ error }) => {
      if (error) console.error('[scanner] AIS calc error:', error.message)
    })
  }

  return NextResponse.json({
    valid: true,
    reason: 'BILLET VALIDE',
    code: 'valid',
    holder: ticket.holder_name ?? ticket.holder_email ?? 'Participant',
    ticket_type: ticketType?.name ?? '',
  }, { status: 200 })
}
