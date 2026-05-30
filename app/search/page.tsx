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

type SiteType = "any" | "tent" | "rv" | "walk-in";

function formatAmenity(a: string) {
  return a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AgencyBadge({ agency }: { agency: string }) {
  const labels: Record<string, string> = { NPS: "National Park", "CA-SP": "State Park", USFS: "National Forest" };
  return <span className="cs-pill cs-pill--muted" style={{ fontSize: 10.5 }}>{labels[agency] ?? agency}</span>;
}

const SITE_TYPE_AMENITY: Record<SiteType, string> = {
  any: "",
  tent: "tent",
  rv: "rv-hookups",
  "walk-in": "walk-in",
};

export default function SearchPage() {
  const [campgrounds, setCampgrounds] = useState<Campground[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | undefined>(undefined);
  const [view, setView] = useState<"split" | "list" | "map">("split");

  // Filters
  const [q, setQ] = useState("");
  const [siteType, setSiteType] = useState<SiteType>("any");
  const [arriveDate, setArriveDate] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showPartyFilter, setShowPartyFilter] = useState(false);

  const buildUrl = useCallback((query: string, type: SiteType) => {
    const params = new URLSearchParams({ limit: "200" });
    if (query) params.set("q", query);
    if (type !== "any") params.set("amenity", SITE_TYPE_AMENITY[type]);
    return `/api/campgrounds?${params}`;
  }, []);

  const fetchCampgrounds = useCallback((query: string, type: SiteType) => {
    setLoading(true);
    fetch(buildUrl(query, type))
      .then((r) => r.json())
      .then((data) => {
        const list: Campground[] = data.campgrounds ?? [];
        setCampgrounds(list);
        setActive((prev) => (list.find((c) => c.id === prev) ? prev : list[0]?.id));
      })
      .finally(() => setLoading(false));
  }, [buildUrl]);

  useEffect(() => { fetchCampgrounds("", "any"); }, [fetchCampgrounds]);

  // Debounced text search
  useEffect(() => {
    const t = setTimeout(() => fetchCampgrounds(q, siteType), 300);
    return () => clearTimeout(t);
  }, [q, siteType, fetchCampgrounds]);

  const activeC = campgrounds.find((c) => c.id === active);

  // Build alert creation link including filter context
  function alertHref(campgroundId: string) {
    const p = new URLSearchParams();
    if (arriveDate) p.set("arrive", arriveDate);
    if (departDate) p.set("depart", departDate);
    if (adults !== 2) p.set("adults", String(adults));
    const qs = p.toString();
    return `/campgrounds/${campgroundId}/alert/new${qs ? `?${qs}` : ""}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Nav signedIn={true} current="search" />

      {/* Filter bar */}
      <div style={{
        padding: "12px 32px", borderBottom: "1px solid var(--border)",
        background: "var(--surface)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Text search */}
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <Icon name="search" size={15} style={{ position: "absolute", left: 0, top: 12, color: "var(--muted)" }} />
            <input
              className="cs-input"
              placeholder="Search by park, campground, or region…"
              style={{ paddingLeft: 22 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Site type toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="cs-muted cs-label" style={{ marginRight: 2 }}>Type:</span>
            {(["any", "tent", "rv", "walk-in"] as SiteType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSiteType(t)}
                className={`cs-btn cs-btn--sm${siteType === t ? "" : " cs-btn--ghost"}`}
                style={{ padding: "5px 10px", textTransform: "capitalize" }}
              >
                {t === "any" ? "Any" : t === "rv" ? "RV" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Dates */}
          <div style={{ position: "relative" }}>
            <button
              className={`cs-btn cs-btn--ghost cs-btn--sm${showDateFilter ? " cs-btn--ghost" : ""}`}
              onClick={() => { setShowDateFilter((x) => !x); setShowPartyFilter(false); }}
              style={{ background: arriveDate ? "var(--surface-2)" : undefined }}
            >
              <Icon name="calendar" size={13} />
              {arriveDate && departDate
                ? `${arriveDate} → ${departDate}`
                : arriveDate
                ? `From ${arriveDate}`
                : "Dates"}
              <Icon name="chevronDown" size={11} />
            </button>
            {showDateFilter && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--cs-radius-lg)", padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,.12)",
                display: "grid", gap: 12, minWidth: 280,
              }}>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Arrive</label>
                  <input
                    type="date"
                    className="cs-input"
                    value={arriveDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setArriveDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Depart</label>
                  <input
                    type="date"
                    className="cs-input"
                    value={departDate}
                    min={arriveDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDepartDate(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="cs-btn cs-btn--ghost cs-btn--sm" onClick={() => { setArriveDate(""); setDepartDate(""); }}>Clear</button>
                  <button className="cs-btn cs-btn--sm" onClick={() => setShowDateFilter(false)}>Done</button>
                </div>
              </div>
            )}
          </div>

          {/* Party size */}
          <div style={{ position: "relative" }}>
            <button
              className="cs-btn cs-btn--ghost cs-btn--sm"
              onClick={() => { setShowPartyFilter((x) => !x); setShowDateFilter(false); }}
              style={{ background: adults !== 2 ? "var(--surface-2)" : undefined }}
            >
              <Icon name="user" size={13} />
              {adults} adult{adults !== 1 ? "s" : ""}
              <Icon name="chevronDown" size={11} />
            </button>
            {showPartyFilter && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--cs-radius-lg)", padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,.12)",
                minWidth: 200,
              }}>
                <div className="cs-label" style={{ marginBottom: 10 }}>Party size</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    className="cs-btn cs-btn--quiet cs-btn--sm"
                    onClick={() => setAdults((n) => Math.max(1, n - 1))}
                    disabled={adults <= 1}
                  >−</button>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, minWidth: 32, textAlign: "center" }}>{adults}</span>
                  <button
                    className="cs-btn cs-btn--quiet cs-btn--sm"
                    onClick={() => setAdults((n) => Math.min(12, n + 1))}
                    disabled={adults >= 12}
                  >+</button>
                  <span className="cs-muted" style={{ fontSize: 12 }}>adults</span>
                </div>
                <button className="cs-btn cs-btn--sm" style={{ marginTop: 14, width: "100%", justifyContent: "center" }} onClick={() => setShowPartyFilter(false)}>
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Active filters summary */}
          {(arriveDate || departDate || adults !== 2 || siteType !== "any") && (
            <button
              className="cs-btn cs-btn--quiet cs-btn--sm"
              onClick={() => { setSiteType("any"); setArriveDate(""); setDepartDate(""); setAdults(2); }}
              style={{ color: "var(--accent)" }}
            >
              <Icon name="x" size={12} /> Clear filters
            </button>
          )}

          <div style={{ width: 1, height: 24, background: "var(--border)" }} />

          {/* View toggle */}
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
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showDateFilter || showPartyFilter) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => { setShowDateFilter(false); setShowPartyFilter(false); }}
        />
      )}

      {/* Results */}
      <div style={{
        flex: 1, display: "grid", overflow: "hidden",
        gridTemplateColumns: view === "split" ? "1fr 1.1fr" : "1fr",
      }}>
        {/* List panel */}
        {view !== "map" && (
          <div style={{ overflow: "auto", borderRight: view === "split" ? "1px solid var(--border)" : "none" }}>
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>
                  {loading ? "…" : `${campgrounds.length} campground${campgrounds.length !== 1 ? "s" : ""}`}
                </div>
                <div className="cs-muted" style={{ fontSize: 12.5 }}>
                  California{siteType !== "any" ? ` · ${siteType.toUpperCase()}` : ""}
                  {arriveDate ? ` · ${arriveDate}${departDate ? ` – ${departDate}` : ""}` : ""}
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ display: "grid", gap: 12, padding: "0 28px 28px" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="cs-card" style={{ height: 100, opacity: 0.4, animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            ) : campgrounds.length === 0 ? (
              <div style={{ padding: "48px 28px", textAlign: "center" }}>
                <p className="cs-muted" style={{ marginBottom: 14 }}>No campgrounds match your filters.</p>
                <button className="cs-btn cs-btn--ghost cs-btn--sm" onClick={() => { setQ(""); setSiteType("any"); }}>
                  Clear filters
                </button>
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
                    <Photo
                      label={c.name}
                      src={c.photo_url}
                      seed={c.id}
                      imgWidth={240} imgHeight={200}
                      height="100%"
                      style={{ borderRadius: 0, border: "none" }}
                    />
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
          <div style={{
            padding: view === "map" ? 0 : 28,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}>
            <CampMap
              campgrounds={campgrounds}
              activeId={active}
              onSelect={setActive}
              height={view === "map" ? "100%" : 460}
            />
            {activeC && (
              <div className="cs-card" style={{ marginTop: 18, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div className="cs-label" style={{ marginBottom: 6 }}>{activeC.park}</div>
                    <h3 style={{ fontSize: 24 }}>{activeC.name}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={alertHref(activeC.id)} className="cs-btn cs-btn--ghost cs-btn--sm">
                      <Icon name="bell" size={13} /> Alert
                    </Link>
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
