"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import Photo from "@/components/cs/Photo";
import Sparkline from "@/components/cs/Sparkline";
import type { Database } from "@/lib/supabase/types";

type Campground = Database["public"]["Tables"]["campgrounds"]["Row"];

type CampsiteRow = {
  campsite_id: string;
  site: string;
  loop: string;
  type: string;
  avail: Record<string, boolean>; // "YYYY-MM-DD" → available
};

type Props = {
  campground: Campground;
  watchedSiteIds: string[];
};

// ── Shared table styles ──────────────────────────────────────────────────────
const thBase: React.CSSProperties = {
  padding: "7px 10px",
  background: "var(--surface-2)",
  borderBottom: "1px solid var(--border)",
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  fontWeight: 500,
  color: "var(--ink-2)",
  whiteSpace: "nowrap",
};
const tdBase: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--border)",
};

// ── Constants ────────────────────────────────────────────────────────────────
const AVAIL_PER_PAGE = 20;
const AVAIL_DAYS     = 10;
const DAY_ABBR  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MON_ABBR  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatAmenity(a: string) {
  return a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AgencyLabel({ agency }: { agency: string }) {
  const map: Record<string, string> = {
    NPS: "National Park Service",
    "CA-SP": "California State Parks",
    USFS: "US Forest Service",
  };
  return <>{map[agency] ?? agency}</>;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function cellKey(campsiteId: string, date: Date): string {
  return `${campsiteId}:${date.toISOString().split("T")[0]}`;
}

function parseCellKey(key: string): { campsiteId: string; dateStr: string } {
  const colonIdx = key.indexOf(":");
  return { campsiteId: key.slice(0, colonIdx), dateStr: key.slice(colonIdx + 1) };
}

/** Extract the leading/sole numeric part from a site name like "B014" → 14, "001" → 1 */

// ── Component ────────────────────────────────────────────────────────────────
export default function CampgroundDetailClient({ campground, watchedSiteIds }: Props) {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [tab, setTab]                     = useState<"sites" | "info">("sites");
  const [availOffset, setAvailOffset]     = useState(0);
  const [availPage, setAvailPage]         = useState(0);
  const [availSearch, setAvailSearch]     = useState("");
  const [campsites, setCampsites]         = useState<CampsiteRow[]>([]);
  const [availLoading, setAvailLoading]   = useState(true);
  const [availUnsupported, setAvailUnsupported] = useState(false);

  const c = campground;

  // Fetch real availability — route handles provider lookup (rec.gov for NPS/USFS)
  useEffect(() => {
    setAvailLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startStr = today.toISOString().split("T")[0];
    fetch(`/api/campgrounds/${c.id}/availability?start=${startStr}&days=90`)
      .then((r) => r.json())
      .then((data) => {
        if (data.unsupported) { setAvailUnsupported(true); return; }
        const rows: CampsiteRow[] = Object.entries(
          data.campsites ?? {}
        ).map(([id, info]) => {
          const i = info as { site?: string; loop?: string; type?: string; avail?: Record<string, boolean> };
          return {
            campsite_id: id,
            site: i.site ?? id,
            loop: i.loop ?? "",
            type: i.type ?? "",
            avail: i.avail ?? {},
          };
        });
        rows.sort((a, b) => a.loop.localeCompare(b.loop) || a.site.localeCompare(b.site));
        setCampsites(rows);
      })
      .catch(() => {})
      .finally(() => setAvailLoading(false));
  }, [c.id]);

  function toggleCell(campsiteId: string, date: Date) {
    const key = cellKey(campsiteId, date);
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Derive sites + date range from selected cells
  const cellList = [...selectedCells].map(parseCellKey);
  const selectedCampsiteIds = [...new Set(cellList.map((cl) => cl.campsiteId))].sort();
  const selectedDates = cellList.map((cl) => new Date(cl.dateStr + "T12:00:00"));
  const minDate    = selectedDates.length ? new Date(Math.min(...selectedDates.map((d) => d.getTime()))) : null;
  const maxDate    = selectedDates.length ? new Date(Math.max(...selectedDates.map((d) => d.getTime()))) : null;
  const departDate = maxDate ? addDays(maxDate, 1) : null;

  const alertHref = (() => {
    const base = `/campgrounds/${c.id}/alert/new`;
    if (!selectedCells.size) return base;
    const p = new URLSearchParams();
    if (selectedCampsiteIds.length) {
      // Map campsite IDs → numeric site numbers for the worker's site filter
      const siteNames = selectedCampsiteIds
        .map((id) => campsites.find((r) => r.campsite_id === id)?.site ?? "")
        .filter(Boolean);
      if (siteNames.length) { p.set("sites", siteNames.join(",")); p.set("mode", "specific"); }
    }
    if (minDate)    p.set("arrive", minDate.toISOString().split("T")[0]);
    if (departDate) p.set("depart", departDate.toISOString().split("T")[0]);
    return `${base}?${p}`;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav signedIn={true} current="search" />
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 32px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0", color: "var(--muted)", fontSize: 12.5 }}>
          <Link href="/search">Search</Link>
          <Icon name="chevron" size={12} />
          <span>{c.park}</span>
          <Icon name="chevron" size={12} />
          <span style={{ color: "var(--ink)" }}>{c.name}</span>
        </div>

        {/* Photo header */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, marginBottom: 28 }}>
          <Photo label={c.name} src={c.photo_url} seed={c.id} imgWidth={900} imgHeight={600} height={300} />
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 10 }}>
            <Photo label="site cluster" seed={`${c.id}-sites`} imgWidth={500} imgHeight={300} />
            <Photo label="trail access" seed={`${c.id}-trail`} imgWidth={500} imgHeight={300} />
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div className="cs-label" style={{ marginBottom: 8 }}>
              {c.park} · <AgencyLabel agency={c.agency} />
            </div>
            <h1 style={{ fontSize: 44, marginBottom: 12 }}>{c.name}</h1>
            {c.description && (
              <p className="cs-muted" style={{ maxWidth: 580, fontSize: 14.5 }}>{c.description}</p>
            )}
          </div>
          {c.booking_url && (
            <a
              href={c.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cs-btn cs-btn--ghost"
              style={{ flexShrink: 0, marginTop: 8 }}
            >
              {c.booking_url.includes("recreation.gov")
                ? "Recreation.gov"
                : c.booking_url.includes("reservecalifornia")
                ? "ReserveCalifornia"
                : "Reserve"}{" "}
              <Icon name="arrow" size={14} />
            </a>
          )}
        </div>

        {/* Stat strip */}
        <div className="cs-card" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: 0, marginBottom: 28, overflow: "hidden" }}>
          {([
            ["Sites", c.site_count, null],
            ["Operator", c.agency, null],
            ["Amenities", `${c.amenities.length} features`, null],
            ["Avg. lead time", "21 days", null],
            ["Booking opens", "5 mo ahead", [3, 5, 2, 4, 6, 8, 5, 7, 9, 11, 8, 12, 9]],
          ] as [string, string | number, number[] | null][]).map(([k, v, spark], i) => (
            <div key={k} style={{ padding: "16px 18px", borderLeft: i === 0 ? "none" : "1px solid var(--border)" }}>
              <div className="cs-label" style={{ marginBottom: 6 }}>{k}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{v}</div>
              {spark && <div style={{ marginTop: 6 }}><Sparkline data={spark} /></div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
          {([["sites", "Sites & Availability"], ["info", "About"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="cs-btn cs-btn--quiet"
              style={{
                borderRadius: 0,
                borderBottom: tab === k ? "2px solid var(--ink)" : "2px solid transparent",
                color: tab === k ? "var(--ink)" : "var(--muted)",
                padding: "10px 14px",
              }}>{l}</button>
          ))}
        </div>

        {/* ── Sites & Availability tab ── */}
        {tab === "sites" && (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dates = Array.from({ length: AVAIL_DAYS }, (_, i) => addDays(today, availOffset + i));

          // Month group headers
          type MonthGroup = { label: string; count: number };
          const monthGroups: MonthGroup[] = [];
          for (const d of dates) {
            const lbl = `${MON_ABBR[d.getMonth()]} ${d.getFullYear()}`;
            if (monthGroups.length && monthGroups[monthGroups.length - 1].label === lbl) {
              monthGroups[monthGroups.length - 1].count++;
            } else {
              monthGroups.push({ label: lbl, count: 1 });
            }
          }

          function rowAvail(row: CampsiteRow, d: Date): boolean {
            return row.avail[d.toISOString().split("T")[0]] === true;
          }

          // Filter + search
          const allCampRows = campsites.filter((row) => {
            if (!availSearch) return true;
            const q = availSearch.toLowerCase();
            return row.site.toLowerCase().includes(q) || row.loop.toLowerCase().includes(q);
          });

          const totalAvailPages = Math.ceil(allCampRows.length / AVAIL_PER_PAGE);
          const pagedRows = allCampRows.slice(availPage * AVAIL_PER_PAGE, (availPage + 1) * AVAIL_PER_PAGE);
          const availCount = allCampRows.filter((row) => dates.some((d) => rowAvail(row, d))).length;
          const windowLabel = `${MON_ABBR[dates[0].getMonth()]} ${dates[0].getDate()} – ${MON_ABBR[dates[AVAIL_DAYS-1].getMonth()]} ${dates[AVAIL_DAYS-1].getDate()}`;

          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 272px", gap: 24, paddingBottom: 48, alignItems: "start" }}>

              {/* ── LEFT: grid ── */}
              <div>
                {/* Toolbar */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                  padding: "10px 0 12px", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ position: "relative", flex: "0 0 180px" }}>
                    <Icon name="search" size={13} style={{ position: "absolute", left: 8, top: 9, color: "var(--muted)" }} />
                    <input
                      className="cs-input"
                      placeholder="Site or loop…"
                      style={{ paddingLeft: 26, fontSize: 12.5, height: 32 }}
                      value={availSearch}
                      onChange={(e) => { setAvailSearch(e.target.value); setAvailPage(0); }}
                    />
                  </div>

                  <div style={{ flex: 1 }} />

                  {/* Date nav */}
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "var(--cs-radius)", overflow: "hidden" }}>
                    <button
                      className="cs-btn cs-btn--quiet cs-btn--sm"
                      style={{ borderRadius: 0, gap: 3 }}
                      onClick={() => setAvailOffset((o) => Math.max(0, o - 5))}
                      disabled={availOffset === 0}
                    >
                      <Icon name="chevron" size={12} style={{ transform: "rotate(180deg)" }} /> 5 Days
                    </button>
                    <div style={{ width: 1, height: 22, background: "var(--border)" }} />
                    <button
                      className="cs-btn cs-btn--quiet cs-btn--sm"
                      style={{ borderRadius: 0, fontWeight: 600, fontSize: 12 }}
                      onClick={() => {
                        for (let o = 0; o < 180; o++) {
                          const w = Array.from({ length: AVAIL_DAYS }, (_, i) => addDays(today, o + i));
                          if (allCampRows.some((row) => w.some((d) => rowAvail(row, d)))) {
                            setAvailOffset(o); break;
                          }
                        }
                      }}
                    >
                      Next Available
                    </button>
                    <div style={{ width: 1, height: 22, background: "var(--border)" }} />
                    <button
                      className="cs-btn cs-btn--quiet cs-btn--sm"
                      style={{ borderRadius: 0, gap: 3 }}
                      onClick={() => setAvailOffset((o) => o + 5)}
                    >
                      5 Days <Icon name="chevron" size={12} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 14, padding: "7px 0 9px", fontSize: 12, alignItems: "center" }}>
                  <span className="cs-muted">{windowLabel}</span>
                  {availLoading ? (
                    <span className="cs-muted">Loading…</span>
                  ) : availUnsupported ? (
                    <span className="cs-muted">Live availability not available for this provider</span>
                  ) : (
                    <>
                      <span style={{ color: "var(--success)", fontWeight: 600 }}>{availCount} available</span>
                      <span className="cs-muted">·</span>
                      <span className="cs-muted">{allCampRows.length} sites</span>
                    </>
                  )}
                  {selectedCells.size > 0 && (
                    <>
                      <span className="cs-muted">·</span>
                      <span style={{ color: "var(--primary)", fontWeight: 600 }}>{selectedCells.size} cell{selectedCells.size !== 1 ? "s" : ""} selected</span>
                    </>
                  )}
                </div>

                {/* Loading skeleton */}
                {availLoading ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} style={{ height: 38, background: "var(--surface-2)", borderRadius: "var(--cs-radius)", opacity: 0.4 + i * 0.05 }} />
                    ))}
                  </div>
                ) : availUnsupported ? (
                  <div className="cs-card" style={{ padding: "28px 18px", textAlign: "center" }}>
                    <p className="cs-muted" style={{ fontSize: 13, marginBottom: 14 }}>
                      Live availability is not available for this campground&apos;s booking provider.
                    </p>
                    {c.booking_url && (
                      <a href={c.booking_url} target="_blank" rel="noopener noreferrer" className="cs-btn cs-btn--ghost cs-btn--sm">
                        Check availability on {c.booking_url.includes("reservecalifornia") ? "ReserveCalifornia" : "booking site"} →
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Table */}
                    <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--cs-radius-lg)" }}>
                      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}>
                        <thead>
                          {/* Month row */}
                          <tr>
                            <th colSpan={2} style={thBase} />
                            {monthGroups.map((g, i) => (
                              <th key={i} colSpan={g.count} style={{
                                ...thBase, textAlign: "center",
                                fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 12,
                                borderLeft: "2px solid var(--border-strong)",
                              }}>
                                {g.label}
                              </th>
                            ))}
                          </tr>
                          {/* Day row */}
                          <tr>
                            <th style={{ ...thBase, textAlign: "left", color: "var(--ink)", fontWeight: 600, minWidth: 72 }}>Site</th>
                            <th style={{ ...thBase, textAlign: "left", color: "var(--ink)", fontWeight: 600, minWidth: 76 }}>Loop</th>
                            {dates.map((d, i) => {
                              const isWknd  = d.getDay() === 0 || d.getDay() === 6;
                              const isFirst = i === 0 || d.getMonth() !== dates[i - 1].getMonth();
                              return (
                                <th key={i} style={{
                                  ...thBase, width: 42, minWidth: 42, textAlign: "center",
                                  borderLeft: isFirst ? "2px solid var(--border-strong)" : "1px solid var(--border)",
                                  background: isWknd ? "color-mix(in oklch, var(--accent) 7%, var(--surface-2))" : "var(--surface-2)",
                                  color: isWknd ? "var(--accent)" : "var(--ink-2)",
                                }}>
                                  <div style={{ fontSize: 10, fontWeight: 600 }}>{DAY_ABBR[d.getDay()]}</div>
                                  <div style={{ fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 500 }}>{d.getDate()}</div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRows.map((row, ri) => {
                            const isWatching = watchedSiteIds.includes(row.site.toUpperCase());
                            const hasAny     = dates.some((d) => rowAvail(row, d));
                            const rowHasSel  = dates.some((d) => selectedCells.has(cellKey(row.campsite_id, d)));

                            const rowBg = rowHasSel
                              ? "color-mix(in oklch, var(--primary) 5%, var(--surface))"
                              : isWatching
                              ? "color-mix(in oklch, var(--accent) 5%, var(--surface))"
                              : hasAny
                              ? ri % 2 === 0
                                ? "color-mix(in oklch, var(--success) 4%, var(--surface))"
                                : "color-mix(in oklch, var(--success) 4%, var(--bg))"
                              : ri % 2 === 0 ? "var(--surface)" : "var(--bg)";

                            return (
                              <tr key={row.campsite_id} style={{ background: rowBg }}>
                                <td style={{ ...tdBase, whiteSpace: "nowrap" }}>
                                  <span style={{
                                    color: rowHasSel ? "var(--primary)" : "var(--ink)",
                                    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                                  }}>
                                    {row.site}
                                  </span>
                                  {isWatching && (
                                    <span title="Already monitoring" style={{ marginLeft: 5, fontSize: 8, color: "var(--accent)" }}>●</span>
                                  )}
                                </td>
                                <td style={{ ...tdBase, color: "var(--ink-2)", fontSize: 11.5 }}>
                                  {row.loop || "—"}
                                </td>
                                {dates.map((d, di) => {
                                  const avail     = rowAvail(row, d);
                                  const key       = cellKey(row.campsite_id, d);
                                  const isCellSel = selectedCells.has(key);
                                  const isFirst   = di === 0 || d.getMonth() !== dates[di - 1].getMonth();
                                  const isWknd    = d.getDay() === 0 || d.getDay() === 6;

                                  let cellBg = "transparent";
                                  let cellColor = "var(--muted)";
                                  let cellWeight: number = 400;

                                  if (isCellSel) {
                                    cellBg     = "var(--primary)";
                                    cellColor  = "var(--primary-ink)";
                                    cellWeight = 700;
                                  } else if (avail) {
                                    cellBg     = "color-mix(in oklch, var(--success) 13%, transparent)";
                                    cellColor  = "var(--success)";
                                    cellWeight = 700;
                                  } else if (isWknd) {
                                    cellBg = "color-mix(in oklch, var(--accent) 4%, transparent)";
                                  }

                                  return (
                                    <td
                                      key={di}
                                      onClick={() => toggleCell(row.campsite_id, d)}
                                      style={{
                                        ...tdBase,
                                        textAlign: "center",
                                        borderLeft: isFirst ? "2px solid var(--border-strong)" : "1px solid var(--border)",
                                        fontWeight: cellWeight,
                                        color: cellColor,
                                        background: cellBg,
                                        fontSize: 11.5,
                                        cursor: "pointer",
                                        userSelect: "none",
                                        transition: "background 0.1s",
                                      }}
                                    >
                                      {isCellSel ? "✓" : avail ? "A" : "R"}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalAvailPages > 1 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                        <span className="cs-muted" style={{ fontSize: 12 }}>
                          {availPage * AVAIL_PER_PAGE + 1}–{Math.min((availPage + 1) * AVAIL_PER_PAGE, allCampRows.length)} of {allCampRows.length} sites
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="cs-btn cs-btn--ghost cs-btn--sm" disabled={availPage === 0} onClick={() => setAvailPage((p) => p - 1)}>
                            <Icon name="chevron" size={12} style={{ transform: "rotate(180deg)" }} /> Prev
                          </button>
                          <button className="cs-btn cs-btn--ghost cs-btn--sm" disabled={availPage >= totalAvailPages - 1} onClick={() => setAvailPage((p) => p + 1)}>
                            Next <Icon name="chevron" size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Legend */}
                    <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11, color: "var(--muted)", flexWrap: "wrap" }}>
                      {[
                        { letter: "A", color: "var(--success)",     bg: "color-mix(in oklch, var(--success) 13%, transparent)", label: "Available" },
                        { letter: "R", color: "var(--muted)",        bg: "transparent",                                          label: "Reserved"  },
                        { letter: "✓", color: "var(--primary-ink)", bg: "var(--primary)",                                       label: "Selected"  },
                      ].map(({ letter, color, bg, label }) => (
                        <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{
                            display: "inline-block", width: 16, height: 16, borderRadius: 3,
                            background: bg, border: "1px solid var(--border)",
                            lineHeight: "16px", textAlign: "center", fontSize: 9,
                            fontWeight: 700, color,
                          }}>{letter}</span>
                          {label}
                        </span>
                      ))}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 8, color: "var(--accent)" }}>●</span> Monitoring
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* ── RIGHT: selection panel (sticky) ── */}
              <div style={{ position: "sticky", top: 24, alignSelf: "start" }}>
                <h3 style={{ fontSize: 17, marginBottom: 12 }}>Alert setup</h3>

                {selectedCells.size === 0 ? (
                  <div className="cs-card" style={{ padding: 16, marginBottom: 12 }}>
                    <p className="cs-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                      Click individual cells to select dates per site. Mix available and reserved — reserved cells create a cancellation alert.
                    </p>
                    {watchedSiteIds.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div className="cs-label" style={{ marginBottom: 7 }}>Already monitoring</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {watchedSiteIds.map((n) => (
                            <span key={n} className="cs-pill cs-pill--accent" style={{ fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cs-card" style={{ padding: 16, marginBottom: 12 }}>
                    {/* Date range */}
                    {minDate && departDate && (
                      <div style={{ marginBottom: 14 }}>
                        <div className="cs-label" style={{ marginBottom: 6 }}>Date range</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
                            {MON_ABBR[minDate.getMonth()]} {minDate.getDate()}
                          </span>
                          <span className="cs-muted">→</span>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
                            {MON_ABBR[departDate.getMonth()]} {departDate.getDate()}
                          </span>
                          <span className="cs-muted" style={{ fontSize: 12 }}>
                            {Math.round((departDate.getTime() - minDate.getTime()) / 86400000)} night{Math.round((departDate.getTime() - minDate.getTime()) / 86400000) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sites */}
                    <div className="cs-label" style={{ marginBottom: 8 }}>
                      {selectedCampsiteIds.length} site{selectedCampsiteIds.length !== 1 ? "s" : ""} · {selectedCells.size} cell{selectedCells.size !== 1 ? "s" : ""}
                    </div>
                    <div style={{ display: "grid", gap: 5, marginBottom: 4 }}>
                      {selectedCampsiteIds.map((campsiteId) => {
                        const row = campsites.find((r) => r.campsite_id === campsiteId);
                        const siteCells = cellList.filter((cl) => cl.campsiteId === campsiteId);
                        const siteDates = siteCells.map((cl) => new Date(cl.dateStr + "T12:00:00"));
                        const siteAvailCount = siteCells.filter((cl) => row?.avail[cl.dateStr] === true).length;

                        return (
                          <div key={campsiteId} style={{
                            padding: "7px 10px",
                            background: "var(--surface-2)",
                            borderRadius: "var(--cs-radius)",
                            borderLeft: "3px solid var(--primary)",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span style={{
                                  padding: "2px 6px", borderRadius: 4,
                                  background: "var(--primary)", color: "var(--primary-ink)",
                                  fontWeight: 700, fontSize: 10.5, fontFamily: "var(--font-mono)",
                                }}>{row?.site ?? campsiteId}</span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{row?.loop || "—"}</div>
                                  {row?.type && <div className="cs-muted" style={{ fontSize: 10.5 }}>{row.type}</div>}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedCells((prev) => {
                                    const next = new Set(prev);
                                    siteCells.forEach((cl) => next.delete(`${cl.campsiteId}:${cl.dateStr}`));
                                    return next;
                                  });
                                }}
                                style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 2 }}
                              >
                                <Icon name="x" size={12} />
                              </button>
                            </div>
                            {/* Selected date pills */}
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 5 }}>
                              {[...siteDates].sort((a, b) => a.getTime() - b.getTime()).map((d) => {
                                const avail = row?.avail[d.toISOString().split("T")[0]] === true;
                                return (
                                  <span
                                    key={d.toISOString()}
                                    onClick={() => row && toggleCell(campsiteId, d)}
                                    style={{
                                      fontSize: 10, padding: "2px 6px",
                                      borderRadius: 3, cursor: "pointer",
                                      background: avail
                                        ? "color-mix(in oklch, var(--success) 16%, var(--surface))"
                                        : "color-mix(in oklch, var(--muted) 16%, var(--surface))",
                                      color: avail ? "var(--success)" : "var(--muted)",
                                      fontWeight: 600, fontFamily: "var(--font-mono)",
                                      border: "1px solid var(--border)",
                                    }}
                                  >
                                    {MON_ABBR[d.getMonth()]} {d.getDate()}
                                  </span>
                                );
                              })}
                              <span className="cs-muted" style={{ fontSize: 10, alignSelf: "center", marginLeft: 2 }}>
                                {siteAvailCount}A {siteDates.length - siteAvailCount}R
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Link href={alertHref} className="cs-btn" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
                  <Icon name="bell" size={14} />
                  {selectedCells.size > 0
                    ? `Create alert (${selectedCampsiteIds.length} site${selectedCampsiteIds.length !== 1 ? "s" : ""})`
                    : "Alert on any site"}
                </Link>

                {selectedCells.size > 0 && (
                  <button
                    className="cs-btn cs-btn--ghost"
                    style={{ width: "100%", justifyContent: "center", fontSize: 12.5 }}
                    onClick={() => setSelectedCells(new Set())}
                  >
                    Clear all
                  </button>
                )}

                <p className="cs-muted" style={{ fontSize: 11, marginTop: 12, lineHeight: 1.6 }}>
                  <strong>R</strong> cells create cancellation alerts — you&apos;ll be notified the moment the site opens.
                </p>
              </div>

            </div>
          );
        })()}

        {/* ── About tab ── */}
        {tab === "info" && (
          <div style={{ paddingBottom: 48, maxWidth: 680 }}>
            {c.description && (
              <p style={{ fontSize: 15.5, lineHeight: 1.7, marginBottom: 20 }}>{c.description}</p>
            )}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 10 }}>Amenities</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {c.amenities.map((a) => (
                  <span key={a} className="cs-pill" style={{ fontSize: 12 }}>{formatAmenity(a)}</span>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {[
                ["Operator", <AgencyLabel key="op" agency={c.agency} />],
                ["Reservation system", "Recreation.gov"],
                ["Reservation window", "5 months ahead, rolling"],
                ["Check-in", "12:00 PM"],
                ["Pets", "Allowed on leash"],
                ["Total sites", c.site_count],
              ].map(([k, v]) => (
                <div key={k as string} style={{ paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <div className="cs-label" style={{ marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14 }}>{v}</div>
                </div>
              ))}
              {c.booking_url && (
                <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--border)", gridColumn: "span 2" }}>
                  <div className="cs-label" style={{ marginBottom: 4 }}>Book directly</div>
                  <a href={c.booking_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 14, color: "var(--primary)", textDecoration: "underline" }}>
                    Recreation.gov →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
