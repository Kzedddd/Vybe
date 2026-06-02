import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StripeConnectButton from './StripeConnectButton'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name, slug, plan, commission_rate, stripe_account_id, stripe_onboarded, city, genres')
    .eq('profile_id', user.id)
    .single()

  if (!organizer) redirect('/auth/onboarding')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  const PLAN_LABELS: Record<string, string> = {
    starter: 'STARTER — 5% de commission',
    pro: 'PRO — 4% de commission',
    scale: 'SCALE — 3% de commission',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '48px 32px',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      {/* Breadcrumb */}
      <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>DASHBOARD</Link>
        {' / '}
        <span style={{ color: 'var(--text-secondary)' }}>PARAMÈTRES</span>
      </p>

      <h1 style={{ fontSize: '24px', fontWeight: 400, letterSpacing: '0.05em', marginBottom: '40px' }}>
        PARAMÈTRES
      </h1>

      {/* Flash stripe=success */}
      {params.stripe === 'success' && (
        <div style={{ border: '1px solid var(--success)', color: 'var(--success)', padding: '12px 20px', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', gap: '8px' }}>
          <span>▸</span>
          <span>STRIPE CONNECTÉ — TU PEUX MAINTENANT ENCAISSER DES PAIEMENTS</span>
        </div>
      )}
      {params.stripe === 'refresh' && (
        <div style={{ border: '1px solid var(--warning)', color: 'var(--warning)', padding: '12px 20px', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', gap: '8px' }}>
          <span>▸</span>
          <span>LE LIEN A EXPIRÉ — RELANCE LA CONNEXION STRIPE</span>
        </div>
      )}

      {/* ── Bloc Stripe Connect ─────────────────────────────────────────────── */}
      <Section label="PAIEMENTS">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Stripe Connect
            </p>
            {organizer.stripe_onboarded ? (
              <>
                <p style={{ fontSize: '11px', color: 'var(--success)', marginBottom: '4px' }}>
                  ✓ Compte connecté — encaissement actif
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Les virements sont effectués chaque lundi.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', lineHeight: 1.6 }}>
                  Connecte ton compte Stripe pour encaisser les ventes de billets.
                  Vybe prend {Math.round(organizer.commission_rate * 100)}% de commission
                  ({PLAN_LABELS[organizer.plan] ?? organizer.plan}).
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Tu seras redirigé vers Stripe pour créer ou connecter ton compte Express.
                  Durée : ~3 minutes.
                </p>
              </>
            )}
          </div>
          <div style={{ flexShrink: 0 }}>
            <StripeConnectButton isOnboarded={organizer.stripe_onboarded} />
          </div>
        </div>
      </Section>

      {/* ── Infos collectif ─────────────────────────────────────────────────── */}
      <Section label="MON COLLECTIF">
        <InfoRow label="NOM" value={organizer.name} />
        <InfoRow label="SLUG" value={`vybe.fr/o/${organizer.slug}`} />
        <InfoRow label="VILLE" value={organizer.city} />
        <InfoRow label="GENRES" value={organizer.genres?.join(', ') ?? '—'} />
        <InfoRow label="PLAN" value={PLAN_LABELS[organizer.plan] ?? organizer.plan} />
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/settings/organizer" className="btn btn-ghost btn-sm">
            MODIFIER LE PROFIL
          </Link>
        </div>
      </Section>

      {/* ── Compte ─────────────────────────────────────────────────────────── */}
      <Section label="MON COMPTE">
        <InfoRow label="EMAIL" value={profile?.email ?? user.email ?? '—'} />
        <InfoRow label="NOM" value={profile?.full_name ?? '—'} />
      </Section>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', paddingBottom: '12px', borderBottom: '1px solid var(--border-default)', marginBottom: '20px' }}>
        {label}
      </p>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', padding: '20px' }}>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
