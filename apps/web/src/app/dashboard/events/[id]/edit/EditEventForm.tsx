"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateEvent, updateTicketTypes, type TicketInput } from "../actions";
import { createClient } from "@/lib/supabase/client";

const TICKET_TYPES = ["standard", "vip", "staff", "press", "guestlist"] as const;

// Converts "2027-09-02T12:00:00" → "2027-09-02T12:00" for datetime-local input
function toInputDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

const RADAR_SIZES = [
  { value: "small", label: "SMALL", sub: "< 200 pers." },
  { value: "medium", label: "MEDIUM", sub: "200–1000 pers." },
  { value: "large", label: "LARGE", sub: "> 1000 pers." },
] as const;

interface Event {
  id: string;
  title: string;
  description: string | null;
  visibility: "public" | "circle_only";
  cover_url: string | null;
  location_name: string;
  location_address: string | null;
  starts_at: string;
  ends_at: string | null;
  doors_open_at: string | null;
  total_capacity: number;
  radar_visible: boolean;
  radar_size: "small" | "medium" | "large" | null;
}

interface ExistingTicket {
  id: string;
  name: string;
  type: string;
  price: number; // cents
  is_free: boolean;
  quantity_total: number;
  quantity_sold: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}

type TicketRow = TicketInput & { _key: string };

const defaultTicket = (): TicketRow => ({
  _key: Math.random().toString(36).slice(2),
  name: "",
  type: "standard",
  price: 0,
  is_free: false,
  quantity_total: 100,
  sale_starts_at: "",
  sale_ends_at: "",
});

