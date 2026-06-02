import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vybe — L'OS des organisateurs underground",
    template: "%s — Vybe",
  },
  description:
    "Sur Shotgun, tu loues ton audience. Sur Vybe, tu la possèdes. Billetterie, intelligence comportementale, Cercles Privés.",
  keywords: ["événements", "underground", "techno", "billetterie", "organisateurs"],
  authors: [{ name: "Vybe" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Vybe",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080808",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile + organizer if connected
  let profile = null;
  let organizer = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, role, full_name, avatar_url, email")
      .eq("id", user.id)
      .single();

    profile = profileData;

    if (profileData?.role === "organizer") {
      const { data: organizerData } = await supabase
        .from("organizers")
        .select("id, name, slug, logo_url")
        .eq("profile_id", user.id)
        .single();
      organizer = organizerData;
    }
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar user={profile} organizer={organizer} />
        <main>{children}</main>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "12px",
              borderRadius: "0",
            },
            success: {
              iconTheme: { primary: "var(--success)", secondary: "var(--bg-primary)" },
            },
            error: {
              iconTheme: { primary: "var(--danger)", secondary: "var(--bg-primary)" },
            },
          }}
        />
      </body>
    </html>
  );
}
