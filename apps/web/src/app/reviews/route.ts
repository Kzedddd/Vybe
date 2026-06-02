import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ReviewSchema = z.object({
  event_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const parsed = ReviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { event_id, rating, comment } = parsed.data

  const { data: event } = await supabase
    .from('events').select('id, organizer_id').eq('id', event_id).single()
  if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

  const { data: ticket } = await supabase
    .from('ticket_instances').select('id')
    .eq('event_id', event_id).eq('holder_id', user.id).limit(1).single()
  if (!ticket) return NextResponse.json({ error: 'Tu dois avoir un billet pour noter cet événement' }, { status: 403 })

  const { data: existing } = await supabase
    .from('reviews').select('id')
    .eq('event_id', event_id).eq('reviewer_id', user.id).single()
  if (existing) return NextResponse.json({ error: 'Tu as déjà noté cet événement' }, { status: 409 })

  const { error } = await supabase.from('reviews').insert({
    event_id,
    organizer_id: event.organizer_id,
    reviewer_id: user.id,
    rating,
    comment: comment ?? null,
    is_visible: true,
  })

  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })

  return NextResponse.json({ success: true })
}