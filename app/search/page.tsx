"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import MapPlaceholder from "@/components/cs/MapPlaceholder";
import Photo from "@/components/cs/Photo";
import { campgrounds } from "@/lib/data";

export default function SearchPage() {
  const [active, setActive] = useState(campgrounds[0].id);
  const [view, setView] = useState<"split" | "list" | "map">("split");
  const [q, setQ] = useState("");

  const filtered = campgrounds.filter(
    (c) => !q || (c.name + c.park + c.region).toLowerCase().includes(q.toLowerCase())
  );

  const activeC = filtered.find((c) => c.id === active) ?? filtered[0];

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
        {[["Region", "California"], ["Site type", "Tent or RV"], ["Dates", "Jul 18 — Jul 20"], ["Party", "2 adults"]].map(([lbl, val]) => (
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
        {/* List */}
        {view !== "map" && (
          <div style={{ overflow: "auto", borderRight: view === "split" ? "1px solid var(--border)" : "none" }}>
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>
                  {filtered.length} campgrounds
                </div>
                <div className="cs-muted" style={{ fontSize: 12.5 }}>Sorted by cancellation rate · last 30 days</div>
              </div>
              <button className="cs-btn cs-btn--quiet cs-btn--sm">
                Sort: Cancellation rate <Icon name="chevronDown" size={12} />
              </button>
            </div>
            <div style={{ display: "grid", gap: 12, padding: "0 28px 28px" }}>
              {filtered.map((c) => (
                <button key={c.id} onClick={() => setActive(c.id)}
                  className="cs-card"
                  style={{
                    padding: 0, textAlign: "left", cursor: "pointer",
                    display: "grid", gridTemplateColumns: "140px 1fr", gap: 16,
                    background: active === c.id ? "var(--surface-2)" : "var(--surface)",
                    outline: active === c.id ? "2px solid var(--primary)" : "none",
                    outlineOffset: -2, overflow: "hidden", border: "1px solid var(--border)",
                  }}>
                  <Photo label={c.id} height="100%" style={{ borderRadius: 0, border: "none" }} />
                  <div style={{ padding: "14px 16px 14px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>{c.name}</div>
                      <span className="cs-pill cs-pill--accent" style={{ fontSize: 10.5 }}>
                        <Icon name="flame" size={10} strokeWidth={2.2} /> {c.cancellations}/mo
                      </span>
                    </div>
                    <div className="cs-muted" style={{ fontSize: 12.5, marginBottom: 8 }}>{c.park} · {c.region}</div>
                    <div className="cs-muted" style={{ fontSize: 12.5, marginBottom: 10, lineHeight: 1.45 }}>{c.desc}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {c.tags.map((t) => <span key={t} className="cs-pill" style={{ fontSize: 10.5 }}>{t}</span>)}
                      <span className="cs-pill cs-pill--muted" style={{ fontSize: 10.5 }}>{c.sites} sites</span>
                      <span className="cs-pill cs-pill--muted" style={{ fontSize: 10.5 }}>{c.elevation}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map + active card */}
        {view !== "list" && (
          <div style={{ padding: 28, overflow: "auto" }}>
            <MapPlaceholder campgrounds={filtered} activeId={active} onSelect={setActive} height={460} />
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
                <p className="cs-muted" style={{ fontSize: 13.5, marginBottom: 16, maxWidth: 540 }}>{activeC.desc}</p>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18,
                  padding: "16px 0 0", borderTop: "1px solid var(--border)",
                }}>
                  {[["Sites", activeC.sites], ["Elevation", activeC.elevation], ["Cancellations / mo", activeC.cancellations], ["Region", activeC.region]].map(([k, v]) => (
                    <div key={k}>
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
