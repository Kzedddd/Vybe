import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('[VYBE] Missing env var: RESEND_API_KEY — emails will not be sent')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// En prod : 'Vybe <noreply@vybe.fr>' (nécessite domaine vérifié sur Resend)
// En dev : adresse Resend de test
export const EMAIL_FROM = process.env.NODE_ENV === 'production'
  ? 'Vybe <noreply@vybe.fr>'
  : 'Vybe <onboarding@resend.dev>'

// ── Email Templates ──────────────────────────────────────────────────────────

/**
 * Base HTML wrapper — Vybe dark theme terminal aesthetic
 */
function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vybe</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #080808;
      color: #e8e8e8;
      font-family: 'Share Tech Mono', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.7;
    }
    .wrapper {
      max-width: 560px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      border-bottom: 1px solid #1e1e1e;
      padding-bottom: 24px;
      margin-bottom: 32px;
      text-align: center;
    }
    .brand {
      font-size: 20px;
      color: #b44fff;
      letter-spacing: 0.3em;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 10px;
      color: #444444;
      letter-spacing: 0.2em;
      margin-top: 4px;
    }
    .content {
      background: #0f0f0f;
      border: 1px solid #1e1e1e;
      padding: 32px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 16px;
      color: #e8e8e8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 16px;
    }
    p {
      color: #888888;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .highlight { color: #e8e8e8; }
    .accent { color: #b44fff; }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      border: 1px solid #b44fff;
      color: #b44fff;
      text-decoration: none;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-top: 20px;
    }
    .divider {
      border: none;
      border-top: 1px solid #1e1e1e;
      margin: 24px 0;
    }
    .qr-box {
      text-align: center;
      background: #141414;
      border: 1px solid #1e1e1e;
      padding: 24px;
      margin: 20px 0;
    }
    .qr-box img {
      width: 200px;
      height: 200px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #1e1e1e;
      font-size: 12px;
    }
    .meta-label { color: #444444; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
    .meta-value { color: #e8e8e8; }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #444444;
      letter-spacing: 0.1em;
      border-top: 1px solid #1e1e1e;
      padding-top: 24px;
    }
    .footer a { color: #444444; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">▶ VYBE</div>
      <div class="brand-sub">// UNDERGROUND EVENTS OS //</div>
    </div>
    ${content}
    <div class="footer">
      <p>VYBE — L'OS DES ORGANISATEURS UNDERGROUND</p>
      <p style="margin-top: 8px;">
        <a href="https://vybe.fr">vybe.fr</a>
        &nbsp;—&nbsp;
        <a href="https://vybe.fr/unsubscribe">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

// ── Template 1 : Confirmation de billet ──────────────────────────────────────

interface TicketConfirmationData {
  buyerName: string
  eventTitle: string
  eventDate: string          // formatted, e.g. "Samedi 15 juin 2026 – 23h00"
  eventLocation: string
  ticketType: string
  quantity: number
  totalAmount: string        // formatted, e.g. "30,00 €"
  qrCodeUrl: string
  orderId: string
}

export function ticketConfirmationTemplate(data: TicketConfirmationData): string {
  return baseTemplate(`
    <div class="content">
      <h1>[ BILLET CONFIRMÉ ]</h1>
      <p class="highlight">// ${data.buyerName}, ton billet est prêt. //</p>

      <hr class="divider">

      <div class="meta-row">
        <span class="meta-label">ÉVÉNEMENT</span>
        <span class="meta-value">${data.eventTitle}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">DATE</span>
        <span class="meta-value">${data.eventDate}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">LIEU</span>
        <span class="meta-value">${data.eventLocation}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">TYPE</span>
        <span class="meta-value">${data.ticketType} × ${data.quantity}</span>
      </div>
      <div class="meta-row" style="border-bottom: none;">
        <span class="meta-label">TOTAL</span>
        <span class="meta-value accent">${data.totalAmount}</span>
      </div>

      <hr class="divider">

      <div class="qr-box">
        <p style="font-size: 10px; color: #444444; letter-spacing: 0.2em; margin-bottom: 16px;">
          // TON QR CODE D'ENTRÉE //
        </p>
        <img src="${data.qrCodeUrl}" alt="QR Code billet" />
        <p style="font-size: 10px; color: #444444; margin-top: 12px; letter-spacing: 0.1em;">
          Présente ce QR code à l'entrée
        </p>
      </div>

      <p style="font-size: 11px; color: #444444;">
        Réf. commande : <span style="color: #888888;">${data.orderId}</span>
      </p>
    </div>

    <div style="text-align: center;">
      <p style="font-size: 11px; color: #444444;">
        // Accède à tous tes billets sur Vybe //
      </p>
      <a href="https://vybe.fr/my/tickets" class="btn">&gt; MES BILLETS &lt;</a>
    </div>
  `)
}

// ── Template 2 : Invitation review post-event ─────────────────────────────────

interface ReviewInvitationData {
  participantName: string
  eventTitle: string
  eventDate: string
  organizerName: string
  reviewUrl: string
}

export function reviewInvitationTemplate(data: ReviewInvitationData): string {
  return baseTemplate(`
    <div class="content">
      <h1>[ COMMENT ÉTAIT LA SOIRÉE ? ]</h1>
      <p class="highlight">// ${data.participantName}, tu étais là. //</p>
      <p>
        Tu as assisté à <span class="highlight">${data.eventTitle}</span> de
        <span class="highlight">${data.organizerName}</span> le ${data.eventDate}.
      </p>
      <p>
        Ton avis aide l'organisateur à progresser — et reste <span class="accent">entièrement privé</span>.
        Pas de notes publiques, pas de TripAdvisor. Juste du feedback utile.
      </p>

      <hr class="divider">

      <p style="font-size: 11px; color: #444444;">
        4 critères : Ambiance / Organisation / Musique / Sécurité<br>
        Commentaire libre optionnel<br>
        2 minutes maximum
      </p>

      <div style="text-align: center;">
        <a href="${data.reviewUrl}" class="btn">&gt; LAISSER MON AVIS &lt;</a>
      </div>
    </div>

    <p style="font-size: 11px; color: #444444; text-align: center;">
      Disponible uniquement pour les participants vérifiés ✓
    </p>
  `)
}

// ── Template 3 : Invitation membre équipe ─────────────────────────────────────

interface TeamInvitationData {
  inviteeName: string
  organizerName: string
  role: string
  inviterName: string
  acceptUrl: string
  expiresAt: string  // e.g. "48 heures"
}

export function teamInvitationTemplate(data: TeamInvitationData): string {
  return baseTemplate(`
    <div class="content">
      <h1>[ INVITATION ÉQUIPE ]</h1>
      <p class="highlight">
        ${data.inviterName} t'invite à rejoindre l'équipe <span class="accent">${data.organizerName}</span>.
      </p>

      <hr class="divider">

      <div class="meta-row">
        <span class="meta-label">COLLECTIF</span>
        <span class="meta-value">${data.organizerName}</span>
      </div>
      <div class="meta-row" style="border-bottom: none;">
        <span class="meta-label">RÔLE</span>
        <span class="meta-value accent">${data.role.toUpperCase()}</span>
      </div>

      <hr class="divider">

      <p style="font-size: 11px; color: #444444;">
        Cette invitation expire dans <span style="color: #888888;">${data.expiresAt}</span>.
        Elle est à usage unique.
      </p>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${data.acceptUrl}" class="btn">&gt; ACCEPTER L'INVITATION &lt;</a>
      </div>
    </div>
  `)
}

// ── Send helpers ──────────────────────────────────────────────────────────────

export async function sendTicketConfirmation(
  to: string,
  data: TicketConfirmationData
) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `✓ Ton billet — ${data.eventTitle}`,
    html: ticketConfirmationTemplate(data),
  })
}

export async function sendReviewInvitation(
  to: string,
  data: ReviewInvitationData
) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `// Comment était ${data.eventTitle} ?`,
    html: reviewInvitationTemplate(data),
  })
}

export async function sendTeamInvitation(
  to: string,
  data: TeamInvitationData
) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `[VYBE] Invitation équipe — ${data.organizerName}`,
    html: teamInvitationTemplate(data),
  })
}
