"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createEvent, type EventFormData } from "./actions";
import { createClient } from "@/lib/supabase/client";

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  "INFOS",
  "DATE & LIEU",
  "CAPACITÉ",
  "BILLETTERIE",
  "RÉCAP",
] as const;

const GENRES_VISIBILITY = [
  { value: "public", label: "PUBLIC", sub: "Visible par tous" },
  { value: "circle_only", label: "CERCLE PRIVÉ", sub: "Visible uniquement par les membres" },
] as const;

const TICKET_TYPES = ["standard", "vip", "staff", "press", "guestlist"] as const;

const RADAR_SIZES = [
  { value: "small", label: "SMALL", sub: "< 200 pers." },
  { value: "medium", label: "MEDIUM", sub: "200–1000 pers." },
  { value: "large", label: "LARGE", sub: "> 1000 pers." },
] as const;

// ── Default ticket ────────────────────────────────────────────────────────────

const defaultTicket = () => ({
  name: "",
  type: "standard" as const,
  price: 0,
  is_free: false,
  quantity_total: 100,
  sale_starts_at: "",
  sale_ends_at: "",
});

// ── Main component ────────────────────────────────────────────────────────────

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date') ?? ''; // YYYY-MM-DD from radar
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [coverUploading, setCoverUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<EventFormData, "status">>({
    // Step 1
    title: "",
    description: "",
    visibility: "public",
    cover_url: "",
    // Step 2
    location_name: "",
    location_address: "",
    starts_at: dateParam ? `${dateParam}T22:00` : "",
    ends_at: "",
    doors_open_at: "",
    // Step 3
    total_capacity: 200,
    radar_visible: true,
    radar_size: "medium",
    // Step 4
    tickets: [defaultTicket()],
  });

  // ── Cover upload ───────────────────────────────────────────────────────────
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

      if (error) { console.error("[uploadCover]", error); return null; }

      const { data } = supabase.storage
        .from("event-covers")
        .getPublicUrl(path);

      return data.publicUrl;
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Field helpers ──────────────────────────────────────────────────────────
  const set = (field: string, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  const setTicket = (i: number, field: string, value: unknown) =>
    setForm((p) => {
      const tickets = [...p.tickets];
      tickets[i] = { ...tickets[i], [field]: value };
      return { ...p, tickets };
    });

  const addTicket = () =>
    setForm((p) => ({ ...p, tickets: [...p.tickets, defaultTicket()] }));

  const removeTicket = (i: number) =>
    setForm((p) => ({
      ...p,
      tickets: p.tickets.filter((_, idx) => idx !== i),
    }));

  // ── Validation per step ────────────────────────────────────────────────────
  const validate = (): string => {
    if (step === 0) {
      if (!form.title.trim() || form.title.length < 3) return "Le titre doit faire au moins 3 caractères";
    }
    if (step === 1) {
      if (!form.location_name.trim()) return "Le lieu est requis";
      if (!form.starts_at) return "La date de début est requise";
    }
    if (step === 2) {
      if (!form.total_capacity || form.total_capacity < 1) return "La capacité est requise";
    }
    if (step === 3) {
      if (form.tickets.length === 0) return "Ajoute au moins un type de billet";
      for (const t of form.tickets) {
        if (!t.name.trim()) return "Tous les billets doivent avoir un nom";
        if (!t.is_free && t.price < 0) return "Le prix ne peut pas être négatif";
        if (t.quantity_total < 1) return "La quantité minimum est 1";
      }
    }
    return "";
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  };

  const back = () => { setError(""); setStep((s) => s - 1); };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async (status: "draft" | "published") => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");

    // Upload cover if selected
    const coverUrl = await uploadCover();

    const result = await createEvent({ ...form, cover_url: coverUrl ?? undefined, status });

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      setLoading(false);
      return;
    }

    router.push("/dashboard?created=1");
  };

  // ── Format date for display ────────────────────────────────────────────────
  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const fmtEur = (cents: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: "100vh",
      background: "var(--bg-primary)",
      padding: "48px 32px",
      maxWidth: "720px",
      margin: "0 auto",
    } as React.CSSProperties,

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

    fieldGroup: { marginBottom: "24px" } as React.CSSProperties,

    row: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
    } as React.CSSProperties,

    card: {
      border: "1px solid var(--border-default)",
      background: "var(--bg-secondary)",
      padding: "20px",
      marginBottom: "16px",
    } as React.CSSProperties,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "4px" }}>
          DASHBOARD / ÉVÉNEMENTS
        </p>
        <h1 style={{ fontSize: "24px", fontWeight: 400, letterSpacing: "0.05em" }}>
          CRÉER UN ÉVÉNEMENT
        </h1>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", gap: "0", marginBottom: "40px" }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: "2px",
                background: i <= step ? "var(--violet)" : "var(--border-default)",
                marginBottom: "8px",
                transition: "background 0.2s",
              }}
            />
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "0.15em",
                color: i === step ? "var(--violet)" : i < step ? "var(--text-secondary)" : "var(--text-muted)",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            padding: "10px 16px",
            fontSize: "12px",
            marginBottom: "24px",
            letterSpacing: "0.05em",
          }}
        >
          ▸ {error}
        </div>
      )}

      {/* ── Step 0 : Infos de base ─────────────────────────────────────────── */}
      {step === 0 && (
        <div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Titre de l'événement *</label>
            <input
              style={s.input}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="ex: DECADANCE #12 — NUIT NOIRE"
              maxLength={80}
              autoFocus
            />
          </div>

          <div style={s.fieldGroup}>
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
                {/* Preview */}
                <img
                  src={coverPreview}
                  alt="Aperçu flyer"
                  style={{
                    width: "100%",
                    maxHeight: "280px",
                    objectFit: "cover",
                    display: "block",
                    border: "1px solid var(--border-default)",
                  }}
                />
                {/* Change / Remove overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    right: "0",
                    display: "flex",
                    gap: "0",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      flex: 1,
                      background: "rgba(8,8,8,0.85)",
                      border: "none",
                      borderTop: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      padding: "10px",
                      cursor: "pointer",
                    }}
                  >
                    CHANGER
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview("");
                      set("cover_url", "");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{
                      flex: 1,
                      background: "rgba(8,8,8,0.85)",
                      border: "none",
                      borderTop: "1px solid var(--border-default)",
                      borderLeft: "1px solid var(--border-default)",
                      color: "var(--danger)",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      padding: "10px",
                      cursor: "pointer",
                    }}
                  >
                    SUPPRIMER
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  height: "160px",
                  border: "1px dashed var(--border-default)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--violet)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border-default)")
                }
              >
                <span style={{ fontSize: "24px", opacity: 0.4 }}>+</span>
                <span>AJOUTER UN FLYER</span>
                <span style={{ fontSize: "9px", opacity: 0.5 }}>
                  JPG, PNG, WEBP — 5MB MAX
                </span>
              </button>
            )}
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Description</label>
            <textarea
              style={s.textarea}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Line-up, ambiance, dresscode..."
              maxLength={2000}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Visibilité</label>
            <div style={{ display: "flex", gap: "12px" }}>
              {GENRES_VISIBILITY.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => set("visibility", v.value)}
                  style={{
                    flex: 1,
                    padding: "16px",
                    border: `1px solid ${form.visibility === v.value ? "var(--violet)" : "var(--border-default)"}`,
                    background: form.visibility === v.value ? "var(--violet-dim)" : "var(--bg-secondary)",
                    color: form.visibility === v.value ? "var(--violet)" : "var(--text-secondary)",
                    fontFamily: "'Share Tech Mono', monospace",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "4px" }}>
                    {v.label}
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.6 }}>{v.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1 : Date & Lieu ───────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Nom du lieu *</label>
            <input
              style={s.input}
              value={form.location_name}
              onChange={(e) => set("location_name", e.target.value)}
              placeholder="ex: Warehouse 23, La REcyclerie..."
              autoFocus
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Adresse complète</label>
            <input
              style={s.input}
              value={form.location_address}
              onChange={(e) => set("location_address", e.target.value)}
              placeholder="23 rue des Martyrs, 75009 Paris"
            />
          </div>

          <div style={{ ...s.row, ...s.fieldGroup }}>
            <div>
              <label style={s.label}>Début *</label>
              <input
                type="datetime-local"
                style={s.input}
                value={form.starts_at}
                onChange={(e) => set("starts_at", e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>Fin</label>
              <input
                type="datetime-local"
                style={s.input}
                value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)}
              />
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Ouverture des portes</label>
            <input
              type="datetime-local"
              style={{ ...s.input, maxWidth: "300px" }}
              value={form.doors_open_at}
              onChange={(e) => set("doors_open_at", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Step 2 : Capacité & Radar ──────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Capacité totale *</label>
            <input
              type="number"
              style={{ ...s.input, maxWidth: "200px" }}
              value={form.total_capacity}
              onChange={(e) => set("total_capacity", parseInt(e.target.value) || 0)}
              min={1}
              max={100000}
              autoFocus
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Visible sur le Radar Territorial</label>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              {[
                { v: true, label: "OUI", sub: "Visible par tous les participants" },
                { v: false, label: "NON", sub: "Événement discret" },
              ].map(({ v, label, sub }) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => set("radar_visible", v)}
                  style={{
                    flex: 1,
                    padding: "16px",
                    border: `1px solid ${form.radar_visible === v ? "var(--violet)" : "var(--border-default)"}`,
                    background: form.radar_visible === v ? "var(--violet-dim)" : "var(--bg-secondary)",
                    color: form.radar_visible === v ? "var(--violet)" : "var(--text-secondary)",
                    fontFamily: "'Share Tech Mono', monospace",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "10px", opacity: 0.6 }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {form.radar_visible && (
            <div style={s.fieldGroup}>
              <label style={s.label}>Taille sur le radar</label>
              <div style={{ display: "flex", gap: "12px" }}>
                {RADAR_SIZES.map(({ value, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("radar_size", value)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      border: `1px solid ${form.radar_size === value ? "var(--violet)" : "var(--border-default)"}`,
                      background: form.radar_size === value ? "var(--violet-dim)" : "var(--bg-secondary)",
                      color: form.radar_size === value ? "var(--violet)" : "var(--text-secondary)",
                      fontFamily: "'Share Tech Mono', monospace",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "4px" }}>{label}</div>
                    <div style={{ fontSize: "10px", opacity: 0.6 }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3 : Billetterie ───────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          {form.tickets.map((ticket, i) => (
            <div key={i} style={s.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-muted)" }}>
                  BILLET #{i + 1}
                </span>
                {form.tickets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTicket(i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--danger)",
                      cursor: "pointer",
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                      fontFamily: "'Share Tech Mono', monospace",
                    }}
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
                    onChange={(e) => setTicket(i, "name", e.target.value)}
                    placeholder="ex: Early Bird, VIP..."
                  />
                </div>
                <div>
                  <label style={s.label}>Catégorie</label>
                  <select
                    style={s.input}
                    value={ticket.type}
                    onChange={(e) => setTicket(i, "type", e.target.value)}
                  >
                    {TICKET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ ...s.row, marginTop: "12px" }}>
                <div>
                  <label style={s.label}>
                    {ticket.is_free ? "GRATUIT" : "Prix (€) *"}
                  </label>
                  <input
                    type="number"
                    style={{ ...s.input, opacity: ticket.is_free ? 0.4 : 1 }}
                    value={ticket.price}
                    onChange={(e) => setTicket(i, "price", parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => setTicket(i, "quantity_total", parseInt(e.target.value) || 0)}
                    min={1}
                  />
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={ticket.is_free}
                    onChange={(e) => {
                      setTicket(i, "is_free", e.target.checked);
                      if (e.target.checked) setTicket(i, "price", 0);
                    }}
                    style={{ width: "auto", accentColor: "var(--violet)" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
                    BILLET GRATUIT
                  </span>
                </label>
              </div>

              <div style={{ ...s.row, marginTop: "12px" }}>
                <div>
                  <label style={s.label}>Vente du</label>
                  <input
                    type="datetime-local"
                    style={s.input}
                    value={ticket.sale_starts_at}
                    onChange={(e) => setTicket(i, "sale_starts_at", e.target.value)}
                  />
                </div>
                <div>
                  <label style={s.label}>Vente jusqu'au</label>
                  <input
                    type="datetime-local"
                    style={s.input}
                    value={ticket.sale_ends_at}
                    onChange={(e) => setTicket(i, "sale_ends_at", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addTicket}
            className="btn btn-ghost btn-sm"
            style={{ width: "100%" }}
          >
            + AJOUTER UN TYPE DE BILLET
          </button>
        </div>
      )}

      {/* ── Step 4 : Récap & Publication ──────────────────────────────────── */}
      {step === 4 && (
        <div>
          {coverPreview && (
            <div style={{ marginBottom: "16px", border: "1px solid var(--border-default)" }}>
              <img
                src={coverPreview}
                alt="Flyer"
                style={{ width: "100%", maxHeight: "200px", objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          <div style={s.card}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "16px" }}>
              RÉCAPITULATIF
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <RecapRow label="TITRE" value={form.title} />
              <RecapRow
                label="VISIBILITÉ"
                value={form.visibility === "public" ? "Public" : "Cercle Privé"}
              />
              {form.description && (
                <RecapRow label="DESCRIPTION" value={form.description.slice(0, 100) + (form.description.length > 100 ? "..." : "")} />
              )}
            </div>
          </div>

          <div style={s.card}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "16px" }}>
              DATE & LIEU
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <RecapRow label="LIEU" value={form.location_name} />
              {form.location_address && <RecapRow label="ADRESSE" value={form.location_address} />}
              <RecapRow label="DÉBUT" value={fmtDate(form.starts_at)} />
              {form.ends_at && <RecapRow label="FIN" value={fmtDate(form.ends_at)} />}
              {form.doors_open_at && <RecapRow label="PORTES" value={fmtDate(form.doors_open_at)} />}
            </div>
          </div>

          <div style={s.card}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "16px" }}>
              CAPACITÉ & RADAR
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <RecapRow label="CAPACITÉ" value={`${form.total_capacity} personnes`} />
              <RecapRow label="RADAR" value={form.radar_visible ? `OUI — ${form.radar_size?.toUpperCase()}` : "NON"} />
            </div>
          </div>

          <div style={s.card}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "16px" }}>
              BILLETTERIE — {form.tickets.length} TYPE{form.tickets.length > 1 ? "S" : ""}
            </p>
            {form.tickets.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < form.tickets.length - 1 ? "1px solid var(--border-default)" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>{t.name}</p>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {t.type.toUpperCase()} — {t.quantity_total} places
                  </p>
                </div>
                <p style={{ fontSize: "13px", color: "var(--violet)", fontFamily: "'Share Tech Mono', monospace" }}>
                  {t.is_free ? "GRATUIT" : fmtEur(t.price)}
                </p>
              </div>
            ))}
          </div>

          {/* Publication buttons */}
          <div
            style={{
              border: "1px solid var(--border-default)",
              padding: "24px",
              background: "var(--bg-secondary)",
            }}
          >
            <p style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "16px" }}>
              CHOISIR LE STATUT DE PUBLICATION
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => submit("draft")}
                disabled={loading || coverUploading}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                {coverUploading ? "UPLOAD..." : loading ? "CRÉATION..." : "SAUVEGARDER EN BROUILLON"}
              </button>
              <button
                type="button"
                onClick={() => submit("published")}
                disabled={loading || coverUploading}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {coverUploading ? "UPLOAD..." : loading ? "CRÉATION..." : "PUBLIER L'ÉVÉNEMENT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      {step < 4 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border-default)",
          }}
        >
          <button
            type="button"
            onClick={step === 0 ? () => router.push("/dashboard") : back}
            className="btn btn-ghost"
          >
            {step === 0 ? "ANNULER" : "← RETOUR"}
          </button>
          <button type="button" onClick={next} className="btn btn-primary">
            SUIVANT →
          </button>
        </div>
      )}

      {step === 4 && (
        <div style={{ marginTop: "16px" }}>
          <button type="button" onClick={back} className="btn btn-ghost btn-sm">
            ← RETOUR
          </button>
        </div>
      )}
    </div>
  );
}

// ── Recap Row ─────────────────────────────────────────────────────────────────

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
      <span style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--text-muted)", flexShrink: 0, paddingTop: "2px" }}>
        {label}
      </span>
      <span style={{ fontSize: "12px", color: "var(--text-primary)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
