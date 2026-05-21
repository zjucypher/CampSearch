# Handoff: CampSearch — Field Notes design direction

## Overview

CampSearch is a California campsite availability monitoring platform. Users search campgrounds, configure alerts (dates, sites, party, channels), and get pinged the moment a matching site opens up.

This handoff covers the **Field Notes** visual direction — minimal, researcher-aesthetic, parchment + moss palette — across the full product flow:

1. Landing / marketing page
2. Sign up (2-step)
3. Search (map + list)
4. Campground detail (with site picker)
5. Create alert (dates, site prefs, party, channels, cadence)
6. Dashboard (active alerts, history, sidebar detail)
7. Notification email mockup
8. Account & preferences

## About the design files

The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look, layout, and behavior. They are not production code to copy directly.

Your job is to **recreate these designs in your target codebase's existing environment** (React, Next.js, SwiftUI, etc.) using its established patterns, component library, and routing. If no environment exists yet, choose the most appropriate framework and implement the designs there.

The HTML prototype is the source of truth for spacing, color, type, and interaction. Open `CampSearch Prototype.html` to navigate the full flow; use the screen-jumper in the bottom-left of the artboard to skip between screens.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, and interaction patterns are dialed in. Reproduce pixel-perfectly using your codebase's existing primitives.

Photos are stripe-textured placeholders labeled with the campground id — replace with real California campground photography.

---

## Design tokens

All tokens are defined in `styles.css` under `[data-theme="field"]`.

### Colors

| Token            | Hex       | Use                                       |
|------------------|-----------|-------------------------------------------|
| `--bg`           | `#F5F2EA` | Page background (parchment)               |
| `--bg-2`         | `#EDE9DD` | Secondary background (sections, maps)     |
| `--surface`      | `#FBFAF5` | Card / input surface                      |
| `--surface-2`    | `#F2EEE2` | Hover surface, subtle inset               |
| `--ink`          | `#1A1F1B` | Primary text                              |
| `--ink-2`        | `#3F4A3F` | Secondary text                            |
| `--muted`        | `#82887F` | Tertiary text, captions, mono labels      |
| `--primary`      | `#3A4B36` | Primary CTA, focus, range fill (moss)     |
| `--primary-ink`  | `#FBFAF5` | Text on primary surfaces                  |
| `--primary-hover`| `#283220` | Primary button hover                      |
| `--accent`       | `#8A6E3F` | Highlights, hits, key numbers (tan)       |
| `--accent-2`     | `#5A6F45` | Secondary accent                          |
| `--border`       | `#DDD8C8` | Hairline divider                          |
| `--border-strong`| `#BFB89F` | Stronger divider, control borders         |
| `--success`      | `#4A6B3A` | "Available", "monitoring" status          |
| `--danger`       | `#9E3F2E` | Errors, destructive                       |

### Typography

| Role         | Family                                          | Notes                                |
|--------------|-------------------------------------------------|--------------------------------------|
| Display      | `Source Serif 4`, `Source Serif Pro`, Georgia   | Weight 400, tracking `-0.02em`       |
| Body         | `Inter Tight`, system sans                      | Weights 400/500/600                  |
| Mono / labels| `JetBrains Mono`, ui-monospace                  | All caps eyebrows, timestamps, IDs   |

Load via Google Fonts (already wired in the prototype `<head>`):
```html
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
```

Type sizes used:
- Hero H1: `64px`, line-height `1.02`, tracking `-0.02em`
- Page title: `38–44px`
- Section title (H2): `22–34px`
- Card title (H3): `18–22px`
- Body: `14–15px`, line-height `1.5–1.7`
- Eyebrow / mono label: `11px`, uppercase, tracking `0.08–0.14em`, weight 600
- Stat number: `22–38px` serif display

### Spacing & shape

- Border radii: `--radius: 3px`, `--radius-lg: 4px` — Field Notes leans **flatter and sharper** than the other directions.
- Card shadow: `none`. Cards rely on a `1px solid var(--border)` hairline.
- Inputs are **underline-only** in this theme — no full border, no rounded corner: `border: 0 0 1px 0; border-color: var(--border-strong); border-radius: 0`.
- Section padding: `28px 0` between numbered form groups, with a top border.
- Page horizontal padding: `32px`. Max content widths: 1080–1280px depending on screen.

### Components

