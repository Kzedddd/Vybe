"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/"), 2500);
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
            [ NOUVEAU MOT DE PASSE ]
          </h1>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
            // CHOISIS UN MOT DE PASSE SÉCURISÉ //
          </p>
        </div>

        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          padding: "32px",
        }}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", color: "var(--violet)", marginBottom: "16px" }}>✓</div>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", letterSpacing: "0.05em", marginBottom: "8px" }}>
                MOT DE PASSE MODIFIÉ
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Redirection en cours...
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
                  <label style={labelStyle}>NOUVEAU MOT DE PASSE</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label style={labelStyle}>CONFIRMER</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Répète ton mot de passe"
                    required
                  />
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: "2px",
                          background: password.length >= i * 3
                            ? i <= 1 ? "var(--danger)"
                              : i <= 2 ? "var(--warning)"
                              : i <= 3 ? "var(--info)"
                              : "var(--success)"
                            : "var(--border-default)",
                          transition: "background 0.2s",
                        }}
                      />
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%" }}
                >
                  {loading ? "// MODIFICATION EN COURS..." : "// ENREGISTRER"}
                </button>
              </form>
            </>
          )}
        </div>

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
