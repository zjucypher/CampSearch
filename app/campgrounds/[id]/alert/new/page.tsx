"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import FormGroup from "@/components/cs/FormGroup";
import CsSwitch from "@/components/cs/CsSwitch";
import { campgrounds } from "@/lib/data";

type Channels = { email: boolean; sms: boolean; push: boolean };

export default function CreateAlertPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const c = campgrounds.find((x) => x.id === id) ?? campgrounds[0];

  const [flex, setFlex] = useState("exact");
  const [siteMode, setSiteMode] = useState<"specific" | "any">("specific");
  const [channels, setChannels] = useState<Channels>({ email: true, sms: true, push: false });
  const [freq, setFreq] = useState("60");

  const flexLabel: Record<string, string> = {
    exact: "Exact dates", "3d": "± 3 days", week: "Any week of July", wknd: "Weekends only",
  };
  const freqLabel: Record<string, string> = { "30": "30s", "60": "60s", "300": "5m", "1800": "30m" };

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
                  <input className="cs-input" defaultValue="Sat, Jul 18, 2026" />
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Depart</label>
                  <input className="cs-input" defaultValue="Mon, Jul 20, 2026" />
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
                {([["specific", "Specific sites only", "14, 15, 22"], ["any", "Any site matching filters", "≈ 47 sites match"]] as const).map(([k, t, d]) => (
                  <button key={k} onClick={() => setSiteMode(k)} className="cs-card"
                    style={{ padding: 16, textAlign: "left", cursor: "pointer", outline: siteMode === k ? "2px solid var(--primary)" : "none", background: siteMode === k ? "var(--surface-2)" : "var(--surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: "1.5px solid " + (siteMode === k ? "var(--primary)" : "var(--border-strong)"),
                        background: siteMode === k ? "var(--primary)" : "transparent",
                        boxShadow: siteMode === k ? "inset 0 0 0 3px var(--surface-2)" : "none",
                      }} />
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t}</div>
                    </div>
                    <div className="cs-muted cs-mono" style={{ fontSize: 11.5, paddingLeft: 26 }}>{d}</div>
                  </button>
                ))}
              </div>
              {siteMode === "specific" ? (
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 8 }}>Watched sites · 3</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[14, 15, 22].map((n) => (
                      <span key={n} className="cs-pill" style={{ padding: "6px 12px", fontSize: 12, background: "var(--primary)", color: "var(--primary-ink)", borderColor: "transparent" }}>
                        Site {n} <Icon name="x" size={11} />
                      </span>
                    ))}
                    <Link href={`/campgrounds/${c.id}`} className="cs-btn cs-btn--quiet cs-btn--sm">
                      <Icon name="plus" size={12} /> Pick more from map
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[["Site type", "Tent only"], ["Min occupancy", "4 people"], ["Amenities", "Fire ring + Water"]].map(([k, v]) => (
                    <div key={k}>
                      <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>{k}</label>
                      <button className="cs-btn cs-btn--ghost cs-btn--sm" style={{ width: "100%", justifyContent: "space-between" }}>
                        {v} <Icon name="chevronDown" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormGroup>

            {/* 03 Party */}
            <FormGroup num="03" title="Party" sub="Match sites that fit your group.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[["Adults", "2"], ["Kids", "1"], ["Vehicles", "1"]].map(([k, v]) => (
                  <div key={k}>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>{k}</label>
                    <input className="cs-input" defaultValue={v} />
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
              <label className="cs-label" style={{ display: "block", marginBottom: 8 }}>Polling cadence</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[["30", "Every 30s · Pro"], ["60", "Every 60s"], ["300", "Every 5m"], ["1800", "Every 30m"]].map(([k, l]) => (
                  <button key={k} onClick={() => setFreq(k)}
                    className="cs-btn cs-btn--ghost cs-btn--sm"
                    style={{ borderColor: freq === k ? "var(--ink)" : "var(--border)", background: freq === k ? "var(--surface-2)" : "transparent", padding: "10px 8px" }}>
                    {l}
                  </button>
                ))}
              </div>
            </FormGroup>
          </div>

          {/* Right: summary card */}
          <div>
            <div className="cs-card" style={{ padding: 22, position: "sticky", top: 32 }}>
              <div className="cs-label" style={{ marginBottom: 12 }}>Alert summary</div>
              <h3 style={{ fontSize: 22, marginBottom: 4 }}>{c.name}</h3>
              <div className="cs-muted" style={{ fontSize: 12.5, marginBottom: 18 }}>{c.park}</div>
              <div style={{ display: "grid", gap: 12, fontSize: 13, marginBottom: 18 }}>
                {[
                  ["Dates", "Jul 18 – Jul 20, 2026"],
                  ["Flexibility", flexLabel[flex]],
                  ["Sites", siteMode === "specific" ? "14, 15, 22 only" : "Any matching filters"],
                  ["Party", "2 adults · 1 kid"],
                  ["Channels", Object.entries(channels).filter(([, v]) => v).map(([k]) => k).join(", ").toUpperCase() || "—"],
                  ["Cadence", `Every ${freqLabel[freq]}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: "1px dashed var(--border)" }}>
                    <span className="cs-muted">{k}</span>
                    <span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
              <button className="cs-btn cs-btn--lg" style={{ width: "100%" }} onClick={() => router.push("/dashboard")}>
                <Icon name="bell" size={14} /> Start monitoring
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
