import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: organizer } = await supabase
    .from('organizers').select('id, name').eq('profile_id', user.id).single()
  if (!organizer) return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 403 })

  const body = await req.json()
  const { starts_at, city, location_name, lineup } = body

  if (!starts_at || !city) {
    return NextResponse.json({ error: 'Date et ville sont obligatoires' }, { status: 400 })
  }

  const slug = `radar-${organizer.id.slice(0, 8)}-${Date.now()}`

  // Admin client pour bypasser RLS — l'auth est déjà vérifiée ci-dessus
  const { data, error } = await supabaseAdmin.from('events').insert({
    title: organizer.name,
    slug,
    starts_at,
    city,
    location_name: location_name || null,
    description: lineup ? `LINE UP :\n${lineup}` : null,
    organizer_id: organizer.id,
    status: 'draft',
    total_capacity: 0,
    visibility: 'public',
  }).select('id').single()

  if (error) {
    console.error('[radar/slots] INSERT ERROR:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: (data as any).id })
}
