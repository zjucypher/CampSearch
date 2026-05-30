"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import FormGroup from "@/components/cs/FormGroup";
import CsSwitch from "@/components/cs/CsSwitch";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { PLAN_LIMITS, PLAN_LABELS, requiredPlanForInterval } from "@/lib/plans";
import type { PlanKey } from "@/lib/plans";

type Channels  = { email: boolean; sms: boolean; push: boolean };
type Campground = Database["public"]["Tables"]["campgrounds"]["Row"];

// ── Site preference options ───────────────────────────────────────────────────
const SITE_TYPES = [
  { value: "",           label: "Any type" },
  { value: "tent",       label: "Tent" },
  { value: "rv",         label: "RV / Motorhome" },
  { value: "walk-in",    label: "Walk-in / Backpack" },
  { value: "cabin",      label: "Cabin / Glamping" },
  { value: "group",      label: "Group site" },
  { value: "horse",      label: "Horse camp" },
];

const AMENITY_OPTIONS = [
  { value: "fire-ring",     label: "Fire ring" },
  { value: "potable-water", label: "Potable water" },
  { value: "flush-toilets", label: "Flush toilets" },
  { value: "vault-toilets", label: "Vault toilets" },
  { value: "showers",       label: "Showers" },
  { value: "rv-hookups",    label: "Electrical hookups" },
  { value: "dump-station",  label: "Dump station" },
  { value: "bear-boxes",    label: "Bear boxes / food storage" },
  { value: "pets",          label: "Pets allowed" },
  { value: "boat-ramp",     label: "Boat ramp" },
  { value: "ocean-views",   label: "Ocean / lake views" },
];

