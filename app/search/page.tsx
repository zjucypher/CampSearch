"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import Photo from "@/components/cs/Photo";
import type { MapCampground } from "@/components/cs/CampMap";

const CampMap = dynamic(() => import("@/components/cs/CampMap"), { ssr: false });

type Campground = MapCampground & {
  agency: string;
  site_count: number;
  amenities: string[];
  photo_url: string | null;
};

function formatAmenity(a: string) {
  return a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AgencyBadge({ agency }: { agency: string }) {
  const labels: Record<string, string> = { NPS: "National Park", "CA-SP": "State Park", USFS: "National Forest" };
  return <span className="cs-pill cs-pill--muted" style={{ fontSize: 10.5 }}>{labels[agency] ?? agency}</span>;
}

export default function SearchPage() {
  const [campgrounds, setCampgrounds] = useState<Campground[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | undefined>(undefined);
  const [view, setView] = useState<"split" | "list" | "map">("split");
  const [q, setQ] = useState("");

  const fetchCampgrounds = useCallback((query: string) => {
    setLoading(true);
    fetch(`/api/campgrounds?q=${encodeURIComponent(query)}&limit=30`)
      .then((r) => r.json())
      .then((data) => {
        const list: Campground[] = data.campgrounds ?? [];
        setCampgrounds(list);
        setActive((prev) => list.find((c) => c.id === prev) ? prev : list[0]?.id);
      })
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => { fetchCampgrounds(""); }, [fetchCampgrounds]);

  // Debounced search
  useEffect(() => {
    if (!q) return;
    const t = setTimeout(() => fetchCampgrounds(q), 300);
    return () => clearTimeout(t);
  }, [q, fetchCampgrounds]);

  const activeC = campgrounds.find((c) => c.id === active);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Nav signedIn={true} current="search" />

      {/* Filter bar */}
      <div style={{
        padding: "16px 32px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
          <Icon name="search" size={15} style={{ position: "absolute", left: 0, top: 12, color: "var(--muted)" }} />
          <input
            className="cs-input"
            placeholder="Search by park, campground, or region…"
            style={{ paddingLeft: 22 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {[["Site type", "Tent or RV"], ["Dates", "Jul 18 — Jul 20"], ["Party", "2 adults"]].map(([lbl, val]) => (
          <button key={lbl} className="cs-btn cs-btn--ghost cs-btn--sm">
            <span className="cs-muted" style={{ marginRight: 6 }}>{lbl}:</span>
            <span>{val}</span>
            <Icon name="chevronDown" size={12} />
          </button>
        ))}
        <button className="cs-btn cs-btn--ghost cs-btn--sm">
          <Icon name="sliders" size={14} /> More
        </button>
        <div style={{ width: 1, height: 24, background: "var(--border)" }} />
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--cs-radius)", overflow: "hidden" }}>
          {([["list", "list"], ["split", "grid"], ["map", "map"]] as const).map(([v, ic]) => (
            <button key={v} onClick={() => setView(v)}
              className="cs-btn cs-btn--quiet"
              style={{
                padding: "6px 10px", borderRadius: 0,
                background: view === v ? "var(--surface-2)" : "transparent",
                color: view === v ? "var(--ink)" : "var(--muted)",
              }}>
              <Icon name={ic} size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{
        flex: 1, display: "grid", overflow: "hidden",
        gridTemplateColumns: view === "split" ? "1fr 1.1fr" : view === "list" ? "1fr" : "0 1fr",
      }}>
        {/* List panel */}
        {view !== "map" && (
          <div style={{ overflow: "auto", borderRight: view === "split" ? "1px solid var(--border)" : "none" }}>
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>
                  {loading ? "…" : `${campgrounds.length} campgrounds`}
                </div>
                <div className="cs-muted" style={{ fontSize: 12.5 }}>California · sorted by activity</div>
              </div>
              <button className="cs-btn cs-btn--quiet cs-btn--sm">
                Sort: Activity <Icon name="chevronDown" size={12} />
              </button>
            </div>

            {loading ? (
              <div style={{ display: "grid", gap: 12, padding: "0 28px 28px" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="cs-card" style={{ height: 100, opacity: 0.4, animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12, padding: "0 28px 28px" }}>
                {campgrounds.map((c) => (
                  <button key={c.id} onClick={() => setActive(c.id)}
                    className="cs-card"
                    style={{
                      padding: 0, textAlign: "left", cursor: "pointer",
                      display: "grid", gridTemplateColumns: "120px 1fr", gap: 0,
                      background: active === c.id ? "var(--surface-2)" : "var(--surface)",
                      outline: active === c.id ? "2px solid var(--primary)" : "none",
                      outlineOffset: -2, overflow: "hidden", border: "1px solid var(--border)",
                    }}>
                    <Photo label={c.id} height="100%" style={{ borderRadius: 0, border: "none" }} />
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500 }}>{c.name}</div>
                        <AgencyBadge agency={c.agency} />
                      </div>
                      <div className="cs-muted" style={{ fontSize: 12.5, marginBottom: 8 }}>{c.park}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {c.amenities.slice(0, 3).map((a) => (
                          <span key={a} className="cs-pill" style={{ fontSize: 10.5 }}>{formatAmenity(a)}</span>
                        ))}
                        <span className="cs-pill cs-pill--muted" style={{ fontSize: 10.5 }}>{c.site_count} sites</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Map + active card */}
        {view !== "list" && (
          <div style={{ padding: 28, overflow: "auto" }}>
            <CampMap
              campgrounds={campgrounds}
              activeId={active}
              onSelect={setActive}
              height={460}
            />
            {activeC && (
              <div className="cs-card" style={{ marginTop: 18, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div className="cs-label" style={{ marginBottom: 6 }}>{activeC.park}</div>
                    <h3 style={{ fontSize: 24 }}>{activeC.name}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="cs-btn cs-btn--ghost cs-btn--sm"><Icon name="bell" size={13} /> Watch</button>
                    <Link href={`/campgrounds/${activeC.id}`} className="cs-btn cs-btn--sm">
                      Open · Pick sites <Icon name="arrow" size={13} />
                    </Link>
                  </div>
                </div>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18,
                  padding: "16px 0 0", borderTop: "1px solid var(--border)",
                }}>
                  {[
                    ["Sites", activeC.site_count],
                    ["Type", activeC.agency === "NPS" ? "National Park" : activeC.agency === "CA-SP" ? "State Park" : "National Forest"],
                    ["Amenities", `${activeC.amenities.length} features`],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <div className="cs-label" style={{ marginBottom: 4 }}>{k}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
