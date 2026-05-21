"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import CsSwitch from "@/components/cs/CsSwitch";
import type { IconName } from "@/components/cs/Icon";

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>{label}</label>
      <input className="cs-input" defaultValue={defaultValue} />
    </div>
  );
}

const NAV_ITEMS: { key: string; label: string; icon: IconName }[] = [
  { key: "profile", label: "Profile", icon: "user" },
  { key: "notifications", label: "Notifications", icon: "bell" },
  { key: "plan", label: "Plan & billing", icon: "bolt" },
  { key: "alerts", label: "Alert defaults", icon: "settings" },
];

export default function AccountPage() {
  const params = useParams<{ tab: string }>();
  const tab = params.tab ?? "profile";

  const [emailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(true);
  const [pushOn, setPushOn] = useState(false);
  const [quietOn, setQuietOn] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav signedIn={true} current="account" />
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "32px 32px 64px" }}>
        <h1 style={{ fontSize: 38, marginBottom: 8 }}>Account & preferences</h1>
        <p className="cs-muted" style={{ marginBottom: 28 }}>Manage your alerts, notifications, and billing.</p>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 40 }}>
          {/* Sidebar nav */}
          <div style={{ display: "grid", gap: 4, alignContent: "start" }}>
            {NAV_ITEMS.map(({ key, label, icon }) => (
              <Link key={key} href={`/account/${key}`}
                className="cs-btn cs-btn--quiet"
                style={{
                  justifyContent: "flex-start",
                  background: tab === key ? "var(--surface-2)" : "transparent",
                  color: tab === key ? "var(--ink)" : "var(--ink-2)",
                  fontWeight: tab === key ? 600 : 400,
                  padding: "10px 14px",
                }}>
                <Icon name={icon} size={14} /> {label}
              </Link>
            ))}
          </div>

          {/* Content */}
          <div>
            {tab === "profile" && (
              <div className="cs-card" style={{ padding: 26 }}>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>Profile</h3>
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 24 }}>Update your name, email, and password.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <Field label="Full name" defaultValue="Jordan Diaz" />
                  <Field label="Email" defaultValue="jordan@example.com" />
                  <Field label="Phone" defaultValue="(415) 555-0142" />
                  <Field label="Time zone" defaultValue="Pacific (UTC-08)" />
                </div>
                <button className="cs-btn cs-btn--sm">Save changes</button>
              </div>
            )}

            {tab === "notifications" && (
              <div className="cs-card" style={{ padding: 26 }}>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>Notification channels</h3>
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 20 }}>How and when CampSearch can reach you.</p>
                <div style={{ display: "grid", gap: 14 }}>
                  {[
                    { t: "Email", sub: "jordan@example.com", on: emailOn, setOn: () => {}, scope: "Always" },
                    { t: "SMS", sub: "(415) 555-0142", on: smsOn, setOn: setSmsOn, scope: "Hits only" },
                    { t: "Push (iOS)", sub: "Not installed", on: pushOn, setOn: setPushOn, scope: "—" },
                    { t: "Quiet hours", sub: "11:00 PM – 6:30 AM", on: quietOn, setOn: setQuietOn, scope: "SMS only" },
                  ].map(({ t, sub, on, setOn, scope }) => (
                    <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t}</div>
                        <div className="cs-muted" style={{ fontSize: 12 }}>{sub} · {scope}</div>
                      </div>
                      <CsSwitch on={on} onChange={setOn} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "plan" && (
              <div className="cs-card" style={{ padding: 26 }}>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>Plan & billing</h3>
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 20 }}>You're on the Free tier.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {[
                    ["Free", "$0", "1 alert", "5-minute polling", false],
                    ["Pro", "$8 /mo", "10 alerts", "30s polling + SMS", true],
                    ["Ranger", "$24 /mo", "Unlimited alerts", "10s polling + priority", false],
                  ].map(([n, p, a1, a2, hl]) => (
                    <div key={n as string} className="cs-card" style={{
                      padding: 18,
                      background: hl ? "var(--primary)" : "var(--surface)",
                      color: hl ? "var(--primary-ink)" : "var(--ink)",
                      borderColor: hl ? "transparent" : "var(--border)",
                    }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>{n}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, margin: "8px 0 14px" }}>{p}</div>
                      <div style={{ fontSize: 12.5, opacity: hl ? 0.85 : 0.65, marginBottom: 6 }}>{a1}</div>
                      <div style={{ fontSize: 12.5, opacity: hl ? 0.85 : 0.65, marginBottom: 16 }}>{a2}</div>
                      <button className={`cs-btn cs-btn--sm${hl ? "" : " cs-btn--ghost"}`} style={{ width: "100%" }}>
                        {hl ? "Upgrade" : "Choose"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "alerts" && (
              <div className="cs-card" style={{ padding: 26 }}>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>Default alert settings</h3>
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 24 }}>Used as starting values when you create a new alert.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <Field label="Default party size" defaultValue="2 adults" />
                  <Field label="Default flexibility" defaultValue="± 3 days" />
                  <Field label="Default polling" defaultValue="Every 60s" />
                  <Field label="Default channels" defaultValue="Email + SMS" />
                </div>
                <hr className="cs-divider" style={{ margin: "20px 0" }} />
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, marginBottom: 10 }}>Region focus</h4>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Central Sierra", "Big Sur", "North Coast", "Bay Area", "Mojave"].map((r) => {
                    const active = ["Central Sierra", "Big Sur"].includes(r);
                    return (
                      <span key={r} className="cs-pill" style={{
                        padding: "6px 12px", cursor: "pointer",
                        background: active ? "var(--primary)" : "var(--surface-2)",
                        color: active ? "var(--primary-ink)" : "var(--ink-2)",
                        borderColor: "transparent",
                      }}>{r}</span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
