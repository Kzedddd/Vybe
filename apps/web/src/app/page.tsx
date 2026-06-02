import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)", minHeight: "100vh" }}>

      {/* Ticker */}
      <div style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-default)",
        padding: "10px 0",
        overflow: "hidden",
      }}>
        <div className="ticker-content" style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.2em" }}>
          ▶ UPCOMING EVENTS &nbsp;◀&nbsp; CASA&nbsp;//&nbsp;RABAT&nbsp;//&nbsp;PARIS&nbsp;//&nbsp;AMSTERDAM&nbsp;//&nbsp;BERLIN&nbsp;//&nbsp;LONDON&nbsp;//&nbsp;BARCELONA &nbsp;▶ UPCOMING EVENTS &nbsp;◀&nbsp; CASA&nbsp;//&nbsp;RABAT&nbsp;//&nbsp;PARIS&nbsp;//&nbsp;AMSTERDAM&nbsp;//&nbsp;BERLIN&nbsp;//&nbsp;LONDON&nbsp;//&nbsp;BARCELONA
        </div>
      </div>

      {/* Hero */}
      <section style={{
        minHeight: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        borderBottom: "1px solid var(--border-default)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(180, 79, 255, 0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: "800px", textAlign: "center", position: "relative", zIndex: 2 }}>

          {/* ASCII decoration */}
          <pre style={{
            fontSize: "10px",
            lineHeight: "1.2",
            color: "var(--violet)",
            marginBottom: "40px",
            opacity: 0.4,
            userSelect: "none",
          }}>
{`██╗   ██╗██╗   ██╗██████╗ ███████╗
██║   ██║╚██╗ ██╔╝██╔══██╗██╔════╝
██║   ██║ ╚████╔╝ ██████╔╝█████╗
╚██╗ ██╔╝  ╚██╔╝  ██╔══██╗██╔══╝
 ╚████╔╝    ██║   ██████╔╝███████╗
  ╚═══╝     ╚═╝   ╚═════╝ ╚══════╝`}
          </pre>

          <div style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.4em",
            marginBottom: "24px",
            textTransform: "uppercase",
          }}>
            ▶ UNDERGROUND EVENTS OS ◀
          </div>

          <h1 style={{
            fontSize: "40px",
            color: "var(--text-primary)",
            marginBottom: "8px",
            letterSpacing: "0.05em",
          }}>
            POS<span style={{ color: "var(--violet)" }}>SÈDE</span> TON AUDIENCE.
          </h1>
          <h2 style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            fontWeight: 400,
            marginBottom: "32px",
            letterSpacing: "0.15em",
          }}>
            SUR SHOTGUN, TU LOUES TON AUDIENCE. SUR VYBE, TU LA POSSÈDES.
          </h2>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/events" className="btn btn-primary btn-lg">
              &gt; EXPLORER LES EVENTS &lt;
            </Link>
            {!user && (
              <Link href="/auth/register" className="btn btn-ghost btn-lg">
                &gt; CRÉER UN COMPTE
              </Link>
            )}
            {user && (
              <Link href="/dashboard" className="btn btn-ghost btn-lg">
                &gt; DASHBOARD
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features — 3 piliers */}
      <section style={{
        padding: "80px 24px",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-default)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.3em", marginBottom: "12px" }}>
              // LES 3 PILIERS VYBE
            </p>
            <h2 style={{ fontSize: "24px" }}>[ POURQUOI VYBE ]</h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1px",
            border: "1px solid var(--border-default)",
          }}>
            <PilierCard
              number="01"
              title="PROPRIÉTÉ DES DONNÉES"
              description="Ton audience t'appartient. Exporte tout à tout moment. Si tu pars, tu emportes tes fans avec toi."
              tag="DIFFÉRENCIANT"
            />
            <PilierCard
              number="02"
              title="INTELLIGENCE COMPORTEMENTALE"
              description="Sais qui sont tes vrais fans. Audience Intelligence Score, badges privés, analytics post-event."
              tag="EXCLUSIF"
            />
            <PilierCard
              number="03"
              title="ÉCOSYSTÈME COLLABORATIF"
              description="Radar Territorial, réseau d'organisateurs, annuaire prestataires. La scène tourne mieux ensemble."
              tag="INÉDIT"
            />
          </div>
        </div>
      </section>

      {/* Features liste */}
      <section style={{ padding: "80px 24px", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.3em", marginBottom: "12px" }}>
              // FEATURES V1
            </p>
            <h2 style={{ fontSize: "24px" }}>[ L&apos;OS COMPLET ]</h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}>
            {features.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "80px 24px",
        textAlign: "center",
        background: "var(--bg-secondary)",
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.3em", marginBottom: "16px" }}>
            // READY TO OWN YOUR AUDIENCE
          </p>
          <h2 style={{ fontSize: "28px", marginBottom: "12px" }}>
            [ REJOINS VYBE ]
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "40px", lineHeight: "1.8" }}>
            Commission dégressive à partir de 5%. Tes données, ta plateforme.
          </p>
          {!user ? (
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/auth/register" className="btn btn-primary btn-lg">
                &gt; DÉMARRER GRATUITEMENT
              </Link>
              <Link href="/events" className="btn btn-ghost btn-lg">
                &gt; VOIR LES EVENTS
              </Link>
            </div>
          ) : (
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              &gt; ACCÉDER AU DASHBOARD
            </Link>
          )}
        </div>
      </section>

      {/* Footer mini */}
      <footer style={{
        padding: "24px",
        borderTop: "1px solid var(--border-default)",
        textAlign: "center",
        fontSize: "10px",
        color: "var(--text-muted)",
        letterSpacing: "0.2em",
      }}>
        VYBE © 2026 — L&apos;OS DES ORGANISATEURS UNDERGROUND
      </footer>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PilierCard({
  number,
  title,
  description,
  tag,
}: {
  number: string;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        padding: "40px 32px",
        borderRight: "1px solid var(--border-default)",
        transition: "background 0.2s",
      }}
    >
      <div style={{ fontSize: "10px", color: "var(--violet)", letterSpacing: "0.3em", marginBottom: "8px" }}>
        {number} — <span style={{ color: "var(--text-muted)" }}>{tag}</span>
      </div>
      <h3 style={{ fontSize: "14px", marginBottom: "16px", letterSpacing: "0.1em" }}>
        {title}
      </h3>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card" style={{ padding: "28px 24px" }}>
      <div style={{ fontSize: "20px", marginBottom: "12px" }}>{icon}</div>
      <h3 style={{ fontSize: "12px", marginBottom: "10px", color: "var(--text-primary)", letterSpacing: "0.1em" }}>
        {title}
      </h3>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
        {description}
      </p>
    </div>
  );
}

const features = [
  { icon: "🎫", title: "BILLETTERIE COMPLÈTE", description: "Types multiples, early bird, VIP, staff. Achat connecté ou guest." },
  { icon: "📊", title: "AUDIENCE INTELLIGENCE", description: "Score AIS privé par participant. VIP Gold, Habitués, À risque." },
  { icon: "🔒", title: "CERCLES PRIVÉS", description: "Events secrets sans Telegram. Contrôle total des accès et de la diffusion." },
  { icon: "🗺️", title: "RADAR TERRITORIAL", description: "Calendrier partagé inter-organisateurs. Fini les conflits de dates." },
  { icon: "📡", title: "BROADCAST SEGMENTÉ", description: "Communique par badge, présence, géo. Taux de conversion 3× supérieur." },
  { icon: "👥", title: "VYBE CERCLE", description: "Gestion d'équipe avec rôles précis. Owner, Admin, Billetterie." },
  { icon: "⭐", title: "REVIEWS VÉRIFIÉES", description: "Avis uniquement si billet scanné. Badge de crédibilité public." },
  { icon: "📱", title: "SCANNER OFFLINE", description: "Check-in sans réseau. Sync auto quand le réseau revient." },
];
