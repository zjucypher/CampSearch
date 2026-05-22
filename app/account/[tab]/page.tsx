"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import CsSwitch from "@/components/cs/CsSwitch";
import type { IconName } from "@/components/cs/Icon";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

function getSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  const searchParams = useSearchParams();
  const tab = params.tab ?? "profile";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Editable profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email ?? "");
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data: p }) => {
        if (!p) return;
        const prof = p as Profile;
        setProfile(prof);
        setFullName(prof.full_name ?? "");
        setPhone(prof.phone ?? "");
        setTimezone(prof.timezone);
        setNotifyEmail(prof.notify_email);
        setNotifySms(prof.notify_sms);
      });
    });
  }, []);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const supabase = getSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any).update({
      full_name: fullName,
      phone,
      timezone,
      notify_email: notifyEmail,
      notify_sms: notifySms,
    }).eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleUpgrade(plan: "pro" | "ranger") {
    setUpgrading(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setUpgrading(null);
  }

  const currentPlan = profile?.plan ?? "free";
  const upgraded = searchParams.get("upgraded") === "1";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav signedIn={true} current="account" />
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "32px 32px 64px" }}>
        <h1 style={{ fontSize: 38, marginBottom: 8 }}>Account & preferences</h1>
        <p className="cs-muted" style={{ marginBottom: 28 }}>Manage your alerts, notifications, and billing.</p>

        {upgraded && (
          <div style={{ padding: "12px 16px", marginBottom: 20, borderRadius: 4, background: "color-mix(in oklch, var(--success) 14%, transparent)", color: "var(--success)", fontSize: 13 }}>
            Plan upgraded successfully! Your new limits are active.
          </div>
        )}

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
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 24 }}>Update your name, email, and preferences.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Full name</label>
                    <input className="cs-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Email</label>
                    <input className="cs-input" value={userEmail} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Phone</label>
                    <input className="cs-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(415) 555-0142" />
                  </div>
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Time zone</label>
                    <input className="cs-input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                  </div>
                </div>
                <button className="cs-btn cs-btn--sm" onClick={saveProfile} disabled={saving}>
                  {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}

            {tab === "notifications" && (
              <div className="cs-card" style={{ padding: 26 }}>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>Notification channels</h3>
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 20 }}>How and when CampSearch can reach you.</p>
                <div style={{ display: "grid", gap: 14 }}>
                  {[
                    { t: "Email", sub: userEmail || "—", on: notifyEmail, setOn: setNotifyEmail, scope: "Always" },
                    { t: "SMS", sub: phone || "Add phone in Profile", on: notifySms, setOn: setNotifySms, scope: "Hits only" },
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
                <button className="cs-btn cs-btn--sm" style={{ marginTop: 20 }} onClick={saveProfile} disabled={saving}>
                  {saved ? "Saved!" : saving ? "Saving…" : "Save preferences"}
                </button>
              </div>
            )}

            {tab === "plan" && (
              <div className="cs-card" style={{ padding: 26 }}>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>Plan & billing</h3>
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 20 }}>
                  You&apos;re on the <strong style={{ textTransform: "capitalize" }}>{currentPlan}</strong> tier.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {([
                    ["free", "Free", "$0", "2 alerts", "5-min polling"],
                    ["pro", "Pro", "$8 /mo", "10 alerts", "60s polling + SMS"],
                    ["ranger", "Ranger", "$24 /mo", "Unlimited alerts", "30s polling + priority"],
                  ] as [string, string, string, string, string][]).map(([key, n, p, a1, a2]) => {
                    const isCurrent = currentPlan === key;
                    const isHighlight = key === "pro";
                    return (
                      <div key={key} className="cs-card" style={{
                        padding: 18,
                        background: isHighlight ? "var(--primary)" : "var(--surface)",
                        color: isHighlight ? "var(--primary-ink)" : "var(--ink)",
                        borderColor: isCurrent ? "var(--ink)" : isHighlight ? "transparent" : "var(--border)",
                        outline: isCurrent ? "2px solid var(--ink)" : "none",
                      }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>{n}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, margin: "8px 0 14px" }}>{p}</div>
                        <div style={{ fontSize: 12.5, opacity: 0.8, marginBottom: 6 }}>{a1}</div>
                        <div style={{ fontSize: 12.5, opacity: 0.8, marginBottom: 16 }}>{a2}</div>
                        {isCurrent ? (
                          <button className={`cs-btn cs-btn--sm${isHighlight ? "" : " cs-btn--ghost"}`} style={{ width: "100%", opacity: 0.6 }} disabled>
                            Current plan
                          </button>
                        ) : key === "free" ? (
                          <button className="cs-btn cs-btn--ghost cs-btn--sm" style={{ width: "100%" }} disabled>
                            Downgrade
                          </button>
                        ) : (
                          <button
                            className={`cs-btn cs-btn--sm${isHighlight ? "" : " cs-btn--ghost"}`}
                            style={{ width: "100%" }}
                            disabled={upgrading === key}
                            onClick={() => handleUpgrade(key as "pro" | "ranger")}
                          >
                            {upgrading === key ? "Redirecting…" : "Upgrade"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "alerts" && (
              <div className="cs-card" style={{ padding: 26 }}>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>Default alert settings</h3>
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 24 }}>Used as starting values when you create a new alert.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Default party size</label>
                    <input className="cs-input" defaultValue={`${profile?.default_adults ?? 2} adults`} />
                  </div>
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Default flexibility</label>
                    <input className="cs-input" defaultValue={profile?.default_flexibility ?? "exact"} />
                  </div>
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Default polling</label>
                    <input className="cs-input" defaultValue={`Every ${profile?.default_poll ?? 60}s`} />
                  </div>
                  <div>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Default channels</label>
                    <input className="cs-input" defaultValue={(profile?.default_channels ?? ["email"]).join(" + ").toUpperCase()} />
                  </div>
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
