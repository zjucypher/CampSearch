// Shared components for CampSearch prototype
const { useState, useEffect, useRef, useMemo } = React;

// -------------------------------------------------------------- Icon set
// Lucide-style stroke icons, kept minimal.
function Icon({ name, size = 16, stroke = 1.6, style }) {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: stroke,
    strokeLinecap: "round", strokeLinejoin: "round",
    style,
  };
  const P = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></>,
    pin: <><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    check: <><path d="m5 12 5 5L20 7"/></>,
    chevron: <><path d="m9 6 6 6-6 6"/></>,
    chevronDown: <><path d="m6 9 6 6 6-6"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    phone: <><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M12 18h.01"/></>,
    tent: <><path d="M3 20h18L12 4Z"/><path d="M12 4v16M8 20l4-5 4 5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.4 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .4-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.4h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.4 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    sliders: <><path d="M4 21V14M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></>,
    play: <><path d="M6 4v16l14-8Z"/></>,
    pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
    flame: <><path d="M12 22a6 6 0 0 0 6-6c0-4-4-7-3-12-2 1-7 5-7 11a3 3 0 0 0 4 3"/></>,
    sparkles: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></>,
    x: <><path d="m6 6 12 12M18 6 6 18"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></>,
    moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></>,
    bolt: <><path d="M13 2 4 14h7l-1 8 9-12h-7Z"/></>,
    tree: <><path d="M12 2 6 12h3l-3 5h4v5h4v-5h4l-3-5h3Z"/></>,
  };
  return <svg {...props}>{P[name] || null}</svg>;
}

// -------------------------------------------------------------- Logo
function Logo({ size = "md" }) {
  const px = size === "sm" ? 16 : size === "lg" ? 22 : 19;
  return (
    <div className="cs-logo" style={{ fontSize: px }}>
      <span className="cs-logo-mark" style={{ width: px + 9, height: px + 9 }}>
        <Icon name="tree" size={px * 0.7} stroke={1.8} />
      </span>
      <span>CampSearch</span>
    </div>
  );
}

// -------------------------------------------------------------- Topo background
// Repeating contour SVG for theme A (Topo) and as accent in C (Field)
function TopoBg({ opacity = 0.35, color }) {
  // a chunk of concentric organic contours, tiled
  const stroke = color || "currentColor";
  return (
    <svg className="cs-topo-bg" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 800 600" style={{ opacity, color: stroke }}>
      <defs>
        <pattern id="topo" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M -20 240 Q 80 200 160 240 T 320 230 T 440 250"/>
            <path d="M -20 220 Q 80 170 160 215 T 320 200 T 440 230"/>
            <path d="M -20 200 Q 80 140 160 190 T 320 175 T 440 215"/>
            <path d="M -20 180 Q 80 115 160 165 T 320 150 T 440 200"/>
            <path d="M -20 160 Q 80 90 160 140 T 320 130 T 440 185"/>
            <path d="M -20 140 Q 80 70 160 120 T 320 110 T 440 170"/>
            <path d="M -20 120 Q 80 55 160 100 T 320 95 T 440 158"/>
            <path d="M -20 100 Q 80 45 160 85 T 320 82 T 440 145"/>
            <path d="M -20 80 Q 80 38 160 70 T 320 70 T 440 130"/>
            <path d="M -20 60 Q 80 32 160 55 T 320 60 T 440 115"/>
            <path d="M -20 280 Q 80 250 160 285 T 320 280 T 440 290"/>
            <path d="M -20 310 Q 80 295 160 320 T 320 320 T 440 325"/>
            <path d="M -20 340 Q 80 340 160 355 T 320 360 T 440 360"/>
            <path d="M -20 380 Q 80 390 160 395 T 320 400 T 440 400"/>
          </g>
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#topo)"/>
    </svg>
  );
}

// -------------------------------------------------------------- Map placeholder
function MapPlaceholder({ campgrounds, activeId, onSelect, height = 420 }) {
  return (
    <div className="cs-map" style={{ height }}>
      <TopoBg opacity={0.5} color="var(--border-strong)" />
      {/* Lake */}
      <div style={{
        position: "absolute", left: "32%", top: "44%",
        width: 110, height: 70,
        background: "color-mix(in oklch, var(--primary) 12%, var(--bg-2))",
        borderRadius: "60% 50% 70% 50%",
        border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
      }} />
      {/* Coastline shading hint */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "10%",
        background: "linear-gradient(to right, color-mix(in oklch, var(--primary) 8%, transparent), transparent)",
      }} />
      {/* "CALIFORNIA" stamp */}
      <div style={{
        position: "absolute", right: 16, bottom: 14,
        fontFamily: "var(--font-mono)", fontSize: 10,
        letterSpacing: "0.18em", color: "var(--muted)",
        textTransform: "uppercase",
      }}>California · scale ≈ 1:4.2M</div>

      {campgrounds.map(c => (
        <button key={c.id}
          onClick={() => onSelect && onSelect(c.id)}
          className={`cs-pin ${activeId === c.id ? "cs-pin--active" : ""}`}
          style={{ left: `${c.coords.x}%`, top: `${c.coords.y}%`, border: "none", padding: 0 }}
          title={c.name}
        >
          <span>
            <Icon name="tent" size={12} stroke={2} />
          </span>
        </button>
      ))}
    </div>
  );
}

