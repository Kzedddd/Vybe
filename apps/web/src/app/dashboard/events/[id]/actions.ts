"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Auth guard helper ─────────────────────────────────────────────────────────

async function getOrganizerForEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié", supabase: null, organizer: null };

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!organizer) return { error: "Profil organisateur introuvable", supabase: null, organizer: null };

  // Verify this event belongs to this organizer
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .single();

  if (!event) return { error: "Événement introuvable ou accès refusé", supabase: null, organizer: null };

  return { error: null, supabase, organizer };
}

// ── Update event status ───────────────────────────────────────────────────────

export async function updateEventStatus(
  eventId: string,
  status: "draft" | "published" | "cancelled"
): Promise<{ success: boolean; error?: string }> {
  const { error, supabase } = await getOrganizerForEvent(eventId);
  if (error || !supabase) return { success: false, error: error ?? "Erreur" };

  const { error: updateError } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId);

  if (updateError) return { success: false, error: "Erreur lors de la mise à jour" };

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");

  return { success: true };
}

// ── Update event details ──────────────────────────────────────────────────────

const UpdateEventSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().max(2000).optional(),
  location_name: z.string().min(2).max(120),
  location_address: z.string().max(200).optional(),
  starts_at: z.string().min(1),
  ends_at: z.string().optional(),
  doors_open_at: z.string().optional(),
  total_capacity: z.number().int().min(1).max(100000),
  visibility: z.enum(["public", "circle_only"]),
  radar_visible: z.boolean(),
  radar_size: z.enum(["small", "medium", "large"]).optional(),
  cover_url: z.string().optional(),
});

export type UpdateEventData = z.infer<typeof UpdateEventSchema>;

export async function updateEvent(
  eventId: string,
  data: UpdateEventData
): Promise<{ success: boolean; error?: string }> {
  const { error, supabase } = await getOrganizerForEvent(eventId);
  if (error || !supabase) return { success: false, error: error ?? "Erreur" };

  const parsed = UpdateEventSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const { error: updateError } = await supabase
    .from("events")
    .update({
      ...parsed.data,
      description: parsed.data.description ?? null,
      location_address: parsed.data.location_address ?? null,
      ends_at: parsed.data.ends_at ?? null,
      doors_open_at: parsed.data.doors_open_at ?? null,
      radar_size: parsed.data.radar_size ?? null,
      cover_url: parsed.data.cover_url ?? null,
    })
    .eq("id", eventId);

  if (updateError) return { success: false, error: "Erreur lors de la mise à jour" };

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");

  return { success: true };
}

// ── Update ticket types ───────────────────────────────────────────────────────

export type TicketInput = {
  id?: string; // existing ticket has id, new one doesn't
  name: string;
  type: "standard" | "vip" | "staff" | "press" | "guestlist";
  price: number; // euros
  is_free: boolean;
  quantity_total: number;
  sale_starts_at?: string;
  sale_ends_at?: string;
};

export async function updateTicketTypes(
  eventId: string,
  tickets: TicketInput[],
  deletedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const { error, supabase } = await getOrganizerForEvent(eventId);
  if (error || !supabase) return { success: false, error: error ?? "Erreur" };

  // Delete removed tickets
  if (deletedIds.length > 0) {
    const { error: delError } = await supabase
      .from("ticket_types")
      .delete()
      .in("id", deletedIds);
    if (delError) return { success: false, error: "Erreur lors de la suppression des billets" };
  }

  // Upsert tickets
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    const row = {
      event_id: eventId,
      name: t.name,
      type: t.type,
      price: t.is_free ? 0 : Math.round(t.price * 100),
      is_free: t.is_free,
      quantity_total: t.quantity_total,
      sale_starts_at: t.sale_starts_at || null,
      sale_ends_at: t.sale_ends_at || null,
      is_visible: true,
      sort_order: i,
    };

    if (t.id) {
      await supabase.from("ticket_types").update(row).eq("id", t.id);
    } else {
      await supabase.from("ticket_types").insert({ ...row, quantity_sold: 0 });
    }
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/edit`);

  return { success: true };
}

// ── Delete event ──────────────────────────────────────────────────────────────

export async function deleteEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const { error, supabase } = await getOrganizerForEvent(eventId);
  if (error || !supabase) return { success: false, error: error ?? "Erreur" };

  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (deleteError) return { success: false, error: "Erreur lors de la suppression" };

  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");

  return { success: true };
}
