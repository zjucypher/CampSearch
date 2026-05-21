import Link from "next/link";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";

export default function EmailPreviewPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-2)" }}>
      <Nav signedIn={true} />
      <div style={{ padding: "40px 32px 64px", flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: "var(--muted)", fontSize: 12.5 }}>
            <Link href="/dashboard">Dashboard</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: "var(--ink)" }}>Notification preview</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 32 }}>
            <div>
              <h2 style={{ fontSize: 26, marginBottom: 10 }}>Notification preview</h2>
              <p className="cs-muted" style={{ fontSize: 13.5, marginBottom: 24 }}>
                This is what hits your inbox the second a match opens. Optimized for tap-to-book on mobile.
              </p>
              <div className="cs-card" style={{ padding: 18 }}>
                <div className="cs-label" style={{ marginBottom: 10 }}>Email metadata</div>
                <div style={{ display: "grid", gap: 8, fontSize: 12.5 }}>
                  {[
                    ["From", "alerts@campsearch.app"],
                    ["Subject", "🏕 Site found — Upper Pines #14"],
                    ["Sent", "Today, 8:14 AM PT"],
                    ["Delivery time", "0.42s after match"],
                    ["Open rate (you)", "94% within 5m"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span className="cs-muted">{k}</span>
                      <span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 17, marginBottom: 10 }}>Why speed matters</h4>
                <p className="cs-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Median cancellation at Upper Pines is rebooked within{" "}
                  <strong style={{ color: "var(--accent)" }}>2 minutes 14 seconds</strong>. Our email + SMS dual-fires within 600ms of a match.
                </p>
              </div>
            </div>

            {/* Email body */}
            <div className="cs-email">
              <div style={{ padding: "10px 16px", background: "#f4f4f4", color: "#666", fontSize: 11, borderBottom: "1px solid #e5e5e5" }}>
                CampSearch &nbsp;·&nbsp; alerts@campsearch.app &nbsp;·&nbsp; to jordan@example.com
              </div>
              <div style={{ padding: "32px 36px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 6, background: "#2D4A36", color: "#FBF6EA",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                  }}>🌲</span>
                  <strong style={{ fontSize: 14, color: "#2D4A36" }}>CampSearch</strong>
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 500, color: "#1a1a1a", marginBottom: 12, lineHeight: 1.2 }}>
                  Site found —<br />Upper Pines #14
                </div>
                <p style={{ color: "#444", lineHeight: 1.55, marginBottom: 24, fontSize: 14 }}>
                  Jordan, a campsite matching your alert just opened up. It's available right now on Recreation.gov.
                  These don't last — most go in under 3 minutes.
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
                  <tbody>
                    {[
                      ["Campground", "Upper Pines"],
                      ["Park", "Yosemite National Park"],
                      ["Site", "14 · Tent · sleeps 6"],
                      ["Dates", "Sat Jul 18 → Mon Jul 20, 2026 · 2 nights"],
                      ["Total", "$72.00"],
                      ["Opened", "8:14:02 AM PT · 0.4s ago"],
                    ].map(([k, v], i) => (
                      <tr key={k} style={{ borderTop: i === 0 ? "1px solid #eee" : "none", borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px 0", color: "#888", width: 130, fontSize: 12 }}>{k}</td>
                        <td style={{ padding: "10px 0", color: "#1a1a1a", fontWeight: 500 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <a style={{
                  display: "inline-block", padding: "14px 22px",
                  background: "#2D4A36", color: "#FBF6EA",
                  fontWeight: 600, borderRadius: 6, textDecoration: "none",
                  marginBottom: 14, fontSize: 14,
                }}>Book now on Recreation.gov →</a>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Tip: have your Recreation.gov login handy. Sites at Upper Pines are usually claimed within 2–3 minutes of opening.
                </div>
                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "28px 0" }} />
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
                  You're receiving this because alert "Upper Pines · Jul 18–20" matched.{" "}
                  <a style={{ color: "#2D4A36" }}>Pause this alert</a> ·{" "}
                  <a style={{ color: "#2D4A36" }}>Unsubscribe</a> ·{" "}
                  <a style={{ color: "#2D4A36" }}>Manage alerts</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
