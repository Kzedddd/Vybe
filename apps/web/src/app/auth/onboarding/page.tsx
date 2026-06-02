"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrganizer, checkSlugAvailability, generateSlug } from "./actions";

// ── Genre list ─────────────────────────────────────────────────────────────────

const GENRES = [
  "Techno", "House", "Drum & Bass", "Jungle", "Electro",
  "Ambient", "Industrial", "EBM", "Rave", "Hard Techno",
  "Deep House", "Minimal", "Trance", "Hardcore", "Breakbeat",
  "Experimental", "Noise", "Dark Electro",
];

const CITIES = [
  "Paris", "Marseille", "Lyon", "Bordeaux", "Toulouse",
  "Nantes", "Lille", "Strasbourg", "Casablanca", "Rabat",
  "Amsterdam", "Berlin", "Bruxelles", "Barcelone", "Londres",
  "Autre",
];

// ── Steps definition ───────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3; // 0=role, 1=collectif, 2=genres, 3=confirm

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    city: "",
    genres: [] as string[],
    bio: "",
  });

  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugSuggestion, setSlugSuggestion] = useState("");

  // Auto-generate slug from name
  useEffect(() => {
    if (!form.name) return;
    const timeout = setTimeout(async () => {
      const generated = await generateSlug(form.name);
      setForm((p) => ({ ...p, slug: generated }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [form.name]);

  // Check slug availability
  useEffect(() => {
    if (!form.slug || form.slug.length < 2) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timeout = setTimeout(async () => {
      const result = await checkSlugAvailability(form.slug);
      setSlugStatus(result.available ? "available" : "taken");
      if (!result.available && result.suggestion) {
        setSlugSuggestion(result.suggestion);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.slug]);

  const toggleGenre = (genre: string) => {
    setForm((p) => ({
      ...p,
      genres: p.genres.includes(genre)
        ? p.genres.filter((g) => g !== genre)
        : p.genres.length < 5
        ? [...p.genres, genre]
        : p.genres,
    }));
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) { setError("Le nom du collectif est requis"); return; }
      if (!form.slug.trim()) { setError("Le slug est requis"); return; }
      if (slugStatus === "taken") { setError("Ce slug est déjà pris"); return; }
      if (slugStatus === "checking") { setError("Vérifie la disponibilité du slug"); return; }
      if (!form.city) { setError("La ville est requise"); return; }
    }
    if (step === 2) {
      if (form.genres.length === 0) { setError("Sélectionne au moins un genre"); return; }
    }
    setStep((s) => (s + 1) as Step);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    const result = await createOrganizer({
      name: form.name,
      slug: form.slug,
      city: form.city,
      genres: form.genres,
      bio: form.bio || undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      setLoading(false);
      return;
    }

    // Redirect to dashboard — middleware will confirm role
    router.push("/dashboard?onboarded=1");
    router.refresh();
  };

  const steps = ["RÔLE", "COLLECTIF", "GENRES", "CONFIRMATION"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: "560px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.3em", marginBottom: "12px" }}>
            ▶ VYBE — ONBOARDING ORGANISATEUR
          </p>
          <h1 style={{ fontSize: "22px", marginBottom: "8px" }}>
            [ CRÉATION DE TON PROFIL ]
          </h1>
        </div>

        {/* Stepper */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "32px",
          padding: "0 8px",
        }}>
          {steps.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
              {/* Step circle */}
              <div style={{
                width: "28px",
                height: "28px",
                border: `1px solid ${i < step ? "var(--success)" : i === step ? "var(--violet)" : "var(--border-default)"}`,
                background: i < step ? "rgba(16, 185, 129, 0.1)" : i === step ? "var(--violet-dim)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                color: i < step ? "var(--success)" : i === step ? "var(--violet)" : "var(--text-muted)",
                flexShrink: 0,
                transition: "all 0.2s",
              }}>
                {i < step ? "✓" : String(i + 1).padStart(2, "0")}
              </div>
              {/* Label */}
              <span style={{
                fontSize: "9px",
                color: i === step ? "var(--violet)" : "var(--text-muted)",
                letterSpacing: "0.15em",
                marginLeft: "6px",
                whiteSpace: "nowrap",
                transition: "color 0.2s",
              }}>
                {label}
              </span>
              {/* Connector */}
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: "1px",
                  background: i < step ? "var(--success)" : "var(--border-default)",
                  margin: "0 12px",
                  transition: "background 0.2s",
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          padding: "40px",
        }}>

          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              padding: "10px 14px",
              marginBottom: "24px",
              fontSize: "12px",
            }}>
              ✗ {error}
            </div>
          )}

          {/* ── STEP 0 : Choix du rôle ─────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.2em", marginBottom: "24px" }}>
                // STEP 01 — TON RÔLE
              </p>
              <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
                TU ES ORGANISATEUR ?
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "32px", lineHeight: "1.8" }}>
                Ce flow va créer ton profil organisateur sur Vybe.
                Tu pourras ensuite créer des événements, vendre des billets et accéder au dashboard.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                <RoleCard
                  selected
                  icon="🎛"
                  title="ORGANISATEUR / COLLECTIF"
                  description="Je crée des événements et je veux gérer mon audience"
                />
                <div style={{
                  border: "1px solid var(--border-default)",
                  padding: "16px 20px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  opacity: 0.5,
                }}>
                  <span style={{ fontSize: "18px" }}>🎫</span>
                  <div>
                    <p style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: "4px", letterSpacing: "0.05em" }}>
                      PARTICIPANT
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Je veux juste acheter des billets → <a href="/" style={{ color: "var(--violet)" }}>retour à l&apos;accueil</a>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="btn btn-primary btn-lg"
                style={{ width: "100%" }}
              >
                &gt; CONTINUER EN TANT QU&apos;ORGANISATEUR
              </button>
            </div>
          )}

          {/* ── STEP 1 : Infos collectif ──────────────────────────────────── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.2em", marginBottom: "24px" }}>
                // STEP 02 — TON COLLECTIF
              </p>
              <h2 style={{ fontSize: "18px", marginBottom: "24px" }}>
                INFOS DE TON COLLECTIF
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Nom */}
                <div>
                  <label style={labelStyle}>NOM DU COLLECTIF *</label>
                  <input
                    type="text"
                    placeholder="ex: Modulart, Kollektiv 808..."
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    maxLength={60}
                    autoFocus
                  />
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {form.name.length}/60 caractères
                  </p>
                </div>

                {/* Slug */}
                <div>
                  <label style={labelStyle}>
                    URL PUBLIQUE *
                    <span style={{
                      marginLeft: "8px",
                      fontSize: "9px",
                      color: slugStatus === "available" ? "var(--success)"
                        : slugStatus === "taken" ? "var(--danger)"
                        : slugStatus === "checking" ? "var(--warning)"
                        : "var(--text-muted)",
                    }}>
                      {slugStatus === "available" && "✓ DISPONIBLE"}
                      {slugStatus === "taken" && "✗ DÉJÀ PRIS"}
                      {slugStatus === "checking" && "// VÉRIFICATION..."}
                    </span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-default)", background: "var(--bg-secondary)" }}>
                    <span style={{
                      padding: "10px 12px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      borderRight: "1px solid var(--border-default)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                      vybe.fr/o/
                    </span>
                    <input
                      type="text"
                      placeholder="mon-collectif"
                      value={form.slug}
                      onChange={(e) => setForm((p) => ({
                        ...p,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40)
                      }))}
                      style={{ border: "none", borderRadius: 0, flex: 1 }}
                    />
                  </div>
                  {slugStatus === "taken" && slugSuggestion && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, slug: slugSuggestion }))}
                      style={{
                        marginTop: "6px",
                        background: "transparent",
                        border: "none",
                        color: "var(--violet)",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontFamily: "'Share Tech Mono', monospace",
                        padding: 0,
                      }}
                    >
                      → Utiliser &quot;{slugSuggestion}&quot; à la place
                    </button>
                  )}
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Uniquement lettres minuscules, chiffres et tirets. Non modifiable après création.
                  </p>
                </div>

                {/* Ville */}
                <div>
                  <label style={labelStyle}>VILLE PRINCIPALE *</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, city }))}
                        style={{
                          padding: "6px 14px",
                          background: form.city === city ? "var(--violet-dim)" : "transparent",
                          border: `1px solid ${form.city === city ? "var(--violet)" : "var(--border-default)"}`,
                          color: form.city === city ? "var(--violet)" : "var(--text-muted)",
                          cursor: "pointer",
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "11px",
                          letterSpacing: "0.05em",
                          transition: "all 0.15s",
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label style={labelStyle}>BIO COURTE <span style={{ color: "var(--text-muted)" }}>(optionnel)</span></label>
                  <textarea
                    placeholder="Quelques mots sur ton collectif, ton histoire, ta vision..."
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    style={{ resize: "vertical" }}
                  />
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {form.bio.length}/500 caractères
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                <button onClick={() => setStep(0)} className="btn btn-ghost" style={{ flex: 1 }}>
                  ← RETOUR
                </button>
                <button onClick={handleNext} className="btn btn-primary" style={{ flex: 2 }}>
                  CONTINUER →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 : Genres ──────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.2em", marginBottom: "24px" }}>
                // STEP 03 — TES GENRES
              </p>
              <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
                GENRES MUSICAUX
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                Sélectionne jusqu&apos;à 5 genres. Ils apparaîtront sur ton profil public.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                {GENRES.map((genre) => {
                  const selected = form.genres.includes(genre);
                  const maxReached = form.genres.length >= 5 && !selected;
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => !maxReached && toggleGenre(genre)}
                      style={{
                        padding: "8px 16px",
                        background: selected ? "var(--violet-dim)" : "transparent",
                        border: `1px solid ${selected ? "var(--violet)" : "var(--border-default)"}`,
                        color: selected ? "var(--violet)"
                          : maxReached ? "var(--text-muted)"
                          : "var(--text-secondary)",
                        cursor: maxReached ? "not-allowed" : "pointer",
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "11px",
                        letterSpacing: "0.08em",
                        transition: "all 0.15s",
                        opacity: maxReached ? 0.4 : 1,
                      }}
                    >
                      {selected && "✓ "}{genre}
                    </button>
                  );
                })}
              </div>

              <div style={{
                padding: "12px 16px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "24px",
              }}>
                {form.genres.length === 0
                  ? "Aucun genre sélectionné"
                  : `${form.genres.length}/5 — ${form.genres.join(", ")}`}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1 }}>
                  ← RETOUR
                </button>
                <button onClick={handleNext} className="btn btn-primary" style={{ flex: 2 }}>
                  CONTINUER →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 : Confirmation ────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.2em", marginBottom: "24px" }}>
                // STEP 04 — CONFIRMATION
              </p>
              <h2 style={{ fontSize: "18px", marginBottom: "24px" }}>
                RÉCAPITULATIF
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                <SummaryRow label="NOM" value={form.name} />
                <SummaryRow label="URL" value={`vybe.fr/o/${form.slug}`} accent />
                <SummaryRow label="VILLE" value={form.city} />
                <SummaryRow label="GENRES" value={form.genres.join(", ")} />
                {form.bio && <SummaryRow label="BIO" value={form.bio} />}
                <SummaryRow label="PLAN" value="STARTER — Gratuit, commission 5%" />
              </div>

              <div style={{
                marginTop: "24px",
                padding: "16px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                lineHeight: "1.8",
              }}>
                <p style={{ color: "var(--violet)", marginBottom: "8px", letterSpacing: "0.1em" }}>
                  // CE QUI VA SE PASSER
                </p>
                <p>✓ Ton profil organisateur est créé</p>
                <p>✓ Tu deviens Owner de ton collectif</p>
                <p>✓ Tu accèdes au Dashboard immédiatement</p>
                <p>✓ Stripe Connect à configurer pour les events payants</p>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                <button onClick={() => setStep(2)} className="btn btn-ghost" style={{ flex: 1 }} disabled={loading}>
                  ← RETOUR
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn btn-primary btn-lg"
                  style={{ flex: 2 }}
                  disabled={loading}
                >
                  {loading ? "// CRÉATION EN COURS..." : "// CRÉER MON PROFIL ORGANISATEUR"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Progress text */}
        <p style={{
          textAlign: "center",
          fontSize: "10px",
          color: "var(--text-muted)",
          marginTop: "20px",
          letterSpacing: "0.2em",
        }}>
          ÉTAPE {step + 1} / {steps.length}
        </p>

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RoleCard({ selected, icon, title, description }: {
  selected?: boolean;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div style={{
      border: `1px solid ${selected ? "var(--violet)" : "var(--border-default)"}`,
      background: selected ? "var(--violet-dim)" : "transparent",
      padding: "16px 20px",
      display: "flex",
      gap: "16px",
      alignItems: "flex-start",
      transition: "all 0.2s",
    }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <div>
        <p style={{
          fontSize: "12px",
          color: selected ? "var(--violet)" : "var(--text-primary)",
          marginBottom: "4px",
          letterSpacing: "0.05em",
        }}>
          {selected && "✓ "}{title}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{description}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent }: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      padding: "10px 0",
      borderBottom: "1px solid var(--border-default)",
    }}>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.15em", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{
        fontSize: "12px",
        color: accent ? "var(--violet)" : "var(--text-primary)",
        textAlign: "right",
        wordBreak: "break-all",
      }}>
        {value}
      </span>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  marginBottom: "6px",
};
