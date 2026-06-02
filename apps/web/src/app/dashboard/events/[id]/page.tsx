import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EventActions from "./EventActions";

const STATUS_LABELS: Record<string, string> = {
  draft: "BROUILLON",
  published: "PUBLIÉ",
  cancelled: "ANNULÉ",
  completed: "TERMINÉ",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--text-muted)",
  published: "var(--success)",
  cancelled: "var(--danger)",
  completed: "var(--text-secondary)",
};

const TICKET_TYPE_LABELS: Record<string, string> = {
  standard: "STANDARD",
  vip: "VIP",
  staff: "STAFF",
  press: "PRESSE",
  guestlist: "GUESTLIST",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!organizer) redirect("/auth/onboarding");

  // Fetch event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("organizer_id", organizer.id)
    .single();

  if (!event) notFound();

  // Fetch ticket types with sales
  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("event_id", id)
    .order("sort_order");

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, buyer_name, buyer_email, total_amount, status, created_at")
    .eq("event_id", id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(10);

  const tickets = ticketTypes ?? [];
  const orders = recentOrders ?? [];

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0) / 100;
  const fillRate =
    event.total_capacity > 0
      ? Math.round((event.tickets_sold / event.total_capacity) * 100)
      : 0;

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEur = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "48px 32px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      {/* Breadcrumb */}
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.2em",
          color: "var(--text-muted)",
          marginBottom: "24px",
        }}
      >
        <Link href="/dashboard" style={{ color: "var(--text-muted)" }}>DASHBOARD</Link>
        {" / "}
        <Link href="/dashboard/events" style={{ color: "var(--text-muted)" }}>ÉVÉNEMENTS</Link>
        {" / "}
        <span style={{ color: "var(--text-secondary)" }}>{event.title.toUpperCase()}</span>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: "32px",
          alignItems: "start",
        }}
      >
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div>
          {/* Cover */}
          {event.cover_url && (
            <div
              style={{
                marginBottom: "24px",
                border: "1px solid var(--border-default)",
                overflow: "hidden",
              }}
            >
              <img
                src={event.cover_url}
                alt={event.title}
                style={{
                  width: "100%",
                  maxHeight: "320px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}

          {/* Title + status */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "8px",
              }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 400,
                  letterSpacing: "0.05em",
                }}
              >
                {event.title}
              </h1>
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  color: STATUS_COLORS[event.status] ?? "var(--text-muted)",
                }}
              >
                {STATUS_LABELS[event.status] ?? event.status.toUpperCase()}
              </span>
            </div>
            {event.description && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {event.description}
              </p>
            )}
          </div>

          {/* Info grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              background: "var(--border-default)",
              border: "1px solid var(--border-default)",
              marginBottom: "32px",
            }}
          >
            <InfoBlock label="DÉBUT" value={formatDate(event.starts_at)} />
            <InfoBlock label="FIN" value={formatDate(event.ends_at)} />
            <InfoBlock label="OUVERTURE PORTES" value={formatDate(event.doors_open_at)} />
            <InfoBlock label="LIEU" value={event.location_name} sub={event.location_address} />
            <InfoBlock
              label="CAPACITÉ"
              value={`${event.tickets_sold} / ${event.total_capacity}`}
              sub={`${fillRate}% de remplissage`}
            />
            <InfoBlock
              label="VISIBILITÉ"
              value={event.visibility === "public" ? "PUBLIC" : "CERCLE PRIVÉ"}
            />
          </div>

          {/* Fill rate bar */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  color: "var(--text-muted)",
                }}
              >
                TAUX DE REMPLISSAGE
              </span>
              <span
                style={{
                  fontSize: "10px",
                  color:
                    fillRate > 80
                      ? "var(--success)"
                      : fillRate > 40
                      ? "var(--violet)"
                      : "var(--text-muted)",
                }}
              >
                {fillRate}%
              </span>
            </div>
            <div
              style={{
                height: "3px",
                background: "var(--border-default)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${fillRate}%`,
                  background:
                    fillRate > 80
                      ? "var(--success)"
                      : fillRate > 40
                      ? "var(--violet)"
                      : "var(--text-muted)",
                  transition: "width 0.4s",
                }}
              />
            </div>
          </div>

          {/* Ticket types */}
          <div style={{ marginBottom: "32px" }}>
            <p
              style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "var(--text-muted)",
                marginBottom: "12px",
              }}
            >
              BILLETTERIE
            </p>
            {tickets.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Aucun type de billet défini
              </p>
            ) : (
              <div
                style={{
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-secondary)",
                }}
              >
                {tickets.map((t, i) => {
                  const sold = t.quantity_sold ?? 0;
                  const total = t.quantity_total ?? 0;
                  const rate = total > 0 ? Math.round((sold / total) * 100) : 0;

                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: "16px 20px",
                        borderBottom:
                          i < tickets.length - 1
                            ? "1px solid var(--border-default)"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text-primary)",
                              marginBottom: "2px",
                            }}
                          >
                            {t.name}
                          </p>
                          <p
                            style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {TICKET_TYPE_LABELS[t.type] ?? t.type} —{" "}
                            {sold} / {total} vendus ({rate}%)
                          </p>
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            color: t.is_free ? "var(--success)" : "var(--text-primary)",
                            fontFamily: "'Share Tech Mono', monospace",
                          }}
                        >
                          {t.is_free ? "GRATUIT" : formatEur(t.price / 100)}
                        </p>
                      </div>
                      {/* Mini fill bar */}
                      <div
                        style={{
                          height: "2px",
                          background: "var(--border-default)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${rate}%`,
                            background:
                              rate > 80
                                ? "var(--success)"
                                : rate > 40
                                ? "var(--violet)"
                                : "var(--text-muted)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent orders */}
          {orders.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  color: "var(--text-muted)",
                  marginBottom: "12px",
                }}
              >
                DERNIÈRES VENTES — {formatEur(totalRevenue)} total
              </p>
              <div
                style={{
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-secondary)",
                }}
              >
                {orders.map((order, i) => (
                  <div
                    key={order.id}
                    style={{
                      padding: "12px 20px",
                      borderBottom:
                        i < orders.length - 1
                          ? "1px solid var(--border-default)"
                          : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                        {order.buyer_name ?? order.buyer_email}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--success)",
                        fontFamily: "'Share Tech Mono', monospace",
                      }}
                    >
                      {formatEur((order.total_amount ?? 0) / 100)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column — Actions ───────────────────────────────────────── */}
        <div style={{ position: "sticky", top: "32px" }}>
          <div
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--bg-secondary)",
              padding: "20px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "var(--text-muted)",
                marginBottom: "16px",
              }}
            >
              ACTIONS
            </p>
            <EventActions
              eventId={event.id}
              currentStatus={event.status as "draft" | "published" | "cancelled" | "completed"}
            />
          </div>

          <Link
            href={`/dashboard/events/${event.id}/edit`}
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", display: "block", textAlign: "center" }}
          >
            ✎ MODIFIER L'ÉVÉNEMENT
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Info Block ────────────────────────────────────────────────────────────────

function InfoBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        padding: "16px 20px",
      }}
    >
      <p
        style={{
          fontSize: "9px",
          letterSpacing: "0.2em",
          color: "var(--text-muted)",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>{value}</p>
      {sub && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
