"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  campgrounds: { id: string; name: string; park: string; photo_url: string | null } | null;
};
type HistoryRow = Database["public"]["Tables"]["alert_history"]["Row"] & {
  alerts: { campground_id: string; campgrounds: { name: string } | null } | null;
};

function formatDate(iso: string) {
  return new Date(iso.includes("T") ? iso : iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatDateRange(arrive: string, depart: string) {
  const a = new Date(arrive.includes("T") ? arrive : arrive + "T12:00:00");
  const d = new Date(depart.includes("T") ? depart : depart + "T12:00:00");
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
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [expandedHitId, setExpandedHitId] = useState<string | null>(null);
  const [hitsAlertId, setHitsAlertId]     = useState<string | null>(null);
  const [hitsList, setHitsList]           = useState<HistoryRow[]>([]);
  const [hitsLoading, setHitsLoading]     = useState(false);
  const [toastOpen, setToastOpen]         = useState(false);
  const [toastHit, setToastHit] = useState({ campground: "", site: "", arrive: "", depart: "", url: "" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "monitoring" | "paused">("all");
  const alertsRef = useRef<Alert[]>([]);

  const fetchData = useCallback(async () => {
    const [alertsRes, historyRes] = await Promise.all([
      fetch("/api/alerts"),
      fetch("/api/history"),
    ]);
    const alertsData = await alertsRes.json();
    const historyData = await historyRes.json();
    const list: Alert[] = alertsData.alerts ?? [];
    alertsRef.current = list;
    setAlerts(list);
    setHistory(historyData.history ?? []);
    setActiveId((prev) => list.find((a) => a.id === prev) ? prev : list[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch all notified events for a specific alert when the hits panel opens
  useEffect(() => {
    if (!hitsAlertId) { setHitsList([]); return; }
    setHitsLoading(true);
    fetch(`/api/history?alert_id=${hitsAlertId}&event_type=notified&limit=100`)
      .then((r) => r.json())
      .then((d) => setHitsList(d.history ?? []))
      .finally(() => setHitsLoading(false));
  }, [hitsAlertId]);

  // Supabase Realtime — refresh on any activity or alert status change.
  // user_id filter is required on RLS-enabled tables so the server knows
  // which rows to deliver; without it only filtered subscriptions work.
  // alertsRef (not alerts state) is used in the callback so this effect
  // only runs once on mount, avoiding a subscribe/teardown loop.
  useEffect(() => {
    const supabase = getSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      channel = supabase
        .channel("dashboard-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "alert_history",
            filter: `user_id=eq.${user.id}` },
          (payload) => {
            const row = payload.new as HistoryRow;
            if (row.event_type === "notified") {
              const alert = alertsRef.current.find((a) => a.id === row.alert_id);
              const detail = row.detail as { booking_url?: string } | null;
              setToastHit({
                campground: alert?.campgrounds?.name ?? "A campsite",
                site: row.site_name ?? "",
                arrive: row.arrive_date ?? "",
                depart: row.depart_date ?? "",
                url: detail?.booking_url ?? "",
              });
              setToastOpen(true);
            }
            fetchData();
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "alerts",
            filter: `user_id=eq.${user.id}` },
          () => { fetchData(); }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchData]);

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

  const filteredAlerts = filterStatus === "all" ? alerts : alerts.filter((a) => a.status === filterStatus);
  const activeAlert = filteredAlerts.find((a) => a.id === activeId) ?? alerts.find((a) => a.id === activeId);
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
    const detail = h.detail as { campground_name?: string } | null;
    const name = (h.alerts as { campgrounds?: { name?: string } } | null)?.campgrounds?.name
      ?? detail?.campground_name
      ?? "Unknown";
    if (h.event_type === "notified") return `Hit at ${name} — site ${h.site_name ?? h.site_id}`;
    if (h.event_type === "paused") return `Alert paused — ${name}`;
    if (h.event_type === "resumed") return `Alert resumed — ${name}`;
    if (h.event_type === "deleted") return `Alert deleted — ${name}`;
    if (h.event_type === "check") return `Checked ${name}`;
    return `${h.event_type} — ${name}`;
  }

  function historyAction(h: HistoryRow) {
    if (h.event_type === "notified") return "Notified";
    if (h.event_type === "paused") return "Paused";
    if (h.event_type === "resumed") return "Resumed";
    if (h.event_type === "deleted") return "Deleted";
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
                {(["all", "monitoring", "paused"] as const).map((f) => {
                  const count = f === "all" ? alerts.length : f === "monitoring" ? monitoring : paused;
                  const label = f === "all" ? "All" : f === "monitoring" ? "Monitoring" : "Paused";
                  const active = filterStatus === f;
                  return (
                    <a
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      style={{
                        cursor: "pointer",
                        color: active ? "var(--ink)" : "var(--muted)",
                        borderBottom: active ? "1px solid var(--ink)" : "1px solid transparent",
                        paddingBottom: 2,
                      }}
                    >
                      {label} · {count}
                    </a>
                  );
                })}
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
              ) : filteredAlerts.length === 0 ? (
                <div style={{ padding: "32px 18px", textAlign: "center" }}>
                  {alerts.length === 0 ? (
                    <>
                      <p className="cs-muted" style={{ marginBottom: 14 }}>No alerts yet.</p>
                      <Link href="/search" className="cs-btn cs-btn--sm"><Icon name="plus" size={13} /> Create your first alert</Link>
                    </>
                  ) : (
                    <p className="cs-muted">No {filterStatus} alerts.</p>
                  )}
                </div>
              ) : (
                filteredAlerts.map((a, i) => (
                  <div key={a.id} onClick={() => setActiveId(a.id)}
                    style={{
                      display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1fr 130px",
                      padding: "16px 18px", width: "100%", textAlign: "left",
                      background: activeId === a.id ? "var(--surface-2)" : "transparent",
                      borderBottom: i < filteredAlerts.length - 1 ? "1px solid var(--border)" : "none",
                      cursor: "pointer", alignItems: "center",
                    }}>
                    <div>
                      <div
                        onClick={(e) => { e.stopPropagation(); router.push(`/campgrounds/${a.campground_id}`); }}
                        style={{ fontWeight: 600, fontSize: 13.5, color: "var(--primary)", textDecoration: "underline", textDecorationColor: "transparent", cursor: "pointer", display: "inline" }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "var(--primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "transparent")}
                      >
                        {a.campgrounds?.name ?? a.campground_id}
                      </div>
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (a.hits === 0) return;
                          setActiveId(a.id);
                          setHitsAlertId((prev) => prev === a.id ? null : a.id);
                        }}
                        style={{
                          background: hitsAlertId === a.id ? "color-mix(in oklch, var(--success) 12%, var(--surface-2))" : "transparent",
                          border: hitsAlertId === a.id ? "1px solid color-mix(in oklch, var(--success) 30%, var(--border))" : "1px solid transparent",
                          borderRadius: "var(--cs-radius)",
                          cursor: a.hits > 0 ? "pointer" : "default",
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "4px 8px",
                          color: a.hits > 0 ? "var(--success)" : "var(--muted)",
                        }}
                        title={a.hits > 0 ? "View hit history" : "No hits yet"}
                      >
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{a.hits}</span>
                        {a.hits > 0 && <Icon name="chevron" size={13} style={{ transform: hitsAlertId === a.id ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.15s" }} />}
                      </button>
                    </div>
                  </div>
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
                  history.map((h, i) => {
                    const isHit      = h.event_type === "notified";
                    const isExpanded = expandedHitId === h.id;
                    const detail     = h.detail as { booking_url?: string; simulated?: boolean } | null;
                    const bookingUrl = detail?.booking_url ?? "#";
                    const isSimulated = detail?.simulated === true;
                    const isLast     = i === history.length - 1;

                    const nights = h.arrive_date && h.depart_date
                      ? Math.round((new Date(h.depart_date).getTime() - new Date(h.arrive_date).getTime()) / 86400000)
                      : null;

                    return (
                      <div key={h.id}>
                        {/* Row */}
                        <div
                          onClick={() => isHit && setExpandedHitId(isExpanded ? null : h.id)}
                          style={{
                            display: "grid", gridTemplateColumns: "110px 1fr auto",
                            padding: "12px 18px", alignItems: "center",
                            borderBottom: (!isExpanded && !isLast) ? "1px solid var(--border)" : "none",
                            cursor: isHit ? "pointer" : "default",
                            background: isHit
                              ? isExpanded
                                ? "color-mix(in oklch, var(--success) 8%, var(--surface))"
                                : "color-mix(in oklch, var(--success) 4%, var(--surface))"
                              : "transparent",
                          }}
                        >
                          <div className="cs-mono cs-muted" style={{ fontSize: 11 }}>{timeAgo(h.created_at)}</div>
                          <div style={{ fontSize: 13 }}>
                            {isHit ? (
                              <span>
                                <strong style={{ color: "var(--success)" }}>Site found</strong>
                                {" — "}
                                {(h.alerts as { campgrounds?: { name?: string } } | null)?.campgrounds?.name ?? "Unknown"}
                                {h.site_name ? <span className="cs-muted"> · {h.site_name}</span> : null}
                              </span>
                            ) : historyLabel(h)}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className={`cs-pill${isHit ? " cs-pill--success" : ""}`} style={{ fontSize: 10.5 }}>
                              {historyAction(h)}
                            </span>
                            {isHit && (
                              <Icon
                                name="chevron"
                                size={13}
                                style={{
                                  color: "var(--muted)",
                                  transform: isExpanded ? "rotate(-90deg)" : "rotate(90deg)",
                                  transition: "transform 0.15s",
                                }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Expanded hit detail */}
                        {isHit && isExpanded && (
                          <div style={{
                            padding: "16px 18px 18px",
                            background: "color-mix(in oklch, var(--success) 6%, var(--surface))",
                            borderTop: "1px solid color-mix(in oklch, var(--success) 20%, var(--border))",
                            borderBottom: !isLast ? "1px solid var(--border)" : "none",
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                              {/* Site */}
                              <div>
                                <div className="cs-label" style={{ marginBottom: 4 }}>Site</div>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>
                                  {h.site_name ?? `Site ${h.site_id}`}
                                </div>
                                {isSimulated && (
                                  <span className="cs-pill cs-pill--muted" style={{ fontSize: 10, marginTop: 4 }}>Simulated</span>
                                )}
                              </div>

                              {/* Dates */}
                              {h.arrive_date && h.depart_date && (
                                <div>
                                  <div className="cs-label" style={{ marginBottom: 4 }}>Dates</div>
                                  <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500 }}>
                                    {new Date(h.arrive_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    {" → "}
                                    {new Date(h.depart_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </div>
                                  {nights !== null && (
                                    <div className="cs-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                                      {nights} night{nights !== 1 ? "s" : ""}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Opened */}
                              <div>
                                <div className="cs-label" style={{ marginBottom: 4 }}>Found</div>
                                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{timeAgo(h.created_at)}</div>
                                <div className="cs-muted" style={{ fontSize: 11.5 }}>
                                  {new Date(h.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </div>
                              </div>

                              {/* Alert link */}
                              <div>
                                <div className="cs-label" style={{ marginBottom: 4 }}>Alert</div>
                                <button
                                  className="cs-btn cs-btn--quiet cs-btn--sm"
                                  style={{ fontSize: 12 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const a = alerts.find((a) => a.id === h.alert_id);
                                    if (a) setActiveId(a.id);
                                  }}
                                >
                                  View alert <Icon name="chevron" size={11} />
                                </button>
                              </div>
                            </div>

                            <a
                              href={bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "11px 18px",
                                background: "var(--success)", color: "#fff",
                                borderRadius: "var(--cs-radius)", textDecoration: "none",
                                fontWeight: 600, fontSize: 13.5,
                              }}
                            >
                              Book now on Recreation.gov →
                            </a>
                            {bookingUrl === "#" && (
                              <span className="cs-muted" style={{ fontSize: 11.5, marginLeft: 12 }}>
                                No direct booking link available
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: sidebar — hits history OR alert detail */}
          <div className="cs-card" style={{ padding: 22, position: "sticky", top: 32, alignSelf: "start" }}>

            {/* ── Hits history panel ── */}
            {hitsAlertId && activeAlert ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <button
                    className="cs-btn cs-btn--quiet cs-btn--sm"
                    onClick={() => setHitsAlertId(null)}
                    style={{ padding: "4px 6px" }}
                  >
                    <Icon name="chevron" size={13} style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <div>
                    <div className="cs-label" style={{ marginBottom: 2 }}>Hit history</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{activeAlert.campgrounds?.name ?? activeAlert.campground_id}</div>
                  </div>
                  <span style={{
                    marginLeft: "auto",
                    background: "color-mix(in oklch, var(--success) 12%, var(--surface-2))",
                    color: "var(--success)", fontFamily: "var(--font-display)",
                    fontSize: 22, fontWeight: 500, padding: "2px 10px",
                    borderRadius: "var(--cs-radius)",
                  }}>{activeAlert.hits}</span>
                </div>

                {hitsLoading ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} style={{ height: 68, background: "var(--surface-2)", borderRadius: "var(--cs-radius)", opacity: 0.5 }} />
                    ))}
                  </div>
                ) : hitsList.length === 0 ? (
                  <p className="cs-muted" style={{ fontSize: 13 }}>No hits recorded yet for this alert.</p>
                ) : (
                  <div style={{ display: "grid", gap: 8, maxHeight: 520, overflowY: "auto" }}>
                    {hitsList.map((h) => {
                      const detail   = h.detail as { booking_url?: string; simulated?: boolean } | null;
                      const bookingUrl = detail?.booking_url;
                      const isSimulated = detail?.simulated === true;
                      const nights = h.arrive_date && h.depart_date
                        ? Math.round((new Date(h.depart_date).getTime() - new Date(h.arrive_date).getTime()) / 86400000)
                        : null;

                      return (
                        <div key={h.id} style={{
                          padding: "12px 14px",
                          background: "color-mix(in oklch, var(--success) 6%, var(--surface))",
                          border: "1px solid color-mix(in oklch, var(--success) 20%, var(--border))",
                          borderRadius: "var(--cs-radius-lg)",
                        }}>
                          {/* Site + time */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)" }}>
                                {h.site_name ?? `Site ${h.site_id}`}
                              </div>
                              {isSimulated && (
                                <span className="cs-pill cs-pill--muted" style={{ fontSize: 10 }}>Simulated</span>
                              )}
                            </div>
                            <div className="cs-mono cs-muted" style={{ fontSize: 10.5 }}>{timeAgo(h.created_at)}</div>
                          </div>

                          {/* Dates */}
                          {h.arrive_date && h.depart_date && (
                            <div style={{ fontSize: 12.5, marginBottom: 10, color: "var(--ink-2)" }}>
                              {new Date(h.arrive_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" → "}
                              {new Date(h.depart_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {nights !== null && <span className="cs-muted"> · {nights}n</span>}
                            </div>
                          )}

                          {/* Book button */}
                          {bookingUrl ? (
                            <a
                              href={bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "7px 12px", fontSize: 12, fontWeight: 600,
                                background: "var(--success)", color: "#fff",
                                borderRadius: "var(--cs-radius)", textDecoration: "none",
                              }}
                            >
                              Book on Recreation.gov →
                            </a>
                          ) : (
                            <span className="cs-muted" style={{ fontSize: 11.5 }}>No booking link</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (

            /* ── Default alert detail panel ── */
            !activeAlert ? (
              <p className="cs-muted" style={{ fontSize: 13 }}>Select an alert to see details.</p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div className="cs-label" style={{ marginBottom: 6 }}>{activeAlert.campgrounds?.park}</div>
                    <Link href={`/campgrounds/${activeAlert.campground_id}`}>
                      <h3 style={{ fontSize: 22, color: "var(--primary)" }}>{activeAlert.campgrounds?.name ?? activeAlert.campground_id}</h3>
                    </Link>
                  </div>
                  <button className="cs-btn cs-btn--quiet cs-btn--sm" onClick={() => router.push(`/campgrounds/${activeAlert.campground_id}/alert/new`)}>
                    <Icon name="settings" size={14} />
                  </button>
                </div>
                <Photo
                  label={activeAlert.campgrounds?.name ?? activeAlert.campground_id}
                  src={activeAlert.campgrounds?.photo_url}
                  seed={activeAlert.campground_id}
                  imgWidth={600} imgHeight={280}
                  height={140}
                  style={{ marginBottom: 16, borderRadius: "var(--cs-radius-lg)" }}
                />

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
            ))}
          </div>
        </div>
      </div>

      <Toast
        open={toastOpen}
        campgroundName={toastHit.campground}
        siteName={toastHit.site}
        arriveDate={toastHit.arrive}
        departDate={toastHit.depart}
        bookingUrl={toastHit.url}
        onDismiss={() => setToastOpen(false)}
        onBook={() => { setToastOpen(false); if (toastHit.url) window.open(toastHit.url, "_blank"); }}
      />
    </div>
  );
}

function StatusPill({ status, hits }: { status: string; hits?: number }) {
  if (status === "found") return <span className="cs-pill cs-pill--success"><span className="cs-dot" />{hits ? ` ${hits} hits` : " Hit"}</span>;
  if (status === "monitoring") return <span className="cs-pill"><span className="cs-dot" style={{ background: "var(--success)" }} /> Monitoring</span>;
  return <span className="cs-pill cs-pill--muted"><Icon name="pause" size={9} /> Paused</span>;
}
