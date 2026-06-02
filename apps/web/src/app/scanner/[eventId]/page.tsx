import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ScannerClient from './ScannerClient'

export default async function ScannerEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) redirect('/auth/onboarding')

  const { data: event } = await supabase
    .from('events')
    .select('id, title, starts_at, location_name, tickets_sold, total_capacity')
    .eq('id', eventId)
    .eq('organizer_id', organizer.id)
    .single()

  if (!event) notFound()

  return <ScannerClient event={event} />
}
