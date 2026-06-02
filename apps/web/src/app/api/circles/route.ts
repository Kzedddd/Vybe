import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: organizer } = await supabase
    .from('organizers').select('id').eq('profile_id', user.id).single()
  if (!organizer) return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 403 })

  const { name, description } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nom obligatoire' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('circles').insert({
    organizer_id: organizer.id,
    name: name.trim(),
    description: description ?? null,
    access_type: 'invite_only',
    is_active: true,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: (data as any).id })
}
