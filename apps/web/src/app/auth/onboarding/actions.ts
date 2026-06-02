"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// ── Validation schemas ────────────────────────────────────────────────────────

const OrganizerSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit faire au moins 2 caractères")
    .max(60, "Le nom doit faire au maximum 60 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit faire au moins 2 caractères")
    .max(40, "Le slug doit faire au maximum 40 caractères")
    .regex(/^[a-z0-9-]+$/, "Uniquement des lettres minuscules, chiffres et tirets"),
  city: z.string().min(2, "La ville est requise"),
  genres: z
    .array(z.string())
    .min(1, "Sélectionne au moins un genre")
    .max(5, "5 genres maximum"),
  bio: z.string().max(500, "La bio doit faire au maximum 500 caractères").optional(),
});

export type OrganizerFormData = z.infer<typeof OrganizerSchema>;

// ── Slug generator ─────────────────────────────────────────────────────────────

export async function generateSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 35);

  return base;
}

// ── Check slug availability ───────────────────────────────────────────────────

export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean; suggestion?: string }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("organizers")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (!data) return { available: true };

  // Suggest alternative with random suffix
  const suffix = Math.floor(Math.random() * 900) + 100;
  return { available: false, suggestion: `${slug}-${suffix}` };
}

// ── Create organizer ──────────────────────────────────────────────────────────

export async function createOrganizer(
  formData: OrganizerFormData
): Promise<{ success: boolean; error?: string; organizerId?: string }> {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Validate input
  const parsed = OrganizerSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { success: false, error: firstError.message };
  }

  const { name, slug, city, genres, bio } = parsed.data;

  // Check slug not taken
  const { data: existingSlug } = await supabase
    .from("organizers")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existingSlug) {
    return { success: false, error: "Ce slug est déjà utilisé. Choisis-en un autre." };
  }

  // Check user doesn't already have an organizer
  const { data: existingOrg } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (existingOrg) {
    return { success: false, error: "Tu as déjà un profil organisateur." };
  }

  // Determine commission rate based on plan (starter by default)
  const commissionRate = 0.05;

  // Create organizer record
  const { data: organizer, error: orgError } = await supabase
    .from("organizers")
    .insert({
      profile_id: user.id,
      name,
      slug,
      city,
      genres,
      bio: bio ?? null,
      plan: "starter",
      commission_rate: commissionRate,
    })
    .select("id")
    .single();

  if (orgError || !organizer) {
    console.error("[createOrganizer] Error:", orgError);
    return { success: false, error: "Erreur lors de la création du profil. Réessaie." };
  }

  // Create team_member entry with role = 'owner'
  const { error: teamError } = await supabase.from("team_members").insert({
    organizer_id: organizer.id,
    profile_id: user.id,
    role: "owner",
    action_log: [
      {
        action: "organizer_created",
        at: new Date().toISOString(),
        by: user.id,
      },
    ],
  });

  if (teamError) {
    console.error("[createOrganizer] Team member error:", teamError);
    // Non-fatal — organizer created, team entry failed (will be handled)
  }

  // Update profile role to 'organizer'
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "organizer" })
    .eq("id", user.id);

  if (profileError) {
    console.error("[createOrganizer] Profile role update error:", profileError);
  }

  return { success: true, organizerId: organizer.id };
}
