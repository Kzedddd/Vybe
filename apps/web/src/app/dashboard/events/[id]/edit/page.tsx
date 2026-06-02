import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditEventForm from "./EditEventForm";

export default async function EditEventPage({
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

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("organizer_id", organizer.id)
    .single();

  if (!event) notFound();

  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("event_id", id)
    .order("sort_order");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "48px 32px",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
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
        <Link href={`/dashboard/events/${id}`} style={{ color: "var(--text-muted)" }}>
          {event.title.toUpperCase()}
        </Link>
        {" / "}
        <span style={{ color: "var(--text-secondary)" }}>MODIFIER</span>
      </p>

      <h1
        style={{
          fontSize: "24px",
          fontWeight: 400,
          letterSpacing: "0.05em",
          marginBottom: "40px",
        }}
      >
        MODIFIER L'ÉVÉNEMENT
      </h1>

      <EditEventForm event={event} initialTickets={ticketTypes ?? []} />
    </div>
  );
}
