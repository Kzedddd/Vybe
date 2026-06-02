"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/");
      router.refresh();
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
            [ WELCOME BACK ]
          </h1>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
            // SIGN IN TO YOUR ACCOUNT //
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

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={labelStyle}>MOT DE PASSE</label>
                <Link
                  href="/auth/forgot-password"
                  style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.05em" }}
                >
                  / Oublié ?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "4px" }}
            >
              {loading ? "// CONNEXION EN COURS..." : "// SE CONNECTER"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "20px" }}>
          Pas encore de compte ?{" "}
          <Link href="/auth/register" style={{ color: "var(--violet)" }}>
            / Créer un compte
          </Link>
        </p>

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
  marginBottom: "0px",
};
