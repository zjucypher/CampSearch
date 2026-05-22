"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import Photo from "@/components/cs/Photo";
import TopoBg from "@/components/cs/TopoBg";
import Sparkline from "@/components/cs/Sparkline";
import Calendar from "@/components/cs/Calendar";
import { sites, calendar } from "@/lib/data";
import type { Database } from "@/lib/supabase/types";

type Campground = Database["public"]["Tables"]["campgrounds"]["Row"];

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

export default function CampgroundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campground, setCampground] = useState<Campground | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([14, 15, 22]);
  const [tab, setTab] = useState<"sites" | "availability" | "info">("sites");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/campgrounds/${id}`)
      .then((r) => r.json())
      .then((data) => setCampground(data.campground ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const toggle = (n: number) =>
    setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Nav signedIn={true} current="search" />
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "32px" }}>
          <div style={{ height: 300, background: "var(--surface-2)", borderRadius: "var(--cs-radius-lg)", opacity: 0.5 }} />
        </div>
      </div>
    );
  }

  if (!campground) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Nav signedIn={true} current="search" />
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "64px 32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Campground not found</h2>
          <Link href="/search" className="cs-btn">Back to search</Link>
        </div>
      </div>
    );
  }

  const c = campground;

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
          <Photo label={`${c.id} · hero`} height={300} />
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 10 }}>
            <Photo label="site cluster" />
            <Photo label="trail access" />
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <div className="cs-label" style={{ marginBottom: 8 }}>{c.park} · <AgencyLabel agency={c.agency} /></div>
            <h1 style={{ fontSize: 44, marginBottom: 12 }}>{c.name}</h1>
            {c.description && (
              <p className="cs-muted" style={{ maxWidth: 580, fontSize: 14.5 }}>{c.description}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button className="cs-btn cs-btn--ghost"><Icon name="bell" size={14} /> Watch campground</button>
            <Link
              href={selected.length > 0 ? `/campgrounds/${c.id}/alert/new` : "#"}
              className="cs-btn"
              style={{ opacity: selected.length === 0 ? 0.5 : 1, pointerEvents: selected.length === 0 ? "none" : "auto" }}
            >
              <Icon name="plus" size={14} /> Alert me on {selected.length} site{selected.length !== 1 ? "s" : ""}
            </Link>
          </div>
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
          {([["sites", "Pick sites"], ["availability", "Availability"], ["info", "About"]] as const).map(([k, l]) => (
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

        {/* Sites tab */}
        {tab === "sites" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32, paddingBottom: 48 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <h3 style={{ fontSize: 20 }}>Site map</h3>
                <div style={{ display: "flex", gap: 14, fontSize: 11.5 }}>
                  {[["Available", "var(--success)"], ["Watched", "var(--accent)"], ["Selected", "var(--ink)"], ["Taken", "var(--border-strong)"]].map(([l, color]) => (
                    <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span className="cs-dot" style={{ background: color }} /> {l}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8,
                padding: 20, background: "var(--bg-2)", borderRadius: "var(--cs-radius-lg)",
                position: "relative", overflow: "hidden",
              }}>
                <TopoBg opacity={0.18} color="var(--ink-2)" />
                {sites.map((s) => {
                  const sel = selected.includes(s.num);
                  let cls = "cs-spot";
                  if (sel) cls += " cs-spot--selected";
                  else if (s.status === "available") cls += " cs-spot--available";
                  else if (s.status === "watched") cls += " cs-spot--watched";
                  else cls += " cs-spot--taken";
                  return (
                    <div key={s.num} className={cls} onClick={() => s.status !== "taken" && toggle(s.num)} style={{ position: "relative" }}>
                      <span>{s.num}</span>
                      <span className="lbl">{s.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Selection</h3>
              <div className="cs-card" style={{ padding: 18 }}>
                {selected.length === 0 ? (
                  <p className="cs-muted">Tap sites on the map to add them to your alert.</p>
                ) : (
                  <>
                    <div className="cs-label" style={{ marginBottom: 10 }}>{selected.length} site{selected.length !== 1 ? "s" : ""} watched</div>
                    <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                      {[...selected].sort((a, b) => a - b).map((n) => {
                        const s = sites.find((x) => x.num === n)!;
                        return (
                          <div key={n} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 10px", background: "var(--surface-2)", borderRadius: "var(--cs-radius)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{
                                width: 26, height: 26, borderRadius: 6,
                                background: "var(--primary)", color: "var(--primary-ink)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 600, fontSize: 12,
                              }}>{n}</span>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 13 }}>Site {n}</div>
                                <div className="cs-muted" style={{ fontSize: 11 }}>{s.type} · 6 ppl · fire ring</div>
                              </div>
                            </div>
                            <button onClick={() => toggle(n)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                              <Icon name="x" size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <Link href={`/campgrounds/${c.id}/alert/new`} className="cs-btn" style={{ width: "100%", justifyContent: "center" }}>
                      Configure alert →
                    </Link>
                  </>
                )}
              </div>
              <div style={{ marginTop: 18 }}>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 10 }}>Insider tip</h4>
                <p className="cs-muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                  Sites <strong style={{ color: "var(--ink)" }}>14, 15, 22</strong> sit by the river bend.
                  They cancel 3× more than the row-12 cluster because they flood-warn during snowmelt.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "availability" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, paddingBottom: 48 }}>
            <Calendar cal={calendar} />
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Cancellation timing</h3>
              <p className="cs-muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
                When sites at {c.name} typically drop. Most happen 3–10 days before arrival.
              </p>
              <div className="cs-card" style={{ padding: 18 }}>
                <Sparkline data={[2, 1, 3, 4, 2, 5, 7, 9, 11, 8, 12, 9, 7, 6, 4, 3, 5, 2]} />
                <div className="cs-mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                  <span>14 days out</span><span>arrival</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
