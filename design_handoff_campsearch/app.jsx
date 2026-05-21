// CampSearch — Prototype root

function Prototype({ theme = "topo", initialScreen = "landing" }) {
  const [screen, setScreen] = useState(initialScreen);
  const [campgroundId, setCampgroundId] = useState("upper-pines");
  const [toast, setToast] = useState(false);

  // Auto-trigger toast a few seconds after landing on dashboard
  useEffect(() => {
    if (screen === "dashboard") {
      const t = setTimeout(() => setToast(true), 1800);
      return () => clearTimeout(t);
    }
    setToast(false);
  }, [screen]);

  const nav = next => setScreen(next);
  const openCampground = id => { setCampgroundId(id); setScreen("detail"); };

  return (
    <div className="cs-root" data-theme={theme}>
      {screen === "landing" && <LandingScreen onNav={nav} theme={theme}/>}
      {screen === "signup" && <SignupScreen onNav={nav}/>}
      {screen === "search" && <SearchScreen onNav={nav} onSelectCampground={openCampground}/>}
      {screen === "detail" && <DetailScreen onNav={nav} campgroundId={campgroundId} onCreateAlert={() => setScreen("alert")}/>}
      {screen === "alert" && <CreateAlertScreen onNav={nav} campgroundId={campgroundId}/>}
      {screen === "dashboard" && (
        <DashboardScreen
          onNav={nav}
          onTrigger={() => setToast(true)}
          toastOpen={toast}
          onDismiss={() => setToast(false)}
        />
      )}
      {screen === "email" && <EmailScreen onNav={nav}/>}
      {screen === "account" && <AccountScreen onNav={nav}/>}

      {/* Screen jumper — fixed bottom-right */}
      <ScreenJumper screen={screen} onJump={nav} theme={theme}/>
    </div>
  );
}

function ScreenJumper({ screen, onJump, theme }) {
  const [open, setOpen] = useState(false);
  const screens = [
    ["landing", "Landing"],
    ["signup", "Sign up"],
    ["search", "Search"],
    ["detail", "Campground"],
    ["alert", "Create alert"],
    ["dashboard", "Dashboard"],
    ["email", "Notification email"],
    ["account", "Account"],
  ];
  const idx = screens.findIndex(s => s[0] === screen);
  const themeLabel = theme === "topo" ? "Topo Trail" : theme === "ranger" ? "Ranger Station" : "Field Notes";
  return (
    <div style={{
      position: "absolute",
      left: 16, bottom: 16,
      zIndex: 60,
      fontFamily: "var(--font-body)",
    }}>
      {open && (
        <div className="cs-card" style={{
          padding: 8,
          marginBottom: 8,
          minWidth: 220,
          background: "var(--surface)",
          boxShadow: "0 12px 30px -10px rgba(0,0,0,0.2)",
        }}>
          <div className="cs-label" style={{ padding: "6px 10px 8px" }}>{themeLabel} · jump to screen</div>
          {screens.map(([k, l], i) => (
            <button key={k} onClick={() => { onJump(k); setOpen(false); }}
              className="cs-btn cs-btn--quiet"
              style={{
                width: "100%", justifyContent: "flex-start",
                padding: "8px 10px", fontSize: 13,
                background: screen === k ? "var(--surface-2)" : "transparent",
                color: screen === k ? "var(--ink)" : "var(--ink-2)",
                fontWeight: screen === k ? 600 : 400,
              }}>
              <span className="cs-mono cs-muted" style={{ fontSize: 10, marginRight: 8, width: 18 }}>0{i+1}</span>
              {l}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} className="cs-btn cs-btn--ghost cs-btn--sm" style={{
        background: "var(--surface)",
        boxShadow: "0 4px 14px -4px rgba(0,0,0,0.15)",
      }}>
        <Icon name="list" size={13}/>
        <span className="cs-mono" style={{ fontSize: 11 }}>0{Math.max(idx, 0)+1}</span>
        {screens[idx]?.[1] || "Screen"}
        <Icon name={open ? "chevronDown" : "chevron"} size={12} style={{ transform: open ? "rotate(180deg)" : "none" }}/>
      </button>
    </div>
  );
}

Object.assign(window, { Prototype });
