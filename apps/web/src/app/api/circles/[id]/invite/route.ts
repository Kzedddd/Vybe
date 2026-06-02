import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resend, EMAIL_FROM } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: circleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: organizer } = await supabase
    .from('organizers').select('id, name').eq('profile_id', user.id).single()
  if (!organizer) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data: circle } = await supabaseAdmin
    .from('circles')
    .select('id, name, invite_token')
    .eq('id', circleId)
    .eq('organizer_id', organizer.id)
    .single()
  if (!circle) return NextResponse.json({ error: 'Cercle introuvable' }, { status: 404 })

  const body = await req.json()
  console.log('[invite] body:', JSON.stringify(body))
  const { profileIds } = body
  if (!Array.isArray(profileIds) || profileIds.length === 0) {
    return NextResponse.json({ error: 'Aucun destinataire' }, { status: 400 })
  }

  // Récupérer les emails + noms
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', profileIds)

  console.log('[invite] profiles:', profiles?.length, 'error:', profilesError?.message)
  if (!profiles?.length) return NextResponse.json({ error: 'Profils introuvables' }, { status: 400 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const joinUrl = `${baseUrl}/join/${circle.invite_token}`

  console.log('[invite] circle:', circle.id, 'profiles:', profiles.length, 'joinUrl:', joinUrl)

  let success = 0
  let errors = 0

  // Créer les notifications in-app + envoyer les emails
  for (const profile of profiles) {
    try {
      // Notification in-app
      await supabaseAdmin.from('notifications').insert({
        profile_id: profile.id,
        type: 'circle_invite',
        title: `${organizer.name} t'invite dans son cercle privé`,
        body: `Tu es invité(e) à rejoindre "${circle.name}". Clique pour accéder aux événements exclusifs.`,
        data: { circle_id: circleId, organizer_name: organizer.name },
        action_url: joinUrl,
      })

      // Email
      await resend.emails.send({
        from: EMAIL_FROM,
        to: profile.email,
        subject: `[VYBE] ${organizer.name} t'invite dans son cercle privé`,
        html: circleInviteEmailTemplate({
          recipientName: profile.full_name ?? profile.email,
          organizerName: organizer.name,
          circleName: circle.name,
          joinUrl,
        }),
      })

      success++
    } catch (err) {
      console.error('[invite] error for', profile.email, err)
      errors++
    }
  }

  return NextResponse.json({ success, errors })
}

function circleInviteEmailTemplate({
  recipientName,
  organizerName,
  circleName,
  joinUrl,
}: {
  recipientName: string
  organizerName: string
  circleName: string
  joinUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #080808; color: #e8e8e8; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.7; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .header { border-bottom: 1px solid #1e1e1e; padding-bottom: 24px; margin-bottom: 32px; text-align: center; }
    .brand { font-size: 20px; color: #b44fff; letter-spacing: 0.3em; }
    .brand-sub { font-size: 10px; color: #444; letter-spacing: 0.2em; margin-top: 4px; }
    .content { background: #0f0f0f; border: 1px solid #1e1e1e; padding: 32px; margin-bottom: 24px; }
    h1 { font-size: 15px; color: #e8e8e8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; }
    p { color: #888; font-size: 12px; margin-bottom: 12px; }
    .highlight { color: #e8e8e8; }
    .accent { color: #b44fff; }
    .circle-box { border: 1px solid #b44fff; padding: 20px; margin: 20px 0; text-align: center; }
    .btn { display: inline-block; padding: 14px 32px; background: #b44fff; color: #fff; text-decoration: none; font-family: 'Courier New', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 20px; }
    .footer { text-align: center; font-size: 10px; color: #444; border-top: 1px solid #1e1e1e; padding-top: 24px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">▶ VYBE</div>
      <div class="brand-sub">// UNDERGROUND EVENTS OS //</div>
    </div>
    <div class="content">
      <h1>[ INVITATION CERCLE PRIVÉ ]</h1>
      <p class="highlight">// ${recipientName}, tu es sur la liste. //</p>
      <p>
        <span class="accent">${organizerName}</span> t'invite à rejoindre son cercle privé sur Vybe.
        Tu auras accès en avant-première à ses événements exclusifs.
      </p>
      <div class="circle-box">
        <p style="font-size: 10px; color: #444; letter-spacing: 0.15em; margin-bottom: 8px;">CERCLE</p>
        <p style="font-size: 18px; color: #b44fff; letter-spacing: 0.05em;">◈ ${circleName}</p>
        <p style="font-size: 10px; color: #444; margin-top: 8px; margin-bottom: 0;">par ${organizerName}</p>
      </div>
      <p style="font-size: 11px; color: #444;">
        Ce lien est personnel — il te donne accès direct sans code ni validation.
      </p>
      <div style="text-align: center;">
        <a href="${joinUrl}" class="btn">&gt; REJOINDRE LE CERCLE &lt;</a>
      </div>
    </div>
    <div class="footer">
      <p>VYBE — L'OS DES ORGANISATEURS UNDERGROUND</p>
      <p style="margin-top: 8px;"><a href="https://vybe.fr" style="color: #444;">vybe.fr</a></p>
    </div>
  </div>
</body>
</html>`
}
