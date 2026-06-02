import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

  const { data: circle } = await supabaseAdmin
    .from('circles')
    .select('id, is_active, members_count')
    .eq('invite_token', token)
    .single()

  if (!circle || !circle.is_active) {
    return NextResponse.json({ error: 'Lien invalide ou cercle inactif' }, { status: 404 })
  }

  // Vérifier si déjà membre
  const { data: existing } = await supabaseAdmin
    .from('circle_members')
    .select('id, status')
    .eq('circle_id', circle.id)
    .eq('profile_id', user.id)
    .single()

  if (existing?.status === 'active') {
    return NextResponse.json({ message: 'Déjà membre' })
  }

  if (existing) {
    // Réactiver si removed
    await supabaseAdmin
      .from('circle_members')
      .update({ status: 'active', joined_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabaseAdmin.from('circle_members').insert({
      circle_id: circle.id,
      profile_id: user.id,
      status: 'active',
      invited_by: null,
    })

    // Incrémenter members_count
    await supabaseAdmin
      .from('circles')
      .update({ members_count: circle.members_count + 1 })
      .eq('id', circle.id)
  }

  return NextResponse.json({ success: true })
}
