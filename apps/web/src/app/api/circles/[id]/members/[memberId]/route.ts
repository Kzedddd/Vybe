import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: circleId, memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: organizer } = await supabase
    .from('organizers').select('id').eq('profile_id', user.id).single()
  if (!organizer) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // Vérifier que le cercle appartient bien à cet orga
  const { data: circle } = await supabase
    .from('circles').select('id').eq('id', circleId).eq('organizer_id', organizer.id).single()
  if (!circle) return NextResponse.json({ error: 'Cercle introuvable' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('circle_members')
    .update({ status: 'removed' })
    .eq('id', memberId)
    .eq('circle_id', circleId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
