"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import TopoBg from "@/components/cs/TopoBg";
import CsSwitch from "@/components/cs/CsSwitch";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sms, setSms] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav signedIn={false} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>

        {/* Left form */}
        <div style={{
          display: "flex", flexDirection: "column",
          padding: "60px",
          maxWidth: 540, margin: "0 auto", width: "100%",
          justifyContent: "center",
        }}>
          <div className="cs-label" style={{ marginBottom: 12 }}>Step {step} of 2</div>

          {step === 1 ? (
            <>
              <h1 style={{ fontSize: 38, marginBottom: 10 }}>Create your account</h1>
              <p className="cs-muted" style={{ marginBottom: 28, fontSize: 14.5 }}>
                Free tier monitors 1 alert with 5-minute polling. Upgrade any time.
              </p>
              <div style={{ display: "grid", gap: 18, marginBottom: 24 }}>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Full name</label>
                  <input className="cs-input" placeholder="Jordan Diaz" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Email</label>
                  <input className="cs-input" type="email" placeholder="jordan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Password</label>
                  <input className="cs-input" type="password" placeholder="••••••••••" />
                </div>
              </div>
              <button className="cs-btn cs-btn--lg" onClick={() => setStep(2)} style={{ width: "100%" }}>
                Continue <Icon name="arrow" size={16} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0", color: "var(--muted)", fontSize: 12 }}>
                <hr className="cs-divider" style={{ flex: 1 }} />
                <span>or</span>
                <hr className="cs-divider" style={{ flex: 1 }} />
              </div>
              <button className="cs-btn cs-btn--ghost" style={{ width: "100%" }}>
                Continue with Google
              </button>
              <p className="cs-muted" style={{ marginTop: 24, fontSize: 12.5 }}>
                Already have an account?{" "}
                <Link href="/dashboard" style={{ color: "var(--ink)", textDecoration: "underline" }}>Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 38, marginBottom: 10 }}>How should we ping you?</h1>
              <p className="cs-muted" style={{ marginBottom: 28, fontSize: 14.5 }}>
                You can change these any time in Account settings.
              </p>
              <div style={{ display: "grid", gap: 14, marginBottom: 28 }}>
                <div className="cs-card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "color-mix(in oklch, var(--primary) 14%, transparent)", color: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name="mail" size={16} /></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>Email · {email || "jordan@example.com"}</div>
                      <div className="cs-muted" style={{ fontSize: 12 }}>Free · unlimited</div>
                    </div>
                  </div>
                  <CsSwitch on={true} onChange={() => {}} />
                </div>
                <div className="cs-card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "color-mix(in oklch, var(--accent) 16%, transparent)", color: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name="phone" size={16} /></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>SMS</div>
                      <div className="cs-muted" style={{ fontSize: 12 }}>Pro plan · sub-second alerts</div>
                    </div>
                  </div>
                  <CsSwitch on={sms} onChange={setSms} />
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Phone (optional)</label>
                  <input className="cs-input" placeholder="(415) 555-0142" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="cs-btn cs-btn--ghost" onClick={() => setStep(1)}>Back</button>
                <Link href="/search" className="cs-btn cs-btn--lg" style={{ flex: 1, justifyContent: "center" }}>
                  Start your first alert <Icon name="arrow" size={16} />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        <div style={{
          background: "var(--bg-2)", position: "relative", overflow: "hidden",
          padding: 60, display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <TopoBg opacity={0.22} color="var(--primary)" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="cs-label" style={{ marginBottom: 16 }}>This week</div>
            <h3 style={{ fontSize: 26, marginBottom: 24, maxWidth: 360 }}>
              <span style={{ color: "var(--accent)" }}>3,841</span> reservations watched ·{" "}
              <span style={{ color: "var(--accent)" }}>492</span> hits delivered
            </h3>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 12 }}>
            {[
              ["Upper Pines #14", "Jul 18–20", "Yosemite NP"],
              ["Kirby Cove #3", "Aug 8–10", "Golden Gate"],
              ["Kirk Creek #18", "Sep 4–7", "Los Padres NF"],
            ].map(([n, d, p], i) => (
              <div key={i} className="cs-card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n}</div>
                  <div className="cs-muted" style={{ fontSize: 11.5 }}>{p}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="cs-mono" style={{ fontSize: 12 }}>{d}</div>
                  <div className="cs-pill cs-pill--success" style={{ marginTop: 4 }}>
                    <span className="cs-dot" /> caught
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
