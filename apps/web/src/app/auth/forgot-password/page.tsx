"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSent(true);
    } catch {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.3em", marginBottom: "12px" }}>
            ▶ VYBE
          </p>
          <h1 style={{ fontSize: "22px", marginBottom: "8px" }}>
            [ MOT DE PASSE OUBLIÉ ]
          </h1>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
            // UN LIEN DE RÉINITIALISATION SERA ENVOYÉ //
          </p>
        </div>

        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          padding: "32px",
        }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "32px",
                color: "var(--violet)",
                marginBottom: "20px",
              }}>
                ✓
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                EMAIL ENVOYÉ
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.8" }}>
                Si un compte existe avec l&apos;adresse <span style={{ color: "var(--violet)" }}>{email}</span>,
                tu recevras un lien de réinitialisation dans les prochaines minutes.
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                // Vérifie aussi tes spams //
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                  padding: "10px 14px",
                  marginBottom: "20px",
                  fontSize: "12px",
                }}>
                  ✗ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@example.com"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%" }}
                >
                  {loading ? "// ENVOI EN COURS..." : "// ENVOYER LE LIEN"}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "20px" }}>
          <Link href="/auth/login" style={{ color: "var(--violet)" }}>
            ← Retour à la connexion
          </Link>
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
