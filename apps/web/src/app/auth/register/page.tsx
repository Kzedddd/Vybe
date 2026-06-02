"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (formData.password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName } },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.3em", marginBottom: "12px" }}>
            ▶ VYBE
          </p>
          <h1 style={{ fontSize: "22px", color: "var(--text-primary)", marginBottom: "8px" }}>
            [ CREATE ACCOUNT ]
          </h1>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
            // JOIN THE UNDERGROUND //
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            padding: "32px",
          }}
        >
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                padding: "10px 14px",
                marginBottom: "20px",
                fontSize: "12px",
              }}
            >
              ✗ {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
              <label style={labelStyle}>NOM COMPLET</label>
              <input
                type="text"
                placeholder="Jean Dupont"
                value={formData.fullName}
                onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                placeholder="toi@example.com"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>MOT DE PASSE</label>
              <input
                type="password"
                placeholder="6 caractères minimum"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>CONFIRMER MOT DE PASSE</label>
              <input
                type="password"
                placeholder="Répète ton mot de passe"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "4px" }}
            >
              {loading ? "// CRÉATION EN COURS..." : "// CRÉER MON COMPTE"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "20px" }}>
          Déjà un compte ?{" "}
          <Link href="/auth/login" style={{ color: "var(--violet)" }}>
            / Connexion
          </Link>
        </p>

        {/* ASCII decoration */}
        <p style={{ textAlign: "center", fontSize: "10px", color: "var(--border-default)", marginTop: "32px", letterSpacing: "0.2em" }}>
          ─── ◈ ───
        </p>
      </div>
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
