"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────────────────────────

const Step1Schema = z.object({
  title: z.string().min(3, "Titre trop court").max(80, "Titre trop long"),
  description: z.string().max(2000, "Description trop longue").optional(),
  visibility: z.enum(["public", "circle_only"]),
});

const Step2Schema = z.object({
  location_name: z.string().min(2, "Lieu requis").max(120),
  location_address: z.string().max(200).optional(),
  starts_at: z.string().min(1, "Date de début requise"),
  ends_at: z.string().optional(),
  doors_open_at: z.string().optional(),
});

const Step3Schema = z.object({
  total_capacity: z
    .number()
    .int()
    .min(1, "Capacité minimum : 1")
    .max(100000, "Capacité maximum : 100 000"),
  radar_visible: z.boolean(),
  radar_size: z.enum(["small", "medium", "large"]).optional(),
});

const TicketTypeSchema = z.object({
  name: z.string().min(1, "Nom requis").max(60),
  type: z.enum(["standard", "vip", "staff", "press", "guestlist"]),
  price: z.number().min(0, "Prix invalide"), // euros, will convert to cents
  is_free: z.boolean(),
  quantity_total: z.number().int().min(1, "Quantité minimum : 1"),
  sale_starts_at: z.string().optional(),
  sale_ends_at: z.string().optional(),
});

const Step4Schema = z.object({
  tickets: z.array(TicketTypeSchema).min(1, "Ajoute au moins un type de billet"),
});

const PublishSchema = z.object({
  status: z.enum(["draft", "published"]),
});

// Combined event schema for final creation
const EventSchema = Step1Schema.merge(Step2Schema)
  .merge(Step3Schema)
  .merge(Step4Schema)
  .merge(PublishSchema);

export type EventFormData = {
  // Step 1
  title: string;
  description?: string;
  visibility: "public" | "circle_only";
  cover_url?: string;
  // Step 2
  location_name: string;
  location_address?: string;
  starts_at: string;
  ends_at?: string;
  doors_open_at?: string;
  // Step 3
  total_capacity: number;
  radar_visible: boolean;
  radar_size?: "small" | "medium" | "large";
  // Step 4
  tickets: {
    name: string;
    type: "standard" | "vip" | "staff" | "press" | "guestlist";
    price: number;
    is_free: boolean;
    quantity_total: number;
    sale_starts_at?: string;
    sale_ends_at?: string;
  }[];
  // Step 5
  status: "draft" | "published";
};

// ── Slug generator ────────────────────────────────────────────────────────────

function generateEventSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

// ── Create event ──────────────────────────────────────────────────────────────

export async function createEvent(
  data: EventFormData
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  // Get organizer
  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!organizer) return { success: false, error: "Profil organisateur introuvable" };

  // Generate unique slug
  const baseSlug = generateEventSlug(data.title);
  const suffix = Date.now().toString(36);
  const slug = `${baseSlug}-${suffix}`;

  // Create event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      organizer_id: organizer.id,
      title: data.title,
      slug,
      description: data.description ?? null,
      cover_url: data.cover_url ?? null,
      visibility: data.visibility,
      location_name: data.location_name,
      location_address: data.location_address ?? null,
      starts_at: data.starts_at,
      ends_at: data.ends_at ?? null,
      doors_open_at: data.doors_open_at ?? null,
      total_capacity: data.total_capacity,
      radar_visible: data.radar_visible,
      radar_size: data.radar_size ?? null,
      status: data.status,
      tickets_sold: 0,
    })
    .select("id")
    .single();

  if (eventError || !event) {
    console.error("[createEvent]", eventError);
    return { success: false, error: "Erreur lors de la création de l'événement" };
  }

  // Create ticket types
  if (data.tickets.length > 0) {
    const ticketRows = data.tickets.map((t, i) => ({
      event_id: event.id,
      name: t.name,
      type: t.type,
      price: t.is_free ? 0 : Math.round(t.price * 100), // convert to cents
      is_free: t.is_free,
      quantity_total: t.quantity_total,
      quantity_sold: 0,
      sale_starts_at: t.sale_starts_at ?? null,
      sale_ends_at: t.sale_ends_at ?? null,
      is_visible: true,
      sort_order: i,
    }));

    const { error: ticketError } = await supabase
      .from("ticket_types")
      .insert(ticketRows);

    if (ticketError) {
      console.error("[createEvent] ticket_types error:", ticketError);
      // Non-fatal — event created, tickets failed
    }
  }

  return { success: true, eventId: event.id };
}