export default function EditEventForm({
  event,
  initialTickets = [],
}: {
  event: Event;
  initialTickets?: ExistingTicket[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<TicketRow[]>(
    initialTickets.length > 0
      ? initialTickets.map((t) => ({
          _key: t.id,
          id: t.id,
          name: t.name,
          type: t.type as TicketRow["type"],
          price: t.price / 100, // cents → euros
          is_free: t.is_free,
          quantity_total: t.quantity_total,
          sale_starts_at: toInputDate(t.sale_starts_at),
          sale_ends_at: toInputDate(t.sale_ends_at),
        }))
      : [defaultTicket()]
  );
  const [deletedTicketIds, setDeletedTicketIds] = useState<string[]>([]);

  const [coverPreview, setCoverPreview] = useState<string>(event.cover_url ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const [form, setForm] = useState({
    title: event.title,
    description: event.description ?? "",
    visibility: event.visibility,
    location_name: event.location_name,
    location_address: event.location_address ?? "",
    starts_at: toInputDate(event.starts_at),
    ends_at: toInputDate(event.ends_at),
    doors_open_at: toInputDate(event.doors_open_at),
    total_capacity: event.total_capacity,
    radar_visible: event.radar_visible,
    radar_size: event.radar_size ?? "medium",
    cover_url: event.cover_url ?? "",
  });

  const set = (field: string, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  const setTicket = (key: string, field: string, value: unknown) =>
    setTickets((prev) =>
      prev.map((t) => (t._key === key ? { ...t, [field]: value } : t))
    );

  const addTicket = () => setTickets((prev) => [...prev, defaultTicket()]);

  const removeTicket = (key: string) => {
    const ticket = tickets.find((t) => t._key === key);
    if (ticket?.id) setDeletedTicketIds((prev) => [...prev, ticket.id!]);
    setTickets((prev) => prev.filter((t) => t._key !== key));
  };

  // ── Cover upload ────────────────────────────────────────────────────────────
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return form.cover_url || null;
    setCoverUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const ext = coverFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("event-covers")
        .upload(path, coverFile, { upsert: true });
      if (error) return null;
      const { data } = supabase.storage.from("event-covers").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.title.length < 3) {
      setError("Le titre doit faire au moins 3 caractères");
      return;
    }
    if (!form.location_name.trim()) {
      setError("Le lieu est requis");
      return;
    }
    if (!form.starts_at) {
      setError("La date de début est requise");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    const coverUrl = await uploadCover();

    // Validate tickets
    for (const t of tickets) {
      if (!t.name.trim()) { setError("Tous les billets doivent avoir un nom"); setLoading(false); return; }
      if (!t.is_free && t.price < 0) { setError("Le prix ne peut pas être négatif"); setLoading(false); return; }
      if (t.quantity_total < 1) { setError("La quantité minimum est 1"); setLoading(false); return; }
    }

    const result = await updateEvent(event.id, {
      title: form.title,
      description: form.description || undefined,
      visibility: form.visibility,
      location_name: form.location_name,
      location_address: form.location_address || undefined,
      starts_at: form.starts_at,
      ends_at: form.ends_at || undefined,
      doors_open_at: form.doors_open_at || undefined,
      total_capacity: form.total_capacity,
      radar_visible: form.radar_visible,
      radar_size: form.radar_visible ? (form.radar_size as "small" | "medium" | "large") : undefined,
      cover_url: coverUrl ?? undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      setLoading(false);
      return;
    }

    // Save tickets
    const ticketResult = await updateTicketTypes(event.id, tickets, deletedTicketIds);
    if (!ticketResult.success) {
      setError(ticketResult.error ?? "Erreur lors de la mise à jour des billets");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push(`/dashboard/events/${event.id}`), 800);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const s = {
    label: {
      display: "block",
      fontSize: "9px",
      letterSpacing: "0.2em",
      color: "var(--text-muted)",
      textTransform: "uppercase" as const,
      marginBottom: "6px",
    },
    input: {
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-default)",
      color: "var(--text-primary)",
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: "13px",
      padding: "10px 14px",
      outline: "none",
      width: "100%",
      borderRadius: "0",
    } as React.CSSProperties,
    textarea: {
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-default)",
      color: "var(--text-primary)",
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: "13px",
      padding: "10px 14px",
      outline: "none",
      width: "100%",
      borderRadius: "0",
      resize: "vertical" as const,
      minHeight: "100px",
    } as React.CSSProperties,
    field: { marginBottom: "24px" } as React.CSSProperties,
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } as React.CSSProperties,
    section: {
      fontSize: "9px",
      letterSpacing: "0.2em",
      color: "var(--text-muted)",
      textTransform: "uppercase" as const,
      paddingBottom: "12px",
      borderBottom: "1px solid var(--border-default)",
      marginBottom: "24px",
      marginTop: "32px",
    } as React.CSSProperties,
    optionBtn: (active: boolean) => ({
      flex: 1,
      padding: "14px",
      border: `1px solid ${active ? "var(--violet)" : "var(--border-default)"}`,
      background: active ? "var(--violet-dim)" : "var(--bg-secondary)",
      color: active ? "var(--violet)" : "var(--text-secondary)",
      fontFamily: "'Share Tech Mono', monospace",
      cursor: "pointer",
      textAlign: "left" as const,
    }),
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Error / Success */}
      {error && (
        <div style={{ border: "1px solid var(--danger)", color: "var(--danger)", padding: "10px 16px", fontSize: "12px", marginBottom: "24px" }}>
          ▸ {error}
        </div>
      )}
      {success && (
        <div style={{ border: "1px solid var(--success)", color: "var(--success)", padding: "10px 16px", fontSize: "12px", marginBottom: "24px" }}>
          ▸ MODIFICATIONS ENREGISTRÉES
        </div>
      )}

      {/* ── Infos ──────────────────────────────────────────────────────────── */}
      <p style={s.section}>INFORMATIONS</p>

      <div style={s.field}>
        <label style={s.label}>Titre *</label>
        <input
          style={s.input}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={80}
        />
      </div>

      <div style={s.field}>
        <label style={s.label}>Flyer / Photo de couverture</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleCoverChange}
          style={{ display: "none" }}
        />
        {coverPreview ? (
          <div style={{ position: "relative" }}>
            <img
              src={coverPreview}
              alt="Flyer"
              style={{ width: "100%", maxHeight: "240px", objectFit: "cover", display: "block", border: "1px solid var(--border-default)" }}
            />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex" }}>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, background: "rgba(8,8,8,0.85)", border: "none", borderTop: "1px solid var(--border-default)", color: "var(--text-secondary)", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", padding: "10px", cursor: "pointer" }}>
                CHANGER
              </button>
              <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(""); set("cover_url", ""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                style={{ flex: 1, background: "rgba(8,8,8,0.85)", border: "none", borderTop: "1px solid var(--border-default)", borderLeft: "1px solid var(--border-default)", color: "var(--danger)", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", padding: "10px", cursor: "pointer" }}>
                SUPPRIMER
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            style={{ width: "100%", height: "120px", border: "1px dashed var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", letterSpacing: "0.15em", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", opacity: 0.4 }}>+</span>
            <span>AJOUTER UN FLYER</span>
          </button>
        )}
      </div>

      <div style={s.field}>
        <label style={s.label}>Description</label>
        <textarea
          style={s.textarea}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={2000}
        />
      </div>

      <div style={s.field}>
        <label style={s.label}>Visibilité</label>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { value: "public", label: "PUBLIC", sub: "Visible par tous" },
            { value: "circle_only", label: "CERCLE PRIVÉ", sub: "Membres uniquement" },
          ].map((v) => (
            <button key={v.value} type="button" onClick={() => set("visibility", v.value)} style={s.optionBtn(form.visibility === v.value)}>
              <div style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "4px" }}>{v.label}</div>
              <div style={{ fontSize: "10px", opacity: 0.6 }}>{v.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Date & Lieu ────────────────────────────────────────────────────── */}
      <p style={s.section}>DATE & LIEU</p>

      <div style={s.field}>
        <label style={s.label}>Nom du lieu *</label>
        <input style={s.input} value={form.location_name} onChange={(e) => set("location_name", e.target.value)} />
      </div>

      <div style={s.field}>
        <label style={s.label}>Adresse complète</label>
        <input style={s.input} value={form.location_address} onChange={(e) => set("location_address", e.target.value)} />
      </div>

      <div style={{ ...s.row, ...s.field }}>
        <div>
          <label style={s.label}>Début *</label>
          <input type="datetime-local" style={s.input} value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
        </div>
        <div>
          <label style={s.label}>Fin</label>
          <input type="datetime-local" style={s.input} value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Ouverture des portes</label>
        <input type="datetime-local" style={{ ...s.input, maxWidth: "300px" }} value={form.doors_open_at} onChange={(e) => set("doors_open_at", e.target.value)} />
      </div>

      {/* ── Capacité & Radar ───────────────────────────────────────────────── */}
      <p style={s.section}>CAPACITÉ & RADAR</p>

      <div style={s.field}>
        <label style={s.label}>Capacité totale *</label>
        <input type="number" style={{ ...s.input, maxWidth: "200px" }} value={form.total_capacity} onChange={(e) => set("total_capacity", parseInt(e.target.value) || 0)} min={1} />
      </div>

      <div style={s.field}>
        <label style={s.label}>Visible sur le Radar</label>
        <div style={{ display: "flex", gap: "12px", marginBottom: form.radar_visible ? "16px" : "0" }}>
          {[
            { v: true, label: "OUI" },
            { v: false, label: "NON" },
          ].map(({ v, label }) => (
            <button key={String(v)} type="button" onClick={() => set("radar_visible", v)} style={s.optionBtn(form.radar_visible === v)}>
              <div style={{ fontSize: "11px", letterSpacing: "0.15em" }}>{label}</div>
            </button>
          ))}
        </div>
        {form.radar_visible && (
          <div style={{ display: "flex", gap: "12px" }}>
            {RADAR_SIZES.map(({ value, label, sub }) => (
              <button key={value} type="button" onClick={() => set("radar_size", value)} style={s.optionBtn(form.radar_size === value)}>
                <div style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "10px", opacity: 0.6 }}>{sub}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Billetterie ────────────────────────────────────────────────────── */}
      <p style={s.section}>BILLETTERIE</p>

      {tickets.map((ticket) => (
        <div
          key={ticket._key}
          style={{
            border: "1px solid var(--border-default)",
            background: "var(--bg-secondary)",
            padding: "20px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-muted)" }}>
              {ticket.name || "NOUVEAU BILLET"}
            </span>
            {tickets.length > 1 && (
              <button
                type="button"
                onClick={() => removeTicket(ticket._key)}
                style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "10px", letterSpacing: "0.1em", fontFamily: "'Share Tech Mono', monospace" }}
              >
                SUPPRIMER
              </button>
            )}
          </div>

          <div style={s.row}>
            <div>
              <label style={s.label}>Nom *</label>
              <input
                style={s.input}
                value={ticket.name}
                onChange={(e) => setTicket(ticket._key, "name", e.target.value)}
                placeholder="Early Bird, VIP..."
              />
            </div>
            <div>
              <label style={s.label}>Catégorie</label>
              <select
                style={s.input}
                value={ticket.type}
                onChange={(e) => setTicket(ticket._key, "type", e.target.value)}
              >
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ ...s.row, marginTop: "12px" }}>
            <div>
              <label style={s.label}>{ticket.is_free ? "GRATUIT" : "Prix (€) *"}</label>
              <input
                type="number"
                style={{ ...s.input, opacity: ticket.is_free ? 0.4 : 1 }}
                value={ticket.price}
                onChange={(e) => setTicket(ticket._key, "price", parseFloat(e.target.value) || 0)}
                min={0}
                step={0.5}
                disabled={ticket.is_free}
              />
            </div>
            <div>
              <label style={s.label}>Quantité *</label>
              <input
                type="number"
                style={s.input}
                value={ticket.quantity_total}
                onChange={(e) => setTicket(ticket._key, "quantity_total", parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={ticket.is_free}
                onChange={(e) => {
                  setTicket(ticket._key, "is_free", e.target.checked);
                  if (e.target.checked) setTicket(ticket._key, "price", 0);
                }}
                style={{ width: "auto", accentColor: "var(--violet)" }}
              />
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.1em" }}>BILLET GRATUIT</span>
            </label>
          </div>

          <div style={{ ...s.row, marginTop: "12px" }}>
            <div>
              <label style={s.label}>Vente du</label>
              <input
                type="datetime-local"
                style={s.input}
                value={ticket.sale_starts_at ?? ""}
                onChange={(e) => setTicket(ticket._key, "sale_starts_at", e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>Vente jusqu'au</label>
              <input
                type="datetime-local"
                style={s.input}
                value={ticket.sale_ends_at ?? ""}
                onChange={(e) => setTicket(ticket._key, "sale_ends_at", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addTicket}
        className="btn btn-ghost btn-sm"
        style={{ width: "100%", marginBottom: "8px" }}
      >
        + AJOUTER UN TYPE DE BILLET
      </button>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border-default)" }}>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/events/${event.id}`)}
          className="btn btn-ghost"
        >
          ANNULER
        </button>
        <button
          type="submit"
          disabled={loading || coverUploading}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          {coverUploading ? "UPLOAD..." : loading ? "ENREGISTREMENT..." : "ENREGISTRER LES MODIFICATIONS"}
        </button>
      </div>
    </form>
  );
}
