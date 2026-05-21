// CampSearch — Landing + Signup screens

function LandingScreen({ onNav, theme }) {
  return (
    <div className="cs-screen">
      <Nav onNav={onNav} signedIn={false}/>

      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        {theme === "topo" && <TopoBg opacity={0.18} color="var(--primary)"/>}
        <div style={{
          maxWidth: 1180, margin: "0 auto", width: "100%",
          padding: "60px 32px 40px",
          display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 56,
          alignItems: "center",
          position: "relative",
        }}>
          <div>
            <div className="cs-label" style={{ marginBottom: 18 }}>
              {theme === "ranger" ? "Est. 2024 · 138 California campgrounds" : "Monitoring 138 California campgrounds"}
            </div>
            <h1 style={{
              fontSize: 64, lineHeight: 1.02,
              marginBottom: 20,
              maxWidth: 580,
            }}>
              Get notified the second a campsite opens up.
            </h1>
            <p style={{ fontSize: 17, color: "var(--ink-2)", maxWidth: 480, marginBottom: 28 }}>
              CampSearch watches Yosemite, Big Sur, Joshua Tree and 135 other
              California campgrounds and pings you the moment a site matching your
              criteria becomes available. Cancellations happen — be first.
            </p>
            <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
              <button className="cs-btn cs-btn--lg" onClick={() => onNav("signup")}>
                Start monitoring — free
                <Icon name="arrow" size={16}/>
              </button>
              <button className="cs-btn cs-btn--ghost cs-btn--lg" onClick={() => onNav("search")}>
                Browse campgrounds
              </button>
            </div>
            <div style={{ display: "flex", gap: 28, color: "var(--muted)", fontSize: 12.5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="check" size={14}/> Cancellation detection
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="check" size={14}/> Email + SMS
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="check" size={14}/> No card to start
              </span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <Photo label="hero · upper pines at dusk · 1280×860" height={380}/>
            {/* Floating notification preview */}
            <div className="cs-card" style={{
              position: "absolute",
              bottom: -28, right: -16,
              padding: 14, width: 280,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--accent)", color: "var(--bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}><Icon name="bell" size={15} stroke={2.2}/></div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>
                  Site found · Upper Pines #14
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  Jul 18 – Jul 20, 2026 · 32s ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — quick 3 step */}
      <section style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto", width: "100%",
          padding: "56px 32px",
        }}>
          <SectionHead
            eyebrow="How it works"
            title="Three steps. Then we watch while you sleep."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              ["01", "Pick your dates and parks", "Be specific or flexible. Watch a single site number, or any tent site within a 7-day window."],
              ["02", "We poll every 30 seconds", "Direct from Recreation.gov and ReserveCalifornia. We catch cancellations the instant they appear."],
              ["03", "You get pinged. You book.", "Email or SMS the second a match opens. We hand you a one-click deep link to the reservation page."],
            ].map(([n, t, d]) => (
              <div key={n} className="cs-card" style={{ padding: 24, position: "relative" }}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36, color: "var(--accent)",
                  marginBottom: 12, lineHeight: 1,
                }}>{n}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 19, marginBottom: 8 }}>{t}</div>
                <div className="cs-muted" style={{ fontSize: 13.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES strip */}
      <section style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto", width: "100%",
          padding: "56px 32px",
          display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56, alignItems: "center",
        }}>
          <div>
            <div className="cs-label" style={{ marginBottom: 16 }}>What's monitored</div>
            <h2 style={{ fontSize: 34, marginBottom: 16, maxWidth: 460 }}>
              Built for the way Californians actually camp.
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 14 }}>
              {[
                ["Date flexibility", "Any 2 nights in July. Weekends only. Wed-arrival. We handle the search permutations."],
                ["Specific-site picks", "Want only sites 14, 15, or 22? Pin them. We ignore everything else."],
                ["Multi-park tracking", "Run alerts across Yosemite, Sequoia, Big Sur — one dashboard."],
                ["Cancellation detection", "We diff every 30s and surface dropped reservations within seconds."],
                ["Instant SMS + email", "Pick your channel. Sub-second push from match to phone."],
              ].map(([t, d]) => (
                <li key={t} style={{ display: "flex", gap: 14 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                    color: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}><Icon name="check" size={13} stroke={2.4}/></span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{t}</div>
                    <div className="cs-muted" style={{ fontSize: 13 }}>{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="cs-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="cs-label">Live · last 24 hours</div>
              <span className="cs-pill cs-pill--success">
                <span className="cs-dot"/> 47 matches found
              </span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Upper Pines #14", "2 min ago", "Jul 18 – 20"],
                ["Kirby Cove #3", "14 min ago", "Aug 8 – 10"],
                ["Kirk Creek #18", "1h ago", "Sep 4 – 7"],
                ["Wright's Beach #11", "3h ago", "Jun 26 – 28"],
              ].map(([n, t, d], i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{n}</div>
                    <div className="cs-muted cs-mono" style={{ fontSize: 11 }}>{d}</div>
                  </div>
                  <span className="cs-muted cs-mono" style={{ fontSize: 11 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section style={{ background: "var(--primary)", color: "var(--primary-ink)" }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto", width: "100%",
          padding: "44px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32,
        }}>
          <div>
            <h2 style={{ color: "var(--primary-ink)", fontSize: 28, marginBottom: 8 }}>
              Half Dome doesn't book itself.
            </h2>
            <p style={{ opacity: 0.75, fontSize: 14.5 }}>Start a free alert in under a minute. No credit card.</p>
          </div>
          <button className="cs-btn cs-btn--accent cs-btn--lg" onClick={() => onNav("signup")}>
            Set up your first alert
            <Icon name="arrow" size={16}/>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "28px 32px", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12.5, color: "var(--muted)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size="sm"/>
          <span>· Made in California · v0.4</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <a>Privacy</a><a>Terms</a><a>Coverage</a><a>Status</a>
        </div>
      </footer>
    </div>
  );
}

function SignupScreen({ onNav }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="cs-screen">
      <Nav onNav={onNav} signedIn={false}/>
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}>
        {/* Left form */}
        <div style={{
          display: "flex", flexDirection: "column",
          padding: "60px 60px",
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
                  <input className="cs-input" placeholder="Jordan Diaz" value={name} onChange={e => setName(e.target.value)}/>
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Email</label>
                  <input className="cs-input" type="email" placeholder="jordan@example.com" value={email} onChange={e => setEmail(e.target.value)}/>
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Password</label>
                  <input className="cs-input" type="password" placeholder="••••••••••" defaultValue="••••••••••"/>
                </div>
              </div>
              <button className="cs-btn cs-btn--lg" onClick={() => setStep(2)} style={{ width: "100%" }}>
                Continue
                <Icon name="arrow" size={16}/>
              </button>
              <div style={{
                display: "flex", alignItems: "center", gap: 14, margin: "20px 0",
                color: "var(--muted)", fontSize: 12,
              }}>
                <hr className="cs-divider" style={{ flex: 1 }}/>
                <span>or</span>
                <hr className="cs-divider" style={{ flex: 1 }}/>
              </div>
              <button className="cs-btn cs-btn--ghost" style={{ width: "100%" }}>Continue with Google</button>
              <p className="cs-muted" style={{ marginTop: 24, fontSize: 12.5 }}>
                Already have an account? <a onClick={() => onNav("dashboard")} style={{ color: "var(--ink)", textDecoration: "underline", cursor: "pointer" }}>Sign in</a>
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
                      background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                      color: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name="mail" size={16}/></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>Email · {email || "jordan@example.com"}</div>
                      <div className="cs-muted" style={{ fontSize: 12 }}>Free · unlimited</div>
                    </div>
                  </div>
                  <Switch on={true} onChange={() => {}}/>
                </div>
                <div className="cs-card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "color-mix(in oklch, var(--accent) 16%, transparent)",
                      color: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name="phone" size={16}/></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>SMS</div>
                      <div className="cs-muted" style={{ fontSize: 12 }}>Pro plan · sub-second alerts</div>
                    </div>
                  </div>
                  <Switch on={false} onChange={() => {}}/>
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Phone (optional)</label>
                  <input className="cs-input" placeholder="(415) 555-0142"/>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="cs-btn cs-btn--ghost" onClick={() => setStep(1)}>Back</button>
                <button className="cs-btn cs-btn--lg" style={{ flex: 1 }} onClick={() => onNav("search")}>
                  Start your first alert
                  <Icon name="arrow" size={16}/>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        <div style={{
          background: "var(--bg-2)",
          position: "relative",
          overflow: "hidden",
          padding: 60,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <TopoBg opacity={0.22} color="var(--primary)"/>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="cs-label" style={{ marginBottom: 16 }}>This week</div>
            <h3 style={{ fontSize: 26, marginBottom: 24, maxWidth: 360 }}>
              <span style={{ color: "var(--accent)" }}>3,841</span> reservations watched · <span style={{ color: "var(--accent)" }}>492</span> hits delivered
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
                    <span className="cs-dot"/> caught
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

Object.assign(window, { LandingScreen, SignupScreen });