// ── Reusable dropdown wrapper ─────────────────────────────────────────────────
function Dropdown({
  label,
  open,
  onToggle,
  onClose,
  children,
}: {
  label: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="cs-btn cs-btn--ghost cs-btn--sm"
        style={{ width: "100%", justifyContent: "space-between" }}
        onClick={onToggle}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <Icon name="chevronDown" size={12} style={{ flexShrink: 0, marginLeft: 6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--cs-radius-lg)", boxShadow: "0 4px 20px rgba(0,0,0,.12)",
          minWidth: "100%", maxWidth: 280,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
function CreateAlertForm() {
  const { id }       = useParams<{ id: string }>();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [campground,  setCampground]  = useState<Campground | null>(null);
  const [arriveDate,  setArriveDate]  = useState(searchParams.get("arrive") ?? "2026-07-18");
  const [departDate,  setDepartDate]  = useState(searchParams.get("depart") ?? "2026-07-20");
  const [flex,        setFlex]        = useState("exact");
  const [siteMode,    setSiteMode]    = useState<"specific" | "any">(
    (searchParams.get("mode") as "specific" | "any") ?? "specific"
  );
  const [siteIds,     setSiteIds]     = useState<string[]>(
    searchParams.get("sites") ? searchParams.get("sites")!.split(",").filter(Boolean) : []
  );
  // Site preference filters (only used when siteMode === "any")
  const [siteType,    setSiteType]    = useState("");            // "" = any
  const [minOccupancy, setMinOccupancy] = useState(1);
  const [amenities,   setAmenities]   = useState<string[]>([]);

  const [channels,    setChannels]    = useState<Channels>({ email: true, sms: false, push: false });
  const [freq,        setFreq]        = useState("60");
  const [adults,      setAdults]      = useState("2");
  const [kids,        setKids]        = useState("1");
  const [vehicles,    setVehicles]    = useState("1");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [userPlan,    setUserPlan]    = useState<PlanKey>("free");

  // Dropdown open state
  const [openDrop, setOpenDrop] = useState<"type" | "occupancy" | "amenities" | null>(null);

  useEffect(() => {
    fetch(`/api/campgrounds/${id}`)
      .then((r) => r.json())
      .then((d) => setCampground(d.campground ?? null));
  }, [id]);

  // When plan loads, bump freq up to the plan minimum if the current selection is too fast
  useEffect(() => {
    const min = PLAN_LIMITS[userPlan].minInterval;
    setFreq((f) => String(Math.max(parseInt(f), min)));
  }, [userPlan]);

  // Fetch the user's plan so we can gate cadence options
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("profiles") as any)
        .select("plan")
        .eq("id", user.id)
        .single()
        .then(({ data }: { data: { plan?: PlanKey } | null }) => {
          if (data?.plan) setUserPlan(data.plan);
        });
    });
  }, []);

  const c = campground;

  function toggleAmenity(v: string) {
    setAmenities((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function removeSiteId(n: string) {
    setSiteIds((prev) => prev.filter((x) => x !== n));
  }

  async function handleSubmit() {
    if (!c) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campground_id:  c.id,
        arrive_date:    arriveDate,
        depart_date:    departDate,
        flexibility:    flex,
        site_mode:      siteMode,
        site_ids:       siteMode === "specific" ? siteIds : [],
        site_type:      siteMode === "any" && siteType ? siteType : null,
        min_occupancy:  siteMode === "any" ? minOccupancy : 1,
        amenity_filter: siteMode === "any" ? amenities : [],
        adults:         parseInt(adults),
        kids:           parseInt(kids),
        vehicles:       parseInt(vehicles),
        channel_email:  channels.email,
        channel_sms:    channels.sms,
        channel_push:   channels.push,
        poll_interval:  parseInt(freq),
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create alert");
      setSubmitting(false);
      return;
    }
    router.push("/dashboard");
  }

  const flexLabel: Record<string, string> = {
    exact: "Exact dates", "3d": "± 3 days", week: "Any week", wknd: "Weekends only",
  };
  const freqLabel: Record<string, string> = { "30": "30s", "60": "60s", "300": "5m", "1800": "30m" };
  const siteTypeLabel = SITE_TYPES.find((t) => t.value === siteType)?.label ?? "Any type";
  const amenityLabel  = amenities.length
    ? amenities.map((v) => AMENITY_OPTIONS.find((a) => a.value === v)?.label ?? v).join(", ")
    : "None required";

  if (!c) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Nav signedIn={true} current="search" />
        <div style={{ maxWidth: 1080, margin: "80px auto", padding: 32 }}>
          <div style={{ height: 200, background: "var(--surface-2)", borderRadius: "var(--cs-radius-lg)", opacity: 0.4 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav signedIn={true} current="search" />
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "32px 32px 64px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: "var(--muted)", fontSize: 12.5 }}>
          <Link href={`/campgrounds/${c.id}`}>{c.name}</Link>
          <Icon name="chevron" size={12} />
          <span style={{ color: "var(--ink)" }}>Configure alert</span>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", marginBottom: 20, borderRadius: 4, background: "color-mix(in oklch, var(--accent) 12%, transparent)", color: "var(--accent)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40 }}>
          <div>
            <h1 style={{ fontSize: 38, marginBottom: 8 }}>Configure your alert</h1>
            <p className="cs-muted" style={{ fontSize: 14.5, marginBottom: 32, maxWidth: 540 }}>
              We'll watch {c.name} continuously and ping you the moment a match opens.
            </p>

            {/* 01 Dates */}
            <FormGroup num="01" title="Dates" sub="Pick a target range. Add flexibility if your plans can shift.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Arrive</label>
                  <input className="cs-input" type="date" value={arriveDate} onChange={(e) => setArriveDate(e.target.value)} />
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Depart</label>
                  <input className="cs-input" type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
                </div>
              </div>
              <label className="cs-label" style={{ display: "block", marginBottom: 8 }}>Flexibility</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[["exact", "Exact dates"], ["3d", "± 3 days"], ["week", "Any week of Jul"], ["wknd", "Weekends only"]].map(([k, l]) => (
                  <button key={k} onClick={() => setFlex(k)}
                    className="cs-btn cs-btn--ghost cs-btn--sm"
                    style={{ borderColor: flex === k ? "var(--ink)" : "var(--border)", background: flex === k ? "var(--surface-2)" : "transparent", padding: "10px 12px" }}>
                    {l}
                  </button>
                ))}
              </div>
            </FormGroup>

            {/* 02 Site preferences */}
            <FormGroup num="02" title="Site preferences" sub="Watch specific sites you've picked, or cast a wide net.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {([["specific", "Specific sites only", siteIds.length ? `Sites: ${siteIds.join(", ")}` : "Pick from map"], ["any", "Any site matching filters", "Filter by type, size & amenities"]] as const).map(([k, t, d]) => (
                  <button key={k} onClick={() => setSiteMode(k)} className="cs-card"
                    style={{ padding: 16, textAlign: "left", cursor: "pointer", outline: siteMode === k ? "2px solid var(--primary)" : "none", background: siteMode === k ? "var(--surface-2)" : "var(--surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: "1.5px solid " + (siteMode === k ? "var(--primary)" : "var(--border-strong)"),
                        background: siteMode === k ? "var(--primary)" : "transparent",
                        boxShadow: siteMode === k ? "inset 0 0 0 3px var(--surface-2)" : "none",
                        flexShrink: 0,
                      }} />
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t}</div>
                    </div>
                    <div className="cs-muted cs-mono" style={{ fontSize: 11.5, paddingLeft: 26 }}>{d}</div>
                  </button>
                ))}
              </div>

              {siteMode === "specific" ? (
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 8 }}>
                    Watched sites {siteIds.length > 0 ? `· ${siteIds.length}` : ""}
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {siteIds.length === 0 ? (
                      <p className="cs-muted" style={{ fontSize: 13, margin: 0 }}>
                        No sites selected. Go back and click cells in the availability grid.
                      </p>
                    ) : (
                      siteIds.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => removeSiteId(n)}
                          className="cs-pill"
                          style={{ padding: "6px 12px", fontSize: 12, background: "var(--primary)", color: "var(--primary-ink)", borderColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                        >
                          Site {n} <Icon name="x" size={11} />
                        </button>
                      ))
                    )}
                    <Link href={`/campgrounds/${c.id}`} className="cs-btn cs-btn--quiet cs-btn--sm">
                      <Icon name="plus" size={12} /> Pick from grid
                    </Link>
                  </div>
                </div>
              ) : (
                /* ── Filter dropdowns ── */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>

                  {/* Site type */}
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Site type</label>
                    <Dropdown
                      label={siteTypeLabel}
                      open={openDrop === "type"}
                      onToggle={() => setOpenDrop((o) => o === "type" ? null : "type")}
                      onClose={() => setOpenDrop(null)}
                    >
                      <div style={{ padding: "6px 0" }}>
                        {SITE_TYPES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => { setSiteType(t.value); setOpenDrop(null); }}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              width: "100%", padding: "9px 14px", background: "transparent",
                              border: "none", cursor: "pointer", fontSize: 13, textAlign: "left",
                              color: siteType === t.value ? "var(--primary)" : "var(--ink)",
                              fontWeight: siteType === t.value ? 600 : 400,
                            }}
                          >
                            {t.label}
                            {siteType === t.value && <Icon name="check" size={13} />}
                          </button>
                        ))}
                      </div>
                    </Dropdown>
                  </div>

                  {/* Min occupancy */}
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Min occupancy</label>
                    <Dropdown
                      label={minOccupancy === 1 ? "Any size" : `${minOccupancy}+ people`}
                      open={openDrop === "occupancy"}
                      onToggle={() => setOpenDrop((o) => o === "occupancy" ? null : "occupancy")}
                      onClose={() => setOpenDrop(null)}
                    >
                      <div style={{ padding: "12px 14px" }}>
                        <div className="cs-label" style={{ marginBottom: 10 }}>Minimum people</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
                          <button
                            type="button"
                            className="cs-btn cs-btn--quiet cs-btn--sm"
                            style={{ width: 32, height: 32, padding: 0, justifyContent: "center" }}
                            onClick={() => setMinOccupancy((n) => Math.max(1, n - 1))}
                            disabled={minOccupancy <= 1}
                          >−</button>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, minWidth: 40, textAlign: "center" }}>
                            {minOccupancy}
                          </span>
                          <button
                            type="button"
                            className="cs-btn cs-btn--quiet cs-btn--sm"
                            style={{ width: 32, height: 32, padding: 0, justifyContent: "center" }}
                            onClick={() => setMinOccupancy((n) => Math.min(12, n + 1))}
                            disabled={minOccupancy >= 12}
                          >+</button>
                        </div>
                        <p className="cs-muted" style={{ fontSize: 11, textAlign: "center", marginTop: 8 }}>
                          {minOccupancy === 1 ? "All site sizes" : `Sites sleeping ${minOccupancy}+ people`}
                        </p>
                        <button
                          type="button"
                          className="cs-btn cs-btn--sm"
                          style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                          onClick={() => setOpenDrop(null)}
                        >Done</button>
                      </div>
                    </Dropdown>
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>
                      Amenities {amenities.length > 0 && <span style={{ color: "var(--primary)" }}>· {amenities.length}</span>}
                    </label>
                    <Dropdown
                      label={amenities.length === 0 ? "None required" : `${amenities.length} selected`}
                      open={openDrop === "amenities"}
                      onToggle={() => setOpenDrop((o) => o === "amenities" ? null : "amenities")}
                      onClose={() => setOpenDrop(null)}
                    >
                      <div style={{ padding: "6px 0 10px" }}>
                        <div style={{ maxHeight: 240, overflowY: "auto" }}>
                          {AMENITY_OPTIONS.map((a) => {
                            const checked = amenities.includes(a.value);
                            return (
                              <button
                                key={a.value}
                                type="button"
                                onClick={() => toggleAmenity(a.value)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  width: "100%", padding: "8px 14px",
                                  background: "transparent", border: "none",
                                  cursor: "pointer", fontSize: 13, textAlign: "left",
                                  color: "var(--ink)",
                                }}
                              >
                                <span style={{
                                  width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                                  border: `2px solid ${checked ? "var(--primary)" : "var(--border-strong)"}`,
                                  background: checked ? "var(--primary)" : "transparent",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {checked && <Icon name="check" size={10} style={{ color: "var(--primary-ink)" }} />}
                                </span>
                                {a.label}
                              </button>
                            );
                          })}
                        </div>
                        {amenities.length > 0 && (
                          <div style={{ padding: "6px 14px 0", borderTop: "1px solid var(--border)", marginTop: 4 }}>
                            <button type="button" className="cs-btn cs-btn--quiet cs-btn--sm"
                              style={{ fontSize: 11.5, color: "var(--accent)" }}
                              onClick={() => setAmenities([])}>
                              Clear all
                            </button>
                          </div>
                        )}
                      </div>
                    </Dropdown>
                  </div>

                </div>
              )}
            </FormGroup>

            {/* 03 Party */}
            <FormGroup num="03" title="Party" sub="Match sites that fit your group.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {([["Adults", adults, setAdults], ["Kids", kids, setKids], ["Vehicles", vehicles, setVehicles]] as [string, string, (v: string) => void][]).map(([k, v, setter]) => (
                  <div key={k}>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>{k}</label>
                    <input className="cs-input" type="number" min="0" value={v} onChange={(e) => setter(e.target.value)} />
                  </div>
                ))}
              </div>
            </FormGroup>

            {/* 04 Notifications */}
            <FormGroup num="04" title="Notifications" sub="Pick channels and polling cadence.">
              <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                {([["email", "Email", "jordan@example.com", "Free"], ["sms", "SMS", "(415) 555-0142", "Pro"], ["push", "Push", "iPhone app", "Coming soon"]] as const).map(([k, t, d, tag]) => (
                  <div key={k} className="cs-card" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Icon name={k === "email" ? "mail" : k === "sms" ? "phone" : "bell"} size={16} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{t}
                          <span className="cs-pill cs-pill--muted" style={{ marginLeft: 8, fontSize: 10 }}>{tag}</span>
                        </div>
                        <div className="cs-muted cs-mono" style={{ fontSize: 11.5 }}>{d}</div>
                      </div>
                    </div>
                    <CsSwitch on={channels[k]} onChange={(v) => setChannels({ ...channels, [k]: v })} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <label className="cs-label">Polling cadence</label>
                <span className="cs-muted" style={{ fontSize: 11 }}>
                  {PLAN_LABELS[userPlan]} plan · min {PLAN_LIMITS[userPlan].minInterval}s
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {([
                  ["30",   "Every 30s",  "ranger"],
                  ["60",   "Every 60s",  "pro"   ],
                  ["300",  "Every 5m",   null     ],
                  ["1800", "Every 30m",  null     ],
                ] as [string, string, PlanKey | null][]).map(([k, label, needed]) => {
                  const locked  = needed !== null && PLAN_LIMITS[userPlan].minInterval > parseInt(k);
                  const active  = freq === k;
                  return (
                    <button
                      key={k}
                      onClick={() => !locked && setFreq(k)}
                      className="cs-btn cs-btn--ghost cs-btn--sm"
                      disabled={locked}
                      title={locked && needed ? `Requires ${PLAN_LABELS[needed]} plan` : undefined}
                      style={{
                        flexDirection: "column", gap: 3, padding: "10px 8px",
                        borderColor: active ? "var(--ink)" : locked ? "var(--border)" : "var(--border)",
                        background: active ? "var(--surface-2)" : "transparent",
                        opacity: locked ? 0.45 : 1,
                        cursor: locked ? "not-allowed" : "pointer",
                      }}
                    >
                      <span>{label}</span>
                      {needed && (
                        <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: locked ? "var(--muted)" : "var(--accent)", textTransform: "uppercase" }}>
                          {PLAN_LABELS[needed]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {PLAN_LIMITS[userPlan].minInterval > 60 && (
                <p className="cs-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
                  Your {PLAN_LABELS[userPlan]} plan polls every {PLAN_LIMITS[userPlan].minInterval}s minimum.{" "}
                  <Link href="/account/plan" style={{ color: "var(--primary)", textDecoration: "underline" }}>Upgrade</Link> for faster cadences.
                </p>
              )}
            </FormGroup>
          </div>

          {/* Right: summary card */}
          <div>
            <div className="cs-card" style={{ padding: 22, position: "sticky", top: 32 }}>
              <div className="cs-label" style={{ marginBottom: 12 }}>Alert summary</div>
              <h3 style={{ fontSize: 22, marginBottom: 4 }}>{c.name}</h3>
              <div className="cs-muted" style={{ fontSize: 12.5, marginBottom: 18 }}>{c.park}</div>
              <div style={{ display: "grid", gap: 12, fontSize: 13, marginBottom: 18 }}>
                {([
                  ["Dates",    `${arriveDate} – ${departDate}`],
                  ["Flex",     flexLabel[flex]],
                  ["Sites",    siteMode === "specific"
                    ? (siteIds.length ? `${siteIds.join(", ")}` : "None selected")
                    : "Any matching filters"],
                  ...(siteMode === "any" ? [
                    ["Type",       siteTypeLabel],
                    ["Min size",   minOccupancy === 1 ? "Any" : `${minOccupancy}+ people`],
                    ["Amenities",  amenities.length ? `${amenities.length} required` : "None"],
                  ] : []),
                  ["Party",    `${adults} adults · ${kids} kid${parseInt(kids) !== 1 ? "s" : ""}`],
                  ["Channels", Object.entries(channels).filter(([, v]) => v).map(([k]) => k).join(", ").toUpperCase() || "—"],
                  ["Cadence",  `Every ${freqLabel[String(Math.max(parseInt(freq), PLAN_LIMITS[userPlan].minInterval))]}`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: "1px dashed var(--border)" }}>
                    <span className="cs-muted">{k}</span>
                    <span style={{ fontWeight: 500, textAlign: "right", maxWidth: 160 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button className="cs-btn cs-btn--lg" style={{ width: "100%" }} onClick={handleSubmit} disabled={submitting}>
                <Icon name="bell" size={14} /> {submitting ? "Saving…" : "Start monitoring"}
              </button>
              <p className="cs-muted" style={{ fontSize: 11.5, marginTop: 10, textAlign: "center" }}>
                You can pause or edit this alert any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page export with Suspense (required for useSearchParams) ─────────────────
export default function CreateAlertPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Nav signedIn={true} current="search" />
        <div style={{ maxWidth: 1080, margin: "80px auto", padding: 32 }}>
          <div style={{ height: 300, background: "var(--surface-2)", borderRadius: "var(--cs-radius-lg)", opacity: 0.4 }} />
        </div>
      </div>
    }>
      <CreateAlertForm />
    </Suspense>
  );
}
