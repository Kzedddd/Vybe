import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { organizer_id, participant_id } = await req.json()
  if (!organizer_id || !participant_id) {
    return NextResponse.json({ error: 'organizer_id et participant_id requis' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.rpc('calculate_ais', {
    p_organizer_id: organizer_id,
    p_participant_id: participant_id,
  })

  if (error) {
    console.error('[ais/calculate] ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Retourner le score calculé
  const { data: score } = await supabaseAdmin
    .from('participant_scores')
    .select('score, badge, attendance_rate, recurrence_count, reviews_count')
    .eq('organizer_id', organizer_id)
    .eq('participant_id', participant_id)
    .single()

  return NextResponse.json({ success: true, score })
}
