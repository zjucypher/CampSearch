// CampSearch — Search list+map, Campground detail

function SearchScreen({ onNav, onSelectCampground }) {
  const data = window.CS_DATA;
  const [active, setActive] = useState(data.campgrounds[0].id);
  const [view, setView] = useState("split"); // split | list | map
  const [q, setQ] = useState("");
  const filtered = data.campgrounds.filter(c =>
    !q || (c.name + c.park + c.region).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="cs-screen">
      <Nav onNav={onNav} signedIn={true} current="search"/>

      {/* Filter bar */}
      <div style={{
        padding: "16px 32px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
          <Icon name="search" size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }}/>
          <input
            className="cs-input"
            placeholder="Search by park, campground, or region…"
            style={{ paddingLeft: 36 }}
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        {[
          ["Region", "California"],
          ["Site type", "Tent or RV"],
          ["Dates", "Jul 18 — Jul 20"],
          ["Party", "2 adults"],
        ].map(([lbl, val]) => (
          <button key={lbl} className="cs-btn cs-btn--ghost cs-btn--sm">
            <span className="cs-muted" style={{ marginRight: 6 }}>{lbl}:</span>
            <span>{val}</span>
            <Icon name="chevronDown" size={12}/>
          </button>
        ))}
        <button className="cs-btn cs-btn--ghost cs-btn--sm">
          <Icon name="sliders" size={14}/> More
        </button>
        <div style={{ width: 1, height: 24, background: "var(--border)" }}/>
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {[["list", "list"], ["split", "grid"], ["map", "map"]].map(([v, ic]) => (
            <button key={v}
              onClick={() => setView(v)}
              className="cs-btn cs-btn--quiet"
              style={{
                padding: "6px 10px", borderRadius: 0,
                background: view === v ? "var(--surface-2)" : "transparent",
                color: view === v ? "var(--ink)" : "var(--muted)",
              }}>
              <Icon name={ic} size={14}/>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: view === "split" ? "1fr 1.1fr" : view === "list" ? "1fr" : "0 1fr",
        overflow: "hidden",
      }}>
        {/* List */}
        {view !== "map" && (
          <div style={{ overflow: "auto", borderRight: view === "split" ? "1px solid var(--border)" : "none" }}>
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>
                  {filtered.length} campgrounds
                </div>
                <div className="cs-muted" style={{ fontSize: 12.5 }}>
                  Sorted by cancellation rate · last 30 days
                </div>
              </div>
              <button className="cs-btn cs-btn--quiet cs-btn--sm">
                Sort: Cancellation rate <Icon name="chevronDown" size={12}/>
              </button>
            </div>
            <div style={{ display: "grid", gap: 12, padding: "0 28px 28px" }}>
              {filtered.map(c => (
                <button key={c.id}
                  onClick={() => { setActive(c.id); }}
                  className="cs-card"
                  style={{
                    padding: 0, textAlign: "left", cursor: "pointer",
                    display: "grid", gridTemplateColumns: "140px 1fr",
                    gap: 16,
                    background: active === c.id ? "var(--surface-2)" : "var(--surface)",
                    outline: active === c.id ? "2px solid var(--primary)" : "none",
                    outlineOffset: -2,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}>
                  <Photo label={c.id} height="100%" style={{ borderRadius: 0, border: "none" }}/>
                  <div style={{ padding: "14px 16px 14px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>{c.name}</div>
                      <span className="cs-pill cs-pill--accent" style={{ fontSize: 10.5 }}>
                        <Icon name="flame" size={10} stroke={2.2}/> {c.cancellations}/mo
                      </span>
                    </div>
                    <div className="cs-muted" style={{ fontSize: 12.5, marginBottom: 8 }}>
                      {c.park} · {c.region}
                    </div>
                    <div className="cs-muted" style={{ fontSize: 12.5, marginBottom: 10, lineHeight: 1.45 }}>
                      {c.desc}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {c.tags.map(t => <span key={t} className="cs-pill" style={{ fontSize: 10.5 }}>{t}</span>)}
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
          <div style={{ padding: 28, position: "relative", overflow: "auto" }}>
            <MapPlaceholder
              campgrounds={filtered}
              activeId={active}
              onSelect={setActive}
              height={460}
            />
            {(() => {
              const c = filtered.find(x => x.id === active) || filtered[0];
              if (!c) return null;
              return (
                <div className="cs-card" style={{ marginTop: 18, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div className="cs-label" style={{ marginBottom: 6 }}>{c.park}</div>
                      <h3 style={{ fontSize: 24 }}>{c.name}</h3>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="cs-btn cs-btn--ghost cs-btn--sm">
                        <Icon name="bell" size={13}/> Watch
                      </button>
                      <button className="cs-btn cs-btn--sm" onClick={() => onSelectCampground(c.id)}>
                        Open · Pick sites <Icon name="arrow" size={13}/>
                      </button>
                    </div>
                  </div>
                  <p className="cs-muted" style={{ fontSize: 13.5, marginBottom: 16, maxWidth: 540 }}>{c.desc}</p>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 18,
                    padding: "16px 0 0",
                    borderTop: "1px solid var(--border)",
                  }}>
                    {[
                      ["Sites", c.sites],
                      ["Elevation", c.elevation],
                      ["Cancellations / mo", c.cancellations],
                      ["Region", c.region],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="cs-label" style={{ marginBottom: 4 }}>{k}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailScreen({ onNav, campgroundId, onCreateAlert }) {
  const data = window.CS_DATA;
  const c = data.campgrounds.find(x => x.id === campgroundId) || data.campgrounds[0];
  const [selected, setSelected] = useState([14, 15, 22]);
  const [tab, setTab] = useState("sites");

  const toggle = n => setSelected(s => s.includes(n) ? s.filter(x => x !== n) : [...s, n]);

  return (
    <div className="cs-screen">
      <Nav onNav={onNav} signedIn={true} current="search"/>

      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 32px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0", color: "var(--muted)", fontSize: 12.5 }}>
          <a onClick={() => onNav("search")} style={{ cursor: "pointer" }}>Search</a>
          <Icon name="chevron" size={12}/>
          <span>{c.park}</span>
          <Icon name="chevron" size={12}/>
          <span style={{ color: "var(--ink)" }}>{c.name}</span>
        </div>

        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, marginBottom: 28 }}>
          <Photo label={`${c.id} · hero`} height={300}/>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 10 }}>
            <Photo label="site cluster" height="100%"/>
            <Photo label="trail access" height="100%"/>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <div className="cs-label" style={{ marginBottom: 8 }}>{c.park} · {c.region}</div>
            <h1 style={{ fontSize: 44, marginBottom: 12 }}>{c.name}</h1>
            <p className="cs-muted" style={{ maxWidth: 580, fontSize: 14.5 }}>{c.desc}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="cs-btn cs-btn--ghost">
              <Icon name="bell" size={14}/> Watch campground
            </button>
            <button className="cs-btn" onClick={onCreateAlert} disabled={selected.length === 0}>
              <Icon name="plus" size={14}/> Alert me on {selected.length} site{selected.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="cs-card" style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          padding: 0, marginBottom: 28, overflow: "hidden",
        }}>
          {[
            ["Sites", c.sites, null],
            ["Elevation", c.elevation, null],
            ["Cancellations / mo", c.cancellations, [3,5,2,4,6,8,5,7,9,11,8,12,9]],
            ["Avg. lead time", "21 days", null],
            ["Booking opens", "5 mo ahead", null],
          ].map(([k, v, spark], i) => (
            <div key={k} style={{
              padding: "16px 18px",
              borderLeft: i === 0 ? "none" : "1px solid var(--border)",
            }}>
              <div className="cs-label" style={{ marginBottom: 6 }}>{k}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{v}</div>
              {spark && <div style={{ marginTop: 6 }}><Sparkline data={spark}/></div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
          {[
            ["sites", "Pick sites"],
            ["availability", "Availability"],
            ["info", "About"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="cs-btn cs-btn--quiet"
              style={{
                borderRadius: 0,
                borderBottom: tab === k ? "2px solid var(--ink)" : "2px solid transparent",
                color: tab === k ? "var(--ink)" : "var(--muted)",
                padding: "10px 14px",
              }}>{l}</button>
          ))}
        </div>

        {tab === "sites" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32, paddingBottom: 48 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <h3 style={{ fontSize: 20 }}>Site map</h3>
                <div style={{ display: "flex", gap: 14, fontSize: 11.5 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span className="cs-dot" style={{ background: "var(--success)" }}/> Available
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span className="cs-dot" style={{ background: "var(--accent)" }}/> Watched
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span className="cs-dot" style={{ background: "var(--ink)" }}/> Selected
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span className="cs-dot" style={{ background: "var(--border-strong)" }}/> Taken
                  </span>
                </div>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(8, 1fr)",
                gap: 8,
                padding: 20,
                background: "var(--bg-2)",
                borderRadius: "var(--radius-lg)",
                position: "relative",
                overflow: "hidden",
              }}>
                <TopoBg opacity={0.18} color="var(--ink-2)"/>
                {data.sites.map(s => {
                  const sel = selected.includes(s.num);
                  let cls = "cs-spot";
                  if (sel) cls += " cs-spot--selected";
                  else if (s.status === "available") cls += " cs-spot--available";
                  else if (s.status === "watched") cls += " cs-spot--watched";
                  else cls += " cs-spot--taken";
                  return (
                    <div key={s.num} className={cls}
                      onClick={() => s.status !== "taken" && toggle(s.num)}
                      style={{ position: "relative" }}>
                      <span>{s.num}</span>
                      <span className="lbl">{s.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Selection</h3>
              <div className="cs-card" style={{ padding: 18 }}>
                {selected.length === 0 ? (
                  <p className="cs-muted">Tap sites on the map to add them to your alert.</p>
                ) : (
                  <>
                    <div className="cs-label" style={{ marginBottom: 10 }}>{selected.length} site{selected.length !== 1 ? "s" : ""} watched</div>
                    <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                      {selected.sort((a,b) => a-b).map(n => {
                        const s = data.sites.find(x => x.num === n);
                        return (
                          <div key={n} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 10px",
                            background: "var(--surface-2)",
                            borderRadius: "var(--radius)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{
                                width: 26, height: 26, borderRadius: 6,
                                background: "var(--primary)", color: "var(--primary-ink)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 600, fontSize: 12,
                              }}>{n}</span>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 13 }}>Site {n}</div>
                                <div className="cs-muted" style={{ fontSize: 11 }}>{s.type} · 6 ppl · fire ring</div>
                              </div>
                            </div>
                            <button onClick={() => toggle(n)} style={{
                              background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer",
                            }}><Icon name="x" size={14}/></button>
                          </div>
                        );
                      })}
                    </div>
                    <button className="cs-btn" style={{ width: "100%" }} onClick={onCreateAlert}>
                      Configure alert →
                    </button>
                  </>
                )}
              </div>
              <div style={{ marginTop: 18 }}>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 10 }}>Insider tip</h4>
                <p className="cs-muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                  Sites <strong style={{ color: "var(--ink)" }}>14, 15, 22</strong> sit by the river bend.
                  They cancel 3× more than the row-12 cluster because they flood-warn during snowmelt.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "availability" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, paddingBottom: 48 }}>
            <Calendar cal={data.calendar}/>
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Cancellation timing</h3>
              <p className="cs-muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
                When sites at {c.name} have dropped in the last 30 days. Most happen 3–10 days out.
              </p>
              <div className="cs-card" style={{ padding: 18 }}>
                <Sparkline data={[2,1,3,4,2,5,7,9,11,8,12,9,7,6,4,3,5,2]}/>
                <div className="cs-mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                  <span>14 days out</span>
                  <span>arrival</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "info" && (
          <div style={{ paddingBottom: 48, maxWidth: 680 }}>
            <p style={{ fontSize: 15.5, lineHeight: 1.7, marginBottom: 16 }}>{c.desc}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {[
                ["Operator", "Recreation.gov"],
                ["Reservation window", "5 months ahead, rolling"],
                ["Check-in", "12:00 PM"],
                ["Pets", "Allowed on leash"],
                ["Cell coverage", "Spotty (Verizon best)"],
                ["Nearest store", "Yosemite Village · 4 mi"],
              ].map(([k, v]) => (
                <div key={k} style={{ paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <div className="cs-label" style={{ marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SearchScreen, DetailScreen });