All in `styles.css`:
- `.cs-btn` (variants: default, `--ghost`, `--quiet`, `--accent`, `--sm`, `--lg`)
- `.cs-input` (overridden to underline-only in field theme)
- `.cs-label` (uppercase mono eyebrow)
- `.cs-card`, `.cs-pill` (with `--success`, `--accent`, `--ink`, `--muted` variants)
- `.cs-nav`, `.cs-logo`, `.cs-logo-mark`
- `.cs-photo` (striped placeholder)
- `.cs-map`, `.cs-pin`
- `.cs-spot` (campsite grid cell: `--available`, `--watched`, `--selected`, `--taken`)
- `.cs-cal` (date range picker grid)
- `.cs-toast` (notification animation: `toast-in` 0.35s + ping pulse)
- `.cs-switch` (toggle)

---

## Screens

### 1. Landing (`LandingScreen`)

**Layout**
- Sticky nav (`.cs-nav`): logo left, `Features / Parks / Pricing` center, `Sign in / Get started` right.
- **Hero**: 2-column grid (`1.05fr 1fr`), 56px gap, padding `60px 32px 40px`. Left: eyebrow → H1 (64px) → lead paragraph → CTA row → 3 inline benefits. Right: stripe-photo placeholder (380px tall) with a "site found" notification card overlapping its bottom-right corner (`bottom: -28px; right: -16px`).
- **How it works**: 3-column card grid, large serif numerals (36px, `--accent` color) per card.
- **Features strip**: 2-column layout. Left: checklist of 5 monitored features. Right: live "last 24 hours" card with 4 recent hits and a `47 matches found` pill.
- **CTA strip**: full-width `--primary` background band.
- **Footer**: small links, version, "Made in California".

**Copy (exact)**
- Eyebrow: `"Monitoring 138 California campgrounds"`
- H1: `"Get notified the second a campsite opens up."`
- Lead: `"CampSearch watches Yosemite, Big Sur, Joshua Tree and 135 other California campgrounds and pings you the moment a site matching your criteria becomes available. Cancellations happen — be first."`
- Primary CTA: `"Start monitoring — free"`
- Secondary CTA: `"Browse campgrounds"`

### 2. Sign up (`SignupScreen`)

2-step form, 2-column layout.

**Step 1**: Full name, email, password → Continue. Below: divider with "or", "Continue with Google".
**Step 2**: Choose notification channels (email always on, SMS optional, phone field). Back / "Start your first alert".

**Right panel**: parchment background with topographic SVG, stats headline, 3 sample "caught" reservations.

### 3. Search (`SearchScreen`)

**Top filter bar**: search input (with leading icon), 4 pill-style filter buttons (Region, Site type, Dates, Party), "More" button, view-mode toggle (list / split / map).

**Body**: 2-column split view by default.
- Left: scrollable list of campground cards (`140px` photo + content). Each card has title, park · region, description, tag pills, sites count, elevation. "Cancellation rate" pill in top-right corner. Selected card has `outline: 2px solid var(--primary)`.
- Right: map placeholder with pins, plus a detail card below showing the selected campground's stats (Sites, Elevation, Cancellations/mo, Region) and Watch / Open buttons.

The map is intentionally schematic — a tinted lake shape + coastline gradient + topo SVG, with pin overlays positioned by percentage coords. In production, swap for Mapbox/MapLibre.

### 4. Campground detail (`DetailScreen`)

- Breadcrumb: Search › Park › Campground.
- Photo header: 1 large + 2 stacked smaller photos (1.4fr/1fr grid).
- Title block: eyebrow, 44px H1, 580px description, right-aligned actions (Watch / Alert me on N sites).
- **Stat strip card**: 5 evenly-divided cells (Sites, Elevation, Cancellations/mo with sparkline, Avg. lead time, Booking opens) — separators are `border-left: 1px solid var(--border)`.
- Tabs: Pick sites / Availability / About.
- **Site map** (Pick sites tab): 8×5 grid of `.cs-spot` cells with subtle topo background. State: available (success-tinted), watched (accent-tinted), selected (filled primary), taken (40% opacity, not clickable). Each spot shows site number + type label (TENT/RV).
- **Selection panel**: list of selected sites with chip + remove, plus an "Insider tip" callout.

### 5. Create alert (`CreateAlertScreen`)

