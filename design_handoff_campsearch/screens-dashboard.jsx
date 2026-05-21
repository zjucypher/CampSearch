// CampSearch — Create Alert + Dashboard + Email + Account

function CreateAlertScreen({ onNav, campgroundId }) {
  const data = window.CS_DATA;
  const c = data.campgrounds.find(x => x.id === campgroundId) || data.campgrounds[0];
  const [flex, setFlex] = useState("exact");
  const [siteMode, setSiteMode] = useState("specific");
  const [channels, setChannels] = useState({ email: true, sms: true, push: false });
  const [freq, setFreq] = useState("60");

  return (
    <div className="cs-screen">
      <Nav onNav={onNav} signedIn={true} current="search"/>

      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "32px 32px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: "var(--muted)", fontSize: 12.5 }}>
          <a onClick={() => onNav("detail")} style={{ cursor: "pointer" }}>{c.name}</a>
          <Icon name="chevron" size={12}/>
          <span style={{ color: "var(--ink)" }}>Configure alert</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40 }}>
          <div>
            <h1 style={{ fontSize: 38, marginBottom: 8 }}>Configure your alert</h1>
            <p className="cs-muted" style={{ fontSize: 14.5, marginBottom: 32, maxWidth: 540 }}>
              We'll watch {c.name} continuously and ping you the moment a match opens.
            </p>

            {/* Date range */}
            <FormGroup num="01" title="Dates" sub="Pick a target range. Add flexibility if your plans can shift.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Arrive</label>
                  <input className="cs-input" defaultValue="Sat, Jul 18, 2026"/>
                </div>
                <div>
                  <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Depart</label>
                  <input className="cs-input" defaultValue="Mon, Jul 20, 2026"/>
                </div>
              </div>
              <label className="cs-label" style={{ display: "block", marginBottom: 8 }}>Flexibility</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[
                  ["exact", "Exact dates"],
                  ["3d", "± 3 days"],
                  ["week", "Any week of Jul"],
                  ["wknd", "Weekends only"],
                ].map(([k, l]) => (
                  <button key={k} onClick={() => setFlex(k)}
                    className="cs-btn cs-btn--ghost cs-btn--sm"
                    style={{
                      borderColor: flex === k ? "var(--ink)" : "var(--border)",
                      background: flex === k ? "var(--surface-2)" : "transparent",
                      padding: "10px 12px",
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </FormGroup>

            {/* Site preferences */}
            <FormGroup num="02" title="Site preferences" sub="Watch specific sites you've picked, or cast a wide net.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  ["specific", "Specific sites only", "14, 15, 22"],
                  ["any", "Any site matching filters", "≈ 47 sites match"],
                ].map(([k, t, d]) => (
                  <button key={k} onClick={() => setSiteMode(k)}
                    className="cs-card"
                    style={{
                      padding: 16, textAlign: "left", cursor: "pointer",
                      outline: siteMode === k ? "2px solid var(--primary)" : "none",
                      background: siteMode === k ? "var(--surface-2)" : "var(--surface)",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: "1.5px solid " + (siteMode === k ? "var(--primary)" : "var(--border-strong)"),
                        background: siteMode === k ? "var(--primary)" : "transparent",
                        boxShadow: siteMode === k ? "inset 0 0 0 3px var(--surface-2)" : "none",
                      }}/>
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
                    {[14, 15, 22].map(n => (
                      <span key={n} className="cs-pill" style={{
                        padding: "6px 12px", fontSize: 12,
                        background: "var(--primary)", color: "var(--primary-ink)", borderColor: "transparent",
                      }}>Site {n} <Icon name="x" size={11}/></span>
                    ))}
                    <button className="cs-btn cs-btn--quiet cs-btn--sm" onClick={() => onNav("detail")}>
                      <Icon name="plus" size={12}/> Pick more from map
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    ["Site type", "Tent only"],
                    ["Min occupancy", "4 people"],
                    ["Amenities", "Fire ring + Water"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>{k}</label>
                      <button className="cs-btn cs-btn--ghost cs-btn--sm" style={{ width: "100%", justifyContent: "space-between" }}>
                        {v} <Icon name="chevronDown" size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormGroup>

            {/* Party */}
            <FormGroup num="03" title="Party" sub="Match sites that fit your group.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  ["Adults", "2"],
                  ["Kids", "1"],
                  ["Vehicles", "1"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>{k}</label>
                    <input className="cs-input" defaultValue={v}/>
                  </div>
                ))}
              </div>
            </FormGroup>

            {/* Notifications */}
            <FormGroup num="04" title="Notifications" sub="Pick channels and polling cadence.">
              <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                {[
                  ["email", "Email", "jordan@example.com", "Free"],
                  ["sms", "SMS", "(415) 555-0142", "Pro"],
                  ["push", "Push", "iPhone app", "Coming soon"],
                ].map(([k, t, d, tag]) => (
                  <div key={k} className="cs-card" style={{
                    padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Icon name={k === "email" ? "mail" : k === "sms" ? "phone" : "bell"} size={16}/>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{t}
                          <span className="cs-pill cs-pill--muted" style={{ marginLeft: 8, fontSize: 10 }}>{tag}</span>
                        </div>
                        <div className="cs-muted cs-mono" style={{ fontSize: 11.5 }}>{d}</div>
                      </div>
                    </div>
                    <Switch on={channels[k]} onChange={v => setChannels({ ...channels, [k]: v })}/>
                  </div>
                ))}
              </div>
              <label className="cs-label" style={{ display: "block", marginBottom: 8 }}>Polling cadence</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[
                  ["30", "Every 30s · Pro"],
                  ["60", "Every 60s"],
                  ["300", "Every 5m"],
                  ["1800", "Every 30m"],
                ].map(([k, l]) => (
                  <button key={k} onClick={() => setFreq(k)}
                    className="cs-btn cs-btn--ghost cs-btn--sm"
                    style={{
                      borderColor: freq === k ? "var(--ink)" : "var(--border)",
                      background: freq === k ? "var(--surface-2)" : "transparent",
                      padding: "10px 8px",
                    }}>{l}</button>
                ))}
              </div>
            </FormGroup>
          </div>

          {/* Right: summary */}
          <div>
            <div className="cs-card" style={{ padding: 22, position: "sticky", top: 32 }}>
              <div className="cs-label" style={{ marginBottom: 12 }}>Alert summary</div>
              <h3 style={{ fontSize: 22, marginBottom: 4 }}>{c.name}</h3>
              <div className="cs-muted" style={{ fontSize: 12.5, marginBottom: 18 }}>
                {c.park}
              </div>
              <div style={{ display: "grid", gap: 12, fontSize: 13, marginBottom: 18 }}>
                {[
                  ["Dates", "Jul 18 – Jul 20, 2026"],
                  ["Flexibility", flex === "exact" ? "Exact dates" : flex === "3d" ? "± 3 days" : flex === "week" ? "Any week of July" : "Weekends only"],
                  ["Sites", siteMode === "specific" ? "14, 15, 22 only" : "Any matching filters"],
                  ["Party", "2 adults · 1 kid"],
                  ["Channels", Object.entries(channels).filter(([, v]) => v).map(([k]) => k).join(", ").toUpperCase() || "—"],
                  ["Cadence", `Every ${freq === "30" ? "30s" : freq === "60" ? "60s" : freq === "300" ? "5m" : "30m"}`],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex", justifyContent: "space-between", gap: 12,
                    paddingBottom: 10, borderBottom: "1px dashed var(--border)",
                  }}>
                    <span className="cs-muted">{k}</span>
                    <span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
              <button className="cs-btn cs-btn--lg" style={{ width: "100%" }} onClick={() => onNav("dashboard")}>
                <Icon name="bell" size={14}/> Start monitoring
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

function FormGroup({ num, title, sub, children }) {
  return (
    <section style={{
      padding: "28px 0",
      borderTop: "1px solid var(--border)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 20 }}>
        <div className="cs-section-num cs-mono" style={{ paddingTop: 4, color: "var(--muted)", fontSize: 11, letterSpacing: "0.14em" }}>{num}</div>
        <div>
          <h3 style={{ fontSize: 20, marginBottom: 4 }}>{title}</h3>
          {sub && <p className="cs-muted" style={{ fontSize: 13, marginBottom: 18 }}>{sub}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

// =========================================================== DASHBOARD
function DashboardScreen({ onNav, onTrigger, toastOpen, onDismiss }) {
  const data = window.CS_DATA;
  const [active, setActive] = useState(data.alerts[0].id);

  const stats = [
    ["Active alerts", "3", "of 5 in plan"],
    ["Hits this month", "12", "+4 vs April"],
    ["Avg. response time", "47s", "from open → ping"],
    ["Watched campgrounds", "5", "across 4 parks"],
  ];

  return (
    <div className="cs-screen">
      <Nav onNav={onNav} signedIn={true} current="dashboard"/>

      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "32px 32px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <div className="cs-label" style={{ marginBottom: 8 }}>Welcome back, Jordan</div>
            <h1 style={{ fontSize: 40 }}>Your watchlist</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="cs-btn cs-btn--ghost" onClick={onTrigger}>
              <Icon name="sparkles" size={14}/> Simulate a hit
            </button>
            <button className="cs-btn" onClick={() => onNav("search")}>
              <Icon name="plus" size={14}/> New alert
            </button>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}>
          {stats.map(([k, v, sub]) => (
            <div key={k} className="cs-card" style={{ padding: 20 }}>
              <div className="cs-label" style={{ marginBottom: 10 }}>{k}</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 500, lineHeight: 1 }}>{v}</div>
                <span className="cs-muted cs-mono" style={{ fontSize: 11 }}>{sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 28 }}>
          {/* Alerts table */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <h2 style={{ fontSize: 22 }}>Active alerts</h2>
              <div style={{ display: "flex", gap: 14, fontSize: 12.5 }}>
                <a style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)", paddingBottom: 2 }}>All · 4</a>
                <a className="cs-muted">Monitoring · 2</a>
                <a className="cs-muted">Paused · 1</a>
              </div>
            </div>

            <div className="cs-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1fr 110px",
                padding: "12px 18px",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface-2)",
              }}>
                {["Alert", "Dates", "Status", "Hits"].map(h => (
                  <div key={h} className="cs-label">{h}</div>
                ))}
              </div>
              {data.alerts.map((a, i) => (
                <button key={a.id} onClick={() => setActive(a.id)}
                  style={{
                    display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1fr 110px",
                    padding: "16px 18px",
                    width: "100%",
                    textAlign: "left",
                    background: active === a.id ? "var(--surface-2)" : "transparent",
                    border: "none",
                    borderBottom: i < data.alerts.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                    alignItems: "center",
                  }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.campground}</div>
                    <div className="cs-muted" style={{ fontSize: 11.5 }}>{a.park} · sites: {a.sites}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13 }}>{a.dates}</div>
                    <div className="cs-muted cs-mono" style={{ fontSize: 11 }}>{a.nights}n · {a.flexibility}</div>
                  </div>
                  <div>
                    {a.status === "found" && (
                      <span className="cs-pill cs-pill--success"><span className="cs-dot"/> Hit pending</span>
                    )}
                    {a.status === "monitoring" && (
                      <span className="cs-pill"><span className="cs-dot" style={{ background: "var(--success)" }}/> Monitoring</span>
                    )}
                    {a.status === "paused" && (
                      <span className="cs-pill cs-pill--muted"><Icon name="pause" size={9}/> Paused</span>
                    )}
                    <div className="cs-muted cs-mono" style={{ fontSize: 10.5, marginTop: 4 }}>Last check {a.lastCheck}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{a.hits}</span>
                    <Icon name="chevron" size={14}/>
                  </div>
                </button>
              ))}
            </div>

            {/* History */}
            <div style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 22, marginBottom: 12 }}>Recent activity</h2>
              <div className="cs-card" style={{ padding: 0 }}>
                {data.history.map((h, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "150px 1fr 130px",
                    padding: "12px 18px",
                    borderBottom: i < data.history.length - 1 ? "1px solid var(--border)" : "none",
                    alignItems: "center",
                  }}>
                    <div className="cs-mono cs-muted" style={{ fontSize: 11.5 }}>{h.when}</div>
                    <div style={{ fontSize: 13 }}>{h.text}</div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`cs-pill ${h.action === "Notified" ? "cs-pill--accent" : ""}`}
                        style={{ fontSize: 10.5 }}>
                        {h.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <DashboardSidebar alertId={active} onNav={onNav}/>
        </div>
      </div>

      <Toast open={toastOpen} onDismiss={onDismiss} onView={() => { onDismiss(); onNav("email"); }}/>
    </div>
  );
}

function DashboardSidebar({ alertId, onNav }) {
  const data = window.CS_DATA;
  const a = data.alerts.find(x => x.id === alertId) || data.alerts[0];
  const c = data.campgrounds.find(x => x.name === a.campground);
  const polls = [4, 7, 3, 9, 11, 6, 5, 8, 13, 9, 7, 11, 14, 8, 6];

  return (
    <div className="cs-card" style={{ padding: 22, position: "sticky", top: 32, alignSelf: "start" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="cs-label" style={{ marginBottom: 6 }}>{a.park}</div>
          <h3 style={{ fontSize: 22 }}>{a.campground}</h3>
        </div>
        <button className="cs-btn cs-btn--quiet cs-btn--sm">
          <Icon name="settings" size={14}/>
        </button>
      </div>
      {c && <Photo label={c.id} height={140} style={{ marginBottom: 16 }}/>}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {a.status === "found" && <span className="cs-pill cs-pill--success"><span className="cs-dot"/> {a.hits} hits this week</span>}
        {a.status === "monitoring" && <span className="cs-pill"><span className="cs-dot" style={{ background: "var(--success)" }}/> Monitoring</span>}
        {a.status === "paused" && <span className="cs-pill cs-pill--muted"><Icon name="pause" size={9}/> Paused</span>}
        <span className="cs-pill cs-pill--muted">{a.frequency}</span>
      </div>

      <div style={{ display: "grid", gap: 10, fontSize: 13, marginBottom: 18 }}>
        {[
          ["Dates", a.dates],
          ["Flexibility", a.flexibility],
          ["Watching", a.sites],
          ["Created", a.created],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="cs-muted">{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="cs-label" style={{ marginBottom: 8 }}>Poll activity · 24h</div>
      <Sparkline data={polls}/>
      <div className="cs-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>
        <span>1,440 checks</span>
        <span>2 hits</span>
      </div>

      <hr className="cs-divider" style={{ margin: "18px 0" }}/>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="cs-btn cs-btn--ghost cs-btn--sm" style={{ flex: 1 }}>
          <Icon name={a.status === "paused" ? "play" : "pause"} size={12}/>
          {a.status === "paused" ? "Resume" : "Pause"}
        </button>
        <button className="cs-btn cs-btn--ghost cs-btn--sm" style={{ flex: 1 }}>Edit</button>
      </div>
    </div>
  );
}

// =========================================================== EMAIL MOCK
function EmailScreen({ onNav }) {
  return (
    <div className="cs-screen" style={{ background: "var(--bg-2)" }}>
      <Nav onNav={onNav} signedIn={true} current="alerts"/>
      <div style={{ padding: "40px 32px 64px", flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: "var(--muted)", fontSize: 12.5 }}>
            <a onClick={() => onNav("dashboard")} style={{ cursor: "pointer" }}>Dashboard</a>
            <Icon name="chevron" size={12}/>
            <span style={{ color: "var(--ink)" }}>Notification preview</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 32 }}>
            <div>
              <h2 style={{ fontSize: 26, marginBottom: 10 }}>Notification preview</h2>
              <p className="cs-muted" style={{ fontSize: 13.5, marginBottom: 24 }}>
                This is what hits your inbox the second a match opens. Optimized for tap-to-book on mobile.
              </p>
              <div className="cs-card" style={{ padding: 18 }}>
                <div className="cs-label" style={{ marginBottom: 10 }}>Email metadata</div>
                <div style={{ display: "grid", gap: 8, fontSize: 12.5 }}>
                  {[
                    ["From", "alerts@campsearch.app"],
                    ["Subject", "🏕 Site found — Upper Pines #14"],
                    ["Sent", "Today, 8:14 AM PT"],
                    ["Delivery time", "0.42s after match"],
                    ["Open rate (you)", "94% within 5m"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span className="cs-muted">{k}</span>
                      <span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 17, marginBottom: 10 }}>Why so fast matters</h4>
                <p className="cs-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Median cancellation at Upper Pines is rebooked within <strong style={{ color: "var(--accent)" }}>2 minutes 14 seconds</strong>. Our email + SMS dual-fires within 600ms of a match.
                </p>
              </div>
            </div>

            {/* Email body */}
            <div className="cs-email">
              {/* preview header */}
              <div style={{ padding: "10px 16px", background: "#f4f4f4", color: "#666", fontSize: 11, borderBottom: "1px solid #e5e5e5" }}>
                CampSearch &nbsp;·&nbsp; alerts@campsearch.app &nbsp;·&nbsp; to jordan@example.com
              </div>
              <div style={{ padding: "32px 36px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 6, background: "#2D4A36", color: "#FBF6EA",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                  }}>🌲</span>
                  <strong style={{ fontSize: 14, color: "#2D4A36" }}>CampSearch</strong>
                </div>
                <div style={{
                  fontFamily: "Georgia, serif", fontSize: 28,
                  fontWeight: 500, color: "#1a1a1a", marginBottom: 12, lineHeight: 1.2,
                }}>
                  Site found —<br/>Upper Pines #14
                </div>
                <p style={{ color: "#444", lineHeight: 1.55, marginBottom: 24, fontSize: 14 }}>
                  Jordan, a campsite matching your alert just opened up. It's available right now on Recreation.gov. These don't last — most go in under 3 minutes.
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
                  <tbody>
                    {[
                      ["Campground", "Upper Pines"],
                      ["Park", "Yosemite National Park"],
                      ["Site", "14 · Tent · sleeps 6"],
                      ["Dates", "Sat Jul 18 → Mon Jul 20, 2026 · 2 nights"],
                      ["Total", "$72.00"],
                      ["Opened", "8:14:02 AM PT · 0.4s ago"],
                    ].map(([k, v], i) => (
                      <tr key={k} style={{ borderTop: i === 0 ? "1px solid #eee" : "none", borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px 0", color: "#888", width: 130, fontSize: 12 }}>{k}</td>
                        <td style={{ padding: "10px 0", color: "#1a1a1a", fontWeight: 500 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <a style={{
                  display: "inline-block",
                  padding: "14px 22px",
                  background: "#2D4A36",
                  color: "#FBF6EA",
                  fontWeight: 600,
                  borderRadius: 6,
                  textDecoration: "none",
                  marginBottom: 14,
                  fontSize: 14,
                }}>Book now on Recreation.gov →</a>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Tip: have your Recreation.gov login handy. Sites at Upper Pines are usually claimed within 2–3 minutes of opening.
                </div>
                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "28px 0" }}/>
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
                  You're receiving this because alert "Upper Pines · Jul 18–20" matched. <br/>
                  <a style={{ color: "#2D4A36" }}>Pause this alert</a> · <a style={{ color: "#2D4A36" }}>Unsubscribe</a> · <a style={{ color: "#2D4A36" }}>Manage alerts</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================== ACCOUNT
function AccountScreen({ onNav }) {
  const [tab, setTab] = useState("profile");
  return (
    <div className="cs-screen">
      <Nav onNav={onNav} signedIn={true} current="account"/>
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "32px 32px 64px" }}>
        <h1 style={{ fontSize: 38, marginBottom: 8 }}>Account & preferences</h1>
        <p className="cs-muted" style={{ marginBottom: 28 }}>Manage your alerts, notifications, and billing.</p>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 40 }}>
          <div style={{ display: "grid", gap: 4, alignContent: "start" }}>
            {[
              ["profile", "Profile", "user"],
              ["notifications", "Notifications", "bell"],
              ["plan", "Plan & billing", "bolt"],
              ["alerts", "Alert defaults", "settings"],
            ].map(([k, l, ic]) => (
              <button key={k} onClick={() => setTab(k)}
                className="cs-btn cs-btn--quiet"
                style={{
                  justifyContent: "flex-start",
                  background: tab === k ? "var(--surface-2)" : "transparent",
                  color: tab === k ? "var(--ink)" : "var(--ink-2)",
                  fontWeight: tab === k ? 600 : 400,
                  padding: "10px 14px",
                }}>
                <Icon name={ic} size={14}/> {l}
              </button>
            ))}
          </div>

          <div>
            {tab === "profile" && (
              <div className="cs-card" style={{ padding: 26 }}>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>Profile</h3>
                <p className="cs-muted" style={{ fontSize: 13, marginBottom: 24 }}>Update your name, email, and password.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <Field label="Full name" defaultValue="Jordan Diaz"/>
                  <Field label="Email" defaultValue="jordan@example.com"/>
                  <Field label="Phone" defaultValue="(415) 555-0142"/>
                  <Field label="Time zone" defaultValue="Pacific (UTC-08)"/>
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
                    ["Email", "jordan@example.com", true, "Always"],
                    ["SMS", "(415) 555-0142", true, "Hits only"],
                    ["Push (iOS)", "Not installed", false, "—"],
                    ["Quiet hours", "11:00 PM – 6:30 AM", true, "SMS only"],
                  ].map(([t, sub, on, scope]) => (
                    <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t}</div>
                        <div className="cs-muted" style={{ fontSize: 12 }}>{sub} · {scope}</div>
                      </div>
                      <Switch on={on} onChange={() => {}}/>
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
                    <div key={n} className="cs-card" style={{
                      padding: 18,
                      background: hl ? "var(--primary)" : "var(--surface)",
                      color: hl ? "var(--primary-ink)" : "var(--ink)",
                      borderColor: hl ? "transparent" : "var(--border)",
                    }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>{n}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, margin: "8px 0 14px" }}>{p}</div>
                      <div style={{ fontSize: 12.5, opacity: hl ? 0.85 : 0.65, marginBottom: 6 }}>{a1}</div>
                      <div style={{ fontSize: 12.5, opacity: hl ? 0.85 : 0.65, marginBottom: 16 }}>{a2}</div>
                      <button className={`cs-btn cs-btn--sm ${hl ? "" : "cs-btn--ghost"}`} style={{ width: "100%" }}>
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
                  <Field label="Default party size" defaultValue="2 adults"/>
                  <Field label="Default flexibility" defaultValue="± 3 days"/>
                  <Field label="Default polling" defaultValue="Every 60s"/>
                  <Field label="Default channels" defaultValue="Email + SMS"/>
                </div>
                <hr className="cs-divider" style={{ margin: "20px 0" }}/>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, marginBottom: 10 }}>Region focus</h4>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Central Sierra", "Big Sur", "North Coast", "Bay Area", "Mojave"].map(r => (
                    <span key={r} className="cs-pill" style={{
                      padding: "6px 12px",
                      background: ["Central Sierra", "Big Sur"].includes(r) ? "var(--primary)" : "var(--surface-2)",
                      color: ["Central Sierra", "Big Sur"].includes(r) ? "var(--primary-ink)" : "var(--ink-2)",
                      borderColor: "transparent",
                    }}>{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }) {
  return (
    <div>
      <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>{label}</label>
      <input className="cs-input" defaultValue={defaultValue}/>
    </div>
  );
}

Object.assign(window, { CreateAlertScreen, DashboardScreen, EmailScreen, AccountScreen });
