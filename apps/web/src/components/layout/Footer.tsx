'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{
      background: "#0f0f0f",
      color: "#888888",
      padding: "48px 24px",
      borderTop: "1px solid #222222",
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: "13px",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "32px",
          marginBottom: "32px",
        }}>
          {/* Brand */}
          <div>
            <div style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#39ff14",
              marginBottom: "16px",
              letterSpacing: "0.1em",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span>&gt;</span>
              <span>[ VYBE ]</span>
            </div>
            <p style={{
              color: "#666666",
              fontSize: "12px",
              lineHeight: "1.6",
            }}>
              Underground Events Network<br/>
              Découvre les meilleurs événements
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 style={{
              color: "#e8e8e8",
              fontWeight: "bold",
              marginBottom: "16px",
              textTransform: "uppercase",
              fontSize: "13px",
              letterSpacing: "0.05em",
            }}>// Product</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "8px" }}>
                <Link href="/events" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#39ff14")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
                  / events
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link href="/discover" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#39ff14")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
                  / discover
                </Link>
              </li>
              <li>
                <Link href="/groups" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#39ff14")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
                  / communities
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 style={{
              color: "#e8e8e8",
              fontWeight: "bold",
              marginBottom: "16px",
              textTransform: "uppercase",
              fontSize: "13px",
              letterSpacing: "0.05em",
            }}>// About</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "8px" }}>
                <Link href="#" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#00ffcc")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
                  / about
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link href="#" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#00ffcc")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
                  / blog
                </Link>
              </li>
              <li>
                <Link href="#" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#00ffcc")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
                  / contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{
              color: "#e8e8e8",
              fontWeight: "bold",
              marginBottom: "16px",
              textTransform: "uppercase",
              fontSize: "13px",
              letterSpacing: "0.05em",
            }}>// Legal</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "8px" }}>
                <Link href="#" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#00ffcc")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
                  / privacy
                </Link>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <Link href="#" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#00ffcc")} onMouseLeave={(e) => (e.currenturrent.style.color = "#888888")}>
                  / terms
                </Link>
              </li>
              <li>
                <Link href="#" style={{
                  color: "#888888",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }} onMouseEnter={(e) => (e.currentTarget.style.color = "#00ffcc")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
                  / sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: "1px solid #222222",
          paddingTop: "32px",
          textAlign: "center",
          color: "#666666",
          fontSize: "12px",
        }}>
          <p style={{ margin: 0 }}>
            [ VYBE ] // UNDERGROUND EVENTS NETWORK // EST. 2025
          </p>
        </div>
      </div>
    </footer>
  )
}