4 numbered form groups (`FormGroup` component): 60px-wide mono section number + content. Sections:
1. **Dates** — Arrive / Depart inputs, flexibility (Exact / ±3 days / Any week of Jul / Weekends only).
2. **Site preferences** — radio cards: Specific sites only / Any matching filters. Below, either chip list of watched sites or 3 filter dropdowns (Site type, Min occupancy, Amenities).
3. **Party** — Adults, Kids, Vehicles inputs.
4. **Notifications** — Email / SMS / Push cards with switches, then polling cadence (4 buttons: 30s/Pro, 60s, 5m, 30m).

**Right column** (sticky at `top: 32px`): summary card with all selections as `key — value` rows separated by dashed borders, then a full-width "Start monitoring" CTA.

### 6. Dashboard (`DashboardScreen`)

- Header: eyebrow "Welcome back, Jordan", 40px H1 "Your watchlist". Right actions: "Simulate a hit" (debug trigger), "New alert".
- **Stat grid**: 4 cards (Active alerts, Hits this month, Avg. response time, Watched campgrounds), each with big serif numeral.
- **Active alerts table** (left col): card-styled list with 4-column grid (Alert / Dates / Status / Hits). Selected row tinted `--surface-2`.
- **Recent activity**: 3-column grid rows (timestamp / description / pill).
- **Sidebar** (right col, sticky): selected alert detail — title, photo, status pills, key/value list, "Poll activity · 24h" sparkline, Pause / Edit buttons.

**Toast animation**: Auto-fires 1800ms after Dashboard mount, or via the "Simulate a hit" button. Dark `--ink` background, accent-color icon with `@keyframes ping` ripple (1.6s infinite). Entry: `@keyframes toast-in` 0.35s ease-out, translateY 20px → 0. Clicking "Book →" jumps to the email screen.

### 7. Notification email (`EmailScreen`)

Mock of the actual email — fixed 600px width, white card on the page's parchment background. Uses email-safe styles (Georgia serif, table layout, inline-block button). Left column shows email metadata (From, Subject, Delivery time) and a "Why so fast matters" note.

### 8. Account (`AccountScreen`)

Sidebar nav (Profile / Notifications / Plan & billing / Alert defaults) + content area.
- **Plan**: 3-column pricing cards (Free / Pro / Ranger). Pro is highlighted with `--primary` background.
- **Alert defaults**: form + region focus chips (Central Sierra and Big Sur preselected).

---

## Interactions & behavior

### Navigation
The prototype uses a flat `screen` state (`landing | signup | search | detail | alert | dashboard | email | account`). In production, map these to routes:
- `/` → landing
- `/signup` → signup (could be `/signup/2` for step 2)
- `/search` → search
- `/campgrounds/:id` → detail
- `/campgrounds/:id/alert/new` → create alert (or `/alerts/new` with state)
- `/dashboard` → dashboard
- `/alerts/:id/preview` → email preview
- `/account/:tab` → account

### State

**Per screen**
- `SearchScreen`: `active` campground id, `view` (split/list/map), `q` search query.
- `DetailScreen`: `selected` site numbers array (multi-select toggle), `tab`.
- `CreateAlertScreen`: `flex` (date flexibility key), `siteMode` (specific/any), `channels` object, `freq` (polling cadence key).
- `DashboardScreen`: `active` alert id, `toast` open boolean.

**Global / persisted (in production)**
- Authenticated user (profile, channels, plan).
- User's alerts (CRUD).
- User's saved/watched campgrounds.

### Animations
- **Toast entry**: `@keyframes toast-in` — translateY(20px) → 0, opacity 0 → 1, 0.35s ease-out.
- **Toast icon ping**: `@keyframes ping` — scale(0.6) opacity 0.6 → scale(2.2) opacity 0, 1.6s ease-out, infinite.
- **Buttons**: `background .15s, transform .05s` (active state nudges 1px down).
- **Inputs**: focus ring is `box-shadow: 0 0 0 3px color-mix(in oklch, var(--primary) 18%, transparent)` + border color change.
- **Sites grid spots**: `all .12s` transition on hover/select.

### Form validation (suggested)
- Email format on signup.
- At least one notification channel on the create-alert form.
- Departure date > arrival date.
- Specific-site mode requires ≥1 selected site.

### Loading / empty states (not yet designed — recommend adding)
- Search with 0 matches.
- Dashboard with 0 alerts (call-to-action to create one).
- Alert with status "still searching, no hits yet" beyond X days.

---

## Backend / data shape

The prototype seeds these from `data.js`. Use them as a starting type contract.

