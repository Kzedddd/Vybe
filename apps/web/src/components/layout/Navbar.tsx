"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/layout/NotificationBell";

interface NavbarProps {
  user: {
    id: string;
    role: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  organizer: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
}

export default function Navbar({ user, organizer }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = createClient();

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Don't show navbar on auth pages
  if (pathname.startsWith("/auth/")) return null;

  return (
    <nav style={{
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-default)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
      }}>

        {/* Left — Brand + nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {/* Brand */}
          <Link href="/" style={{
            fontSize: "16px",
            color: "var(--violet)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontWeight: 400,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>▶</span>
            VYBE
          </Link>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <NavLink href="/events" active={isActive("/events")}>EVENTS</NavLink>
            {user?.role === "organizer" && (
              <>
                <NavLink href="/dashboard" active={isActive("/dashboard")}>DASHBOARD</NavLink>
                <NavLink href="/dashboard/radar" active={isActive("/dashboard/radar")}>RADAR</NavLink>
                <NavLink href="/dashboard/circles" active={isActive("/dashboard/circles")}>CERCLES</NavLink>
                <NavLink href="/dashboard/badges" active={isActive("/dashboard/badges")}>BADGES</NavLink>
                <NavLink href="/scanner" active={isActive("/scanner")}>SCANNER</NavLink>
              </>
            )}
            {user?.role === "admin" && (
              <NavLink href="/admin" active={isActive("/admin")}>ADMIN</NavLink>
            )}
          </div>
        </div>

        {/* Right — Auth actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

          {user && <NotificationBell />}
          {!user ? (
            <>
              <Link href="/auth/login" style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}>
                CONNEXION
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">
                &gt; S&apos;INSCRIRE
              </Link>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {user.role === "participant" && (
                <NavLink href="/my/tickets" active={isActive("/my/tickets")}>MES BILLETS</NavLink>
              )}
              {user.role === "organizer" && organizer && (
                <span style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  borderLeft: "1px solid var(--border-default)",
                  paddingLeft: "16px",
                }}>
                  <span style={{ color: "var(--violet)" }}>◈</span> {organizer.name}
                </span>
              )}

              {/* User dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "border-color 0.15s",
                  }}
                >
                  <span style={{
                    width: "20px",
                    height: "20px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--violet)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    color: "var(--violet)",
                    flexShrink: 0,
                  }}>
                    {(user.full_name?.[0] ?? user.email[0]).toUpperCase()}
                  </span>
                  {menuOpen ? "▲" : "▼"}
                </button>

                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 99 }}
                      onClick={() => setMenuOpen(false)}
                    />
                    {/* Dropdown */}
                    <div style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      minWidth: "200px",
                      zIndex: 200,
                    }}>
                      <div style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border-default)",
                      }}>
                        <p style={{ fontSize: "11px", color: "var(--text-primary)", marginBottom: "2px" }}>
                          {user.full_name ?? "—"}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{user.email}</p>
                        <p style={{
                          fontSize: "9px",
                          color: "var(--violet)",
                          letterSpacing: "0.15em",
                          marginTop: "4px",
                          textTransform: "uppercase",
                        }}>
                          {user.role}
                        </p>
                      </div>

                      <div style={{ padding: "8px 0" }}>
                        {user.role === "participant" && (
                          <>
                            <MenuItem href="/my/tickets" label="Mes billets" onClick={() => setMenuOpen(false)} />
                            <MenuItem href="/my/profile" label="Mon profil" onClick={() => setMenuOpen(false)} />
                          </>
                        )}
                        {user.role === "organizer" && (
                          <>
                            <MenuItem href="/dashboard" label="Dashboard" onClick={() => setMenuOpen(false)} />
                            <MenuItem href="/dashboard/events" label="Mes événements" onClick={() => setMenuOpen(false)} />
                            <MenuItem href="/dashboard/circles" label="Mes cercles" onClick={() => setMenuOpen(false)} />
                            <MenuItem href="/dashboard/team" label="Mon équipe" onClick={() => setMenuOpen(false)} />
                            <MenuItem href="/dashboard/settings" label="Paramètres" onClick={() => setMenuOpen(false)} />
                          </>
                        )}
                      </div>

                      <div style={{ borderTop: "1px solid var(--border-default)", padding: "8px 0" }}>
                        <button
                          onClick={handleSignOut}
                          disabled={signingOut}
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            color: "var(--danger)",
                            padding: "8px 16px",
                            cursor: signingOut ? "not-allowed" : "pointer",
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "11px",
                            textAlign: "left",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            opacity: signingOut ? 0.5 : 1,
                          }}
                        >
                          {signingOut ? "// Déconnexion..." : "/ Déconnexion"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function NavLink({ href, active, children }: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} style={{
      fontSize: "11px",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: active ? "var(--violet)" : "var(--text-muted)",
      textDecoration: "none",
      transition: "color 0.15s",
      borderBottom: active ? "1px solid var(--violet)" : "1px solid transparent",
      paddingBottom: "2px",
    }}>
      {children}
    </Link>
  );
}

function MenuItem({ href, label, onClick }: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "8px 16px",
        fontSize: "11px",
        color: "var(--text-secondary)",
        textDecoration: "none",
        letterSpacing: "0.05em",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "var(--bg-hover)";
        el.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "transparent";
        el.style.color = "var(--text-secondary)";
      }}
    >
      / {label}
    </Link>
  );
}
