import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST /api/badges/calculate-event
// Body: { event_id: string }
// Déclenché manuellement depuis le dashboard ou via cron J+14 après clôture
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { event_id } = await req.json()
  if (!event_id) return NextResponse.json({ error: 'event_id requis' }, { status: 400 })

  // Vérifier que l'événement appartient à cet organisateur
  const { data: organizer } = await supabase
    .from('organizers').select('id').eq('profile_id', user.id).single()
  if (!organizer) return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 403 })

  const { data: event } = await supabase
    .from('events').select('id').eq('id', event_id).eq('organizer_id', organizer.id).single()
  if (!event) return NextResponse.json({ error: 'Événement non autorisé' }, { status: 403 })

  const { error } = await supabaseAdmin.rpc('calculate_event_badges', { p_event_id: event_id })
  if (error) {
    console.error('[badges/event] ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Récupérer les badges gagnés
  const { data: badges } = await supabaseAdmin
    .from('organizer_badges')
    .select('badge_type, earned_at')
    .eq('event_id', event_id)

  return NextResponse.json({ success: true, badges })
}