```ts
type Campground = {
  id: string;            // slug
  name: string;
  park: string;
  region: string;
  sites: number;
  elevation: string;     // e.g. "4,000 ft"
  coords: { x: number; y: number }; // % position on schematic map; replace with lat/lng
  tags: string[];        // ["Tent", "RV", "Pet OK"]
  desc: string;
  cancellations: number; // last-30-day cancellation count
};

type Alert = {
  id: string;
  campground: string;
  park: string;
  dates: string;         // serialize as ISO range in real impl
  nights: number;
  flexibility: "exact" | "3d" | "week" | "wknd" | string;
  sites: string;         // "14, 15, 22" or "Any tent site"
  status: "monitoring" | "found" | "paused";
  hits: number;
  lastCheck: string;     // store as Date; format in UI
  frequency: "30" | "60" | "300" | "1800"; // seconds
  created: string;       // Date
};

type HistoryEntry = {
  when: string;          // Date
  text: string;
  alert: string;         // alert id
  action: "Notified" | "Skipped (partial)" | "Continuing";
};
```

In production, replace the static `data.js` with:
- Campground catalog from your own DB (seeded from Recreation.gov / ReserveCalifornia APIs).
- Per-user alerts via authenticated REST/GraphQL.
- A polling worker (Cron / queue) that hits the upstream APIs at the configured cadence and writes to a `history` table; matching writes fan out to email/SMS via your transactional provider (Postmark, Resend, Twilio).

---

## Icon set

Custom inline-SVG icons in `components.jsx` (`Icon` component). 24×24 viewBox, currentColor stroke, configurable size/stroke. Names used: `search, bell, map, pin, calendar, user, plus, check, chevron, chevronDown, mail, phone, tent, settings, grid, list, arrow, sliders, play, pause, flame, sparkles, x, sun, moon, download, refresh, bolt, tree`.

In production, swap for **Lucide React** (`lucide-react`) — these icons are direct stylistic matches and the named API will line up almost 1:1.

---

## Assets

- **Photos**: every `<Photo label="…">` is a placeholder. Drop in real images of: Upper Pines (Yosemite), Kirby Cove (Marin), Kirk Creek (Big Sur), Wright's Beach (Sonoma), Lodgepole (Sequoia), Jumbo Rocks (Joshua Tree), Manresa Uplands, North Pines. Aspect ratios used: landscape (380h, 300h, 200h, 140h) and 1:1.
- **Map**: schematic SVG. Replace with Mapbox / MapLibre tiles for production. Pin component (`.cs-pin`) is reusable as a custom marker.
- **Logo mark**: an outlined `tree` icon inside a circle (Field Notes theme overrides the default filled square to a hairline-bordered circle).

---

## Files included

- `CampSearch Prototype.html` — entry point, wraps the prototype in a DesignCanvas.
- `styles.css` — base + all three theme tokens (Field Notes is `[data-theme="field"]`).
- `data.js` — sample campgrounds, alerts, history, calendar, sites grid.
- `components.jsx` — shared primitives (Icon, Logo, TopoBg, MapPlaceholder, Photo, Nav, Sparkline, Switch, Calendar, Toast, SectionHead).
- `screens-landing.jsx` — LandingScreen, SignupScreen.
- `screens-search.jsx` — SearchScreen, DetailScreen.
- `screens-dashboard.jsx` — CreateAlertScreen, DashboardScreen, EmailScreen, AccountScreen.
- `app.jsx` — Prototype root, navigation state, ScreenJumper.
- `design-canvas.jsx` — Figma-like wrapper that hosts the prototype artboard. **Not needed in production** — strip it; mount `<Prototype theme="field" />` directly.

---

## Implementation notes for Claude Code

1. Start by porting `styles.css` (the `[data-theme="field"]` block + the base `.cs-*` classes) into your design system. If you have one already (Tailwind config, Radix tokens, etc.), map the `--*` vars onto your existing scale and use the component classes as a behavior reference rather than copy-paste.
2. Rebuild each screen as a route in your framework. Static markup + minimal local state — there's no global store needed.
3. The toast pattern is your alerts-channel preview; production toasts should fire from your real-time channel (WebSocket / SSE) when the backend writes a new `history` entry of type `Notified`.
4. The schematic map is just a placeholder — wire up a real map provider before shipping.
5. Replace the inline `Icon` set with `lucide-react`. Names match closely.

Open the HTML files in any browser to inspect spacing, hover states, and the full flow. The screen-jumper in the bottom-left of each artboard skips between screens without traversing the natural CTAs.
