"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import Photo from "@/components/cs/Photo";
import Sparkline from "@/components/cs/Sparkline";
import Toast from "@/components/cs/Toast";
import { alerts, history, campgrounds, type Alert } from "@/lib/data";

export default function DashboardPage() {
  const router = useRouter();
  const [active, setActive] = useState(alerts[0].id);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setToastOpen(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const activeAlert = alerts.find((a) => a.id === active) ?? alerts[0];
  const activeCampground = campgrounds.find((c) => c.name === activeAlert.campground);
  const polls = [4, 7, 3, 9, 11, 6, 5, 8, 13, 9, 7, 11, 14, 8, 6];

  const stats = [
    ["Active alerts", "3", "of 5 in plan"],
    ["Hits this month", "12", "+4 vs April"],
    ["Avg. response time", "47s", "from open → ping"],
    ["Watched campgrounds", "5", "across 4 parks"],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav signedIn={true} current="dashboard" />
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "32px 32px 64px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <div className="cs-label" style={{ marginBottom: 8 }}>Welcome back, Jordan</div>
            <h1 style={{ fontSize: 40 }}>Your watchlist</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="cs-btn cs-btn--ghost" onClick={() => setToastOpen(true)}>
              <Icon name="sparkles" size={14} /> Simulate a hit
            </button>
            <Link href="/search" className="cs-btn">
              <Icon name="plus" size={14} /> New alert
            </Link>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {stats.map(([k, v, sub]) => (
            <div key={k} className="cs-card" style={{ padding: 20 }}>
              <div className="cs-label" style={{ marginBottom: 10 }}>{k}</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 500, lineHeight: 1 }}>{v}</div>
                <span className="cs-muted cs-mono" style={{ fontSize: 11 }}>{sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 28 }}>
          {/* Left: alerts table + history */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <h2 style={{ fontSize: 22 }}>Active alerts</h2>
              <div style={{ display: "flex", gap: 14, fontSize: 12.5 }}>
                <a style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)", paddingBottom: 2, cursor: "pointer" }}>All · 4</a>
                <a className="cs-muted" style={{ cursor: "pointer" }}>Monitoring · 2</a>
                <a className="cs-muted" style={{ cursor: "pointer" }}>Paused · 1</a>
              </div>
            </div>

            <div className="cs-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1fr 110px",
                padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)",
              }}>
                {["Alert", "Dates", "Status", "Hits"].map((h) => (
                  <div key={h} className="cs-label">{h}</div>
                ))}
              </div>
              {alerts.map((a, i) => (
                <button key={a.id} onClick={() => setActive(a.id)}
                  style={{
                    display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1fr 110px",
                    padding: "16px 18px", width: "100%", textAlign: "left",
                    background: active === a.id ? "var(--surface-2)" : "transparent",
                    border: "none", borderBottom: i < alerts.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer", alignItems: "center",
                  }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.campground}</div>
                    <div className="cs-muted" style={{ fontSize: 11.5 }}>{a.park} · sites: {a.sites}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13 }}>{a.dates}</div>
                    <div className="cs-muted cs-mono" style={{ fontSize: 11 }}>{a.nights}n · {a.flexibility}</div>
                  </div>
                  <div>
                    <StatusPill status={a.status} />
                    <div className="cs-muted cs-mono" style={{ fontSize: 10.5, marginTop: 4 }}>Last check {a.lastCheck}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{a.hits}</span>
                    <Icon name="chevron" size={14} />
                  </div>
                </button>
              ))}
            </div>

            {/* History */}
            <div style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 22, marginBottom: 12 }}>Recent activity</h2>
              <div className="cs-card" style={{ padding: 0 }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "150px 1fr 130px",
                    padding: "12px 18px",
                    borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none",
                    alignItems: "center",
                  }}>
                    <div className="cs-mono cs-muted" style={{ fontSize: 11.5 }}>{h.when}</div>
                    <div style={{ fontSize: 13 }}>{h.text}</div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`cs-pill${h.action === "Notified" ? " cs-pill--accent" : ""}`} style={{ fontSize: 10.5 }}>
                        {h.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: sidebar detail */}
          <div className="cs-card" style={{ padding: 22, position: "sticky", top: 32, alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div className="cs-label" style={{ marginBottom: 6 }}>{activeAlert.park}</div>
                <h3 style={{ fontSize: 22 }}>{activeAlert.campground}</h3>
              </div>
              <button className="cs-btn cs-btn--quiet cs-btn--sm"><Icon name="settings" size={14} /></button>
            </div>
            {activeCampground && <Photo label={activeCampground.id} height={140} style={{ marginBottom: 16 }} />}

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <StatusPill status={activeAlert.status} hits={activeAlert.hits} />
              <span className="cs-pill cs-pill--muted">{activeAlert.frequency}</span>
            </div>

            <div style={{ display: "grid", gap: 10, fontSize: 13, marginBottom: 18 }}>
              {[
                ["Dates", activeAlert.dates],
                ["Flexibility", activeAlert.flexibility],
                ["Watching", activeAlert.sites],
                ["Created", activeAlert.created],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="cs-muted">{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="cs-label" style={{ marginBottom: 8 }}>Poll activity · 24h</div>
            <Sparkline data={polls} />
            <div className="cs-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>
              <span>1,440 checks</span><span>2 hits</span>
            </div>

            <hr className="cs-divider" style={{ margin: "18px 0" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="cs-btn cs-btn--ghost cs-btn--sm" style={{ flex: 1 }}>
                <Icon name={activeAlert.status === "paused" ? "play" : "pause"} size={12} />
                {activeAlert.status === "paused" ? "Resume" : "Pause"}
              </button>
              <button className="cs-btn cs-btn--ghost cs-btn--sm" style={{ flex: 1 }}>Edit</button>
            </div>
          </div>
        </div>
      </div>

      <Toast
        open={toastOpen}
        onDismiss={() => setToastOpen(false)}
        onView={() => { setToastOpen(false); router.push("/alerts/a2/preview"); }}
      />
    </div>
  );
}

function StatusPill({ status, hits }: { status: Alert["status"]; hits?: number }) {
  if (status === "found") return <span className="cs-pill cs-pill--success"><span className="cs-dot" />{hits ? ` ${hits} hits this week` : " Hit pending"}</span>;
  if (status === "monitoring") return <span className="cs-pill"><span className="cs-dot" style={{ background: "var(--success)" }} /> Monitoring</span>;
  return <span className="cs-pill cs-pill--muted"><Icon name="pause" size={9} /> Paused</span>;
}
