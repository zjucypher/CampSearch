"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import Photo from "@/components/cs/Photo";
import Sparkline from "@/components/cs/Sparkline";
import Toast from "@/components/cs/Toast";
import type { Database } from "@/lib/supabase/types";

type Alert = Database["public"]["Tables"]["alerts"]["Row"] & {
  campgrounds: { id: string; name: string; park: string } | null;
};
type HistoryRow = Database["public"]["Tables"]["alert_history"]["Row"] & {
  alerts: { campground_id: string; campgrounds: { name: string } | null } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatDateRange(arrive: string, depart: string) {
  const a = new Date(arrive);
  const d = new Date(depart);
  return `${a.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return formatDate(iso);
}

function getSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastCampground, setToastCampground] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [alertsRes, historyRes] = await Promise.all([
      fetch("/api/alerts"),
      fetch("/api/history"),
    ]);
    const alertsData = await alertsRes.json();
    const historyData = await historyRes.json();
    const list: Alert[] = alertsData.alerts ?? [];
    setAlerts(list);
    setHistory(historyData.history ?? []);
    setActiveId((prev) => list.find((a) => a.id === prev) ? prev : list[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Supabase Realtime — fire toast on new "notified" history events
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("dashboard-hits")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alert_history", filter: `event_type=eq.notified` },
        (payload) => {
          const row = payload.new as HistoryRow;
          const alert = alerts.find((a) => a.id === row.alert_id);
          setToastCampground(alert?.campgrounds?.name ?? "A campsite");
          setToastOpen(true);
          fetchData();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [alerts, fetchData]);

  async function handlePauseResume(alert: Alert) {
    setActionLoading(alert.id);
    const newStatus = alert.status === "paused" ? "monitoring" : "paused";
    await fetch(`/api/alerts/${alert.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchData();
    setActionLoading(null);
  }

  async function handleDelete(alert: Alert) {
    if (!confirm(`Delete alert for ${alert.campgrounds?.name ?? "this campground"}?`)) return;
    setActionLoading(alert.id);
    await fetch(`/api/alerts/${alert.id}`, { method: "DELETE" });
    await fetchData();
    setActionLoading(null);
  }

  async function handleSimulate() {
    if (!activeId) return;
    const res = await fetch(`/api/alerts/${activeId}/simulate`, { method: "POST" });
    if (res.ok) { await fetchData(); }
  }

  const activeAlert = alerts.find((a) => a.id === activeId);
  const polls = [4, 7, 3, 9, 11, 6, 5, 8, 13, 9, 7, 11, 14, 8, 6];

  const monitoring = alerts.filter((a) => a.status === "monitoring").length;
  const paused = alerts.filter((a) => a.status === "paused").length;
  const totalHits = alerts.reduce((s, a) => s + a.hits, 0);

  const stats = [
    ["Active alerts", String(monitoring), `${alerts.length} total`],
    ["Hits this month", String(totalHits), totalHits === 0 ? "none yet" : "across all alerts"],
    ["Avg. response time", "47s", "from open → ping"],
    ["Watched campgrounds", String(new Set(alerts.map((a) => a.campground_id)).size), "unique"],
  ];

  function historyLabel(h: HistoryRow) {
    const name = (h.alerts as { campgrounds?: { name?: string } } | null)?.campgrounds?.name ?? "Unknown";
    if (h.event_type === "notified") return `Hit at ${name} — site ${h.site_name ?? h.site_id}`;
    if (h.event_type === "paused") return `Alert paused — ${name}`;
    if (h.event_type === "resumed") return `Alert resumed — ${name}`;
    if (h.event_type === "check") return `Checked ${name}`;
    return `${h.event_type} — ${name}`;
  }

  function historyAction(h: HistoryRow) {
    if (h.event_type === "notified") return "Notified";
    if (h.event_type === "paused") return "Paused";
    if (h.event_type === "resumed") return "Resumed";
    return "Checked";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav signedIn={true} current="dashboard" />
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "32px 32px 64px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <div className="cs-label" style={{ marginBottom: 8 }}>Welcome back</div>
            <h1 style={{ fontSize: 40 }}>Your watchlist</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="cs-btn cs-btn--ghost" onClick={handleSimulate} disabled={!activeId}>
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
                <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 500, lineHeight: 1 }}>{loading ? "—" : v}</div>
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
                <a style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)", paddingBottom: 2 }}>All · {alerts.length}</a>
                <a className="cs-muted">Monitoring · {monitoring}</a>
                <a className="cs-muted">Paused · {paused}</a>
              </div>
            </div>

            <div className="cs-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1fr 130px",
                padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)",
              }}>
                {["Alert", "Dates", "Status", "Hits"].map((h) => (
                  <div key={h} className="cs-label">{h}</div>
                ))}
              </div>

              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ height: 60, borderBottom: "1px solid var(--border)", background: "var(--surface-2)", opacity: 0.3 + i * 0.15 }} />
                ))
              ) : alerts.length === 0 ? (
                <div style={{ padding: "32px 18px", textAlign: "center" }}>
                  <p className="cs-muted" style={{ marginBottom: 14 }}>No alerts yet.</p>
                  <Link href="/search" className="cs-btn cs-btn--sm"><Icon name="plus" size={13} /> Create your first alert</Link>
                </div>
              ) : (
                alerts.map((a, i) => (
                  <button key={a.id} onClick={() => setActiveId(a.id)}
                    style={{
                      display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1fr 130px",
                      padding: "16px 18px", width: "100%", textAlign: "left",
                      background: activeId === a.id ? "var(--surface-2)" : "transparent",
                      border: "none", borderBottom: i < alerts.length - 1 ? "1px solid var(--border)" : "none",
                      cursor: "pointer", alignItems: "center",
                    }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.campgrounds?.name ?? a.campground_id}</div>
                      <div className="cs-muted" style={{ fontSize: 11.5 }}>{a.campgrounds?.park} · {a.site_mode === "specific" ? `sites: ${a.site_ids.join(", ")}` : "any site"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13 }}>{formatDateRange(a.arrive_date, a.depart_date)}</div>
                      <div className="cs-muted cs-mono" style={{ fontSize: 11 }}>±{a.flexibility === "exact" ? "0" : a.flexibility} · {a.poll_interval}s</div>
                    </div>
                    <div>
                      <StatusPill status={a.status} hits={a.hits} />
                      <div className="cs-muted cs-mono" style={{ fontSize: 10.5, marginTop: 4 }}>
                        {a.last_checked_at ? `Checked ${timeAgo(a.last_checked_at)}` : "Not yet checked"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{a.hits}</span>
                      <Icon name="chevron" size={14} />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* History */}
            <div style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 22, marginBottom: 12 }}>Recent activity</h2>
              <div className="cs-card" style={{ padding: 0 }}>
                {history.length === 0 ? (
                  <div style={{ padding: "24px 18px", textAlign: "center" }}>
                    <p className="cs-muted" style={{ fontSize: 13 }}>No activity yet — activity appears once monitoring starts.</p>
                  </div>
                ) : (
                  history.map((h, i) => (
                    <div key={h.id} style={{
                      display: "grid", gridTemplateColumns: "110px 1fr 100px",
                      padding: "12px 18px",
                      borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none",
                      alignItems: "center",
                    }}>
                      <div className="cs-mono cs-muted" style={{ fontSize: 11 }}>{timeAgo(h.created_at)}</div>
                      <div style={{ fontSize: 13 }}>{historyLabel(h)}</div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`cs-pill${h.event_type === "notified" ? " cs-pill--accent" : ""}`} style={{ fontSize: 10.5 }}>
                          {historyAction(h)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: sidebar detail */}
          <div className="cs-card" style={{ padding: 22, position: "sticky", top: 32, alignSelf: "start" }}>
            {!activeAlert ? (
              <p className="cs-muted" style={{ fontSize: 13 }}>Select an alert to see details.</p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div className="cs-label" style={{ marginBottom: 6 }}>{activeAlert.campgrounds?.park}</div>
                    <h3 style={{ fontSize: 22 }}>{activeAlert.campgrounds?.name ?? activeAlert.campground_id}</h3>
                  </div>
                  <button className="cs-btn cs-btn--quiet cs-btn--sm" onClick={() => router.push(`/campgrounds/${activeAlert.campground_id}/alert/new`)}>
                    <Icon name="settings" size={14} />
                  </button>
                </div>
                <Photo label={activeAlert.campground_id} height={140} style={{ marginBottom: 16 }} />

                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  <StatusPill status={activeAlert.status} hits={activeAlert.hits} />
                  <span className="cs-pill cs-pill--muted">Every {activeAlert.poll_interval}s</span>
                </div>

                <div style={{ display: "grid", gap: 10, fontSize: 13, marginBottom: 18 }}>
                  {[
                    ["Dates", formatDateRange(activeAlert.arrive_date, activeAlert.depart_date)],
                    ["Flexibility", activeAlert.flexibility],
                    ["Sites", activeAlert.site_mode === "specific" ? activeAlert.site_ids.join(", ") : "Any matching"],
                    ["Created", formatDate(activeAlert.created_at)],
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
                  <span>1,440 checks</span><span>{activeAlert.hits} hits</span>
                </div>

                <hr className="cs-divider" style={{ margin: "18px 0" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="cs-btn cs-btn--ghost cs-btn--sm"
                    style={{ flex: 1 }}
                    disabled={actionLoading === activeAlert.id}
                    onClick={() => handlePauseResume(activeAlert)}
                  >
                    <Icon name={activeAlert.status === "paused" ? "play" : "pause"} size={12} />
                    {activeAlert.status === "paused" ? "Resume" : "Pause"}
                  </button>
                  <button
                    className="cs-btn cs-btn--ghost cs-btn--sm"
                    style={{ flex: 1, color: "var(--accent)" }}
                    disabled={actionLoading === activeAlert.id}
                    onClick={() => handleDelete(activeAlert)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Toast
        open={toastOpen}
        onDismiss={() => setToastOpen(false)}
        onView={() => { setToastOpen(false); router.push(`/alerts/${activeId}/preview`); }}
      />
    </div>
  );
}

function StatusPill({ status, hits }: { status: string; hits?: number }) {
  if (status === "found") return <span className="cs-pill cs-pill--success"><span className="cs-dot" />{hits ? ` ${hits} hits` : " Hit"}</span>;
  if (status === "monitoring") return <span className="cs-pill"><span className="cs-dot" style={{ background: "var(--success)" }} /> Monitoring</span>;
  return <span className="cs-pill cs-pill--muted"><Icon name="pause" size={9} /> Paused</span>;
}