// -------------------------------------------------------------- Photo
function Photo({ label, height = 200, style }) {
  return (
    <div className="cs-photo" style={{ height, ...style }}>
      <span>{label || "photo"}</span>
    </div>
  );
}

// -------------------------------------------------------------- Nav
function Nav({ current, onNav, signedIn }) {
  const links = signedIn
    ? [["dashboard", "Dashboard"], ["search", "Search"], ["alerts", "Alerts"], ["account", "Account"]]
    : [["features", "Features"], ["parks", "Parks"], ["pricing", "Pricing"]];
  return (
    <nav className="cs-nav">
      <button onClick={() => onNav(signedIn ? "dashboard" : "landing")}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <Logo />
      </button>
      <div className="cs-nav-links">
        {links.map(([k, l]) => (
          <a key={k}
            className={current === k ? "active" : ""}
            onClick={() => {
              if (k === "dashboard") onNav("dashboard");
              else if (k === "search") onNav("search");
              else if (k === "alerts") onNav("dashboard");
              else if (k === "account") onNav("account");
            }}
            style={{ cursor: "pointer" }}
          >{l}</a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {signedIn ? (
          <>
            <button className="cs-btn cs-btn--quiet cs-btn--sm">
              <Icon name="bell" size={15}/>
            </button>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--accent)", color: "var(--bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600,
            }}>JD</div>
          </>
        ) : (
          <>
            <button className="cs-btn cs-btn--quiet cs-btn--sm" onClick={() => onNav("signup")}>Sign in</button>
            <button className="cs-btn cs-btn--sm" onClick={() => onNav("signup")}>Get started</button>
          </>
        )}
      </div>
    </nav>
  );
}

// -------------------------------------------------------------- Page wrapper
function Page({ children, fullBleed }) {
  return (
    <div style={{
      maxWidth: fullBleed ? "none" : 1180,
      padding: fullBleed ? 0 : "32px 32px 64px",
      margin: "0 auto",
      width: "100%",
      flex: 1,
    }}>{children}</div>
  );
}

// -------------------------------------------------------------- Sparkline
function Sparkline({ data, color = "var(--accent)" }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${32 - (v / max) * 28}`).join(" ");
  return (
    <svg className="cs-spark" viewBox="0 0 100 32" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

// -------------------------------------------------------------- Switch
function Switch({ on, onChange }) {
  return (
    <span className={`cs-switch ${on ? "cs-switch--on" : ""}`}
      onClick={() => onChange(!on)} />
  );
}

// -------------------------------------------------------------- Calendar
function Calendar({ cal }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button className="cs-btn cs-btn--quiet cs-btn--sm" style={{ padding: "4px 8px" }}>
          <Icon name="chevron" size={14} style={{ transform: "rotate(180deg)" }}/>
        </button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500 }}>{cal.month}</div>
        <button className="cs-btn cs-btn--quiet cs-btn--sm" style={{ padding: "4px 8px" }}>
          <Icon name="chevron" size={14}/>
        </button>
      </div>
      <div className="cs-cal">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="cs-cal-h">{d}</div>)}
        {cal.days.map((d, i) => {
          let cls = "cs-cal-d";
          if (d.out) cls += " cs-cal-d--out";
          if (d.range === "start") cls += " cs-cal-d--start";
          if (d.range === "end") cls += " cs-cal-d--end";
          if (d.range === "mid") cls += " cs-cal-d--mid";
          if (d.avail && !d.range) cls += " cs-cal-d--avail";
          return <div key={i} className={cls}>{d.d}</div>;
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------- Toast
function Toast({ open, onDismiss, onView }) {
  if (!open) return null;
  return (
    <div className="cs-toast">
      <div className="cs-toast-icon"><Icon name="bell" size={18} stroke={2.2}/></div>
      <div className="cs-toast-body">
        <div className="cs-toast-title">Upper Pines · Site 14 just opened</div>
        <div className="cs-toast-sub">Jul 18 – 20, 2026 · matches your alert · book within minutes</div>
      </div>
      <button className="cs-toast-cta" onClick={onView}>Book →</button>
      <button onClick={onDismiss} style={{
        background: "transparent", border: "none", color: "currentColor",
        opacity: 0.5, cursor: "pointer",
      }}><Icon name="x" size={16}/></button>
    </div>
  );
}

// -------------------------------------------------------------- Section header
function SectionHead({ eyebrow, title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 32 }}>
      <div>
        {eyebrow && <div className="cs-label" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h2 style={{ fontSize: 28, marginBottom: sub ? 6 : 0 }}>{title}</h2>
        {sub && <div className="cs-muted" style={{ maxWidth: 540 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// Export
Object.assign(window, {
  Icon, Logo, TopoBg, MapPlaceholder, Photo, Nav, Page,
  Sparkline, Switch, Calendar, Toast, SectionHead,
});
