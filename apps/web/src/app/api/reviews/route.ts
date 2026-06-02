import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ReviewSchema = z.object({
  event_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  rating_programmation: z.number().int().min(1).max(5).optional(),
  rating_son_scene: z.number().int().min(1).max(5).optional(),
  rating_organisation: z.number().int().min(1).max(5).optional(),
  rating_ambiance: z.number().int().min(1).max(5).optional(),
  rating_qualite_prix: z.number().int().min(1).max(5).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const parsed = ReviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { event_id, rating, comment, rating_programmation, rating_son_scene, rating_organisation, rating_ambiance, rating_qualite_prix } = parsed.data

  const { data: event } = await supabase
    .from('events').select('id, organizer_id').eq('id', event_id).single()
  if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

  // Vérifier que l'utilisateur a un billet
  const { data: ticket } = await supabase
    .from('ticket_instances').select('id')
    .eq('event_id', event_id).eq('holder_id', user.id).limit(1).single()
  if (!ticket) return NextResponse.json({ error: 'Tu dois avoir un billet pour noter cet événement' }, { status: 403 })
  const ticketInstanceId = ticket.id

  const { data: existing } = await supabase
    .from('reviews').select('id')
    .eq('event_id', event_id).eq('reviewer_id', user.id).single()
  if (existing) return NextResponse.json({ error: 'Tu as déjà noté cet événement' }, { status: 409 })

  const { error } = await supabase.from('reviews').insert({
    event_id,
    organizer_id: event.organizer_id,
    reviewer_id: user.id,
    ticket_instance_id: ticketInstanceId,
    rating,
    comment: comment ?? null,
    rating_programmation: rating_programmation ?? null,
    rating_son_scene: rating_son_scene ?? null,
    rating_organisation: rating_organisation ?? null,
    rating_ambiance: rating_ambiance ?? null,
    rating_qualite_prix: rating_qualite_prix ?? null,
    // Anciennes colonnes NOT NULL — valeur neutre
    score_ambiance: rating,
    score_organisation: rating,
    score_musique: rating,
    score_securite: rating,
    is_visible: true,
  })

  if (error) {
    console.error('[reviews] INSERT ERROR:', JSON.stringify(error))
    return NextResponse.json({ error: error.message ?? 'Erreur serveur' }, { status: 500 })
  }

  // Recalculer AIS en arrière-plan
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  supabaseAdmin.rpc('calculate_ais', {
    p_organizer_id: event.organizer_id,
    p_participant_id: user.id,
  }).then(({ error: aisErr }) => {
    if (aisErr) console.error('[reviews] AIS calc error:', aisErr.message)
  })

  return NextResponse.json({ success: true })
}
