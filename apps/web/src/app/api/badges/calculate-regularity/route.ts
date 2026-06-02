import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST /api/badges/calculate-regularity
// Recalcule les badges de régularité de l'organisateur connecté
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: organizer } = await supabase
    .from('organizers').select('id').eq('profile_id', user.id).single()
  if (!organizer) return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 403 })

  const { error } = await supabaseAdmin.rpc('calculate_regularity_badges', {
    p_organizer_id: organizer.id,
  })
  if (error) {
    console.error('[badges/regularity] ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: badges } = await supabaseAdmin
    .from('organizer_badges')
    .select('badge_type, earned_at')
    .eq('organizer_id', organizer.id)
    .eq('badge_category', 'regularity')

  return NextResponse.json({ success: true, badges })
}
