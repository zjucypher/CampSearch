# CampSearch — Project Plan

## Overview

CampSearch is a California campsite availability monitoring platform. Users search 138+
California campgrounds, configure availability alerts, and receive email (or SMS) notifications
the moment a matching campsite opens up.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | **Next.js 15 (App Router)** | File-based routing maps cleanly to the 8 design screens; SSR for SEO on landing/search pages |
| Styling | **Tailwind CSS v4** + CSS variables | Port the `[data-theme="field"]` tokens directly; zero runtime CSS |
| UI components | **shadcn/ui** | Headless primitives (dialog, popover, switch, tabs) styled to the Field Notes theme |
| Icons | **Lucide React** | 1-to-1 match to the inline SVG icons in `components.jsx` |
| Map | **MapLibre GL JS** (open-source Mapbox fork) | No token billing for schematic use; swap tiles for real data later |
| Auth | **Supabase Auth** | Email/password + Google OAuth; JWTs flow into Next.js middleware |
| Database | **Supabase (PostgreSQL)** | Schema covers campgrounds, alerts, history, users |
| Real-time | **Supabase Realtime** | Pushes "hit" events to the dashboard toast without polling |
| Email | **Resend** | Transactional email with React Email templates; generous free tier |
| SMS | **Twilio** (optional Pro feature) | SMS alerts per the `CreateAlertScreen` channel options |
| Availability worker | **Python service wrapping camply** | camply already handles Recreation.gov + ReserveCalifornia APIs |
| Worker host | **Railway** (or Fly.io) | Persistent Python process; Vercel cannot run long-lived workers |
| Deployment | **Vercel** (frontend + API routes) | Zero-config Next.js; Cron Jobs for lower-frequency polling triggers |
| Cron scheduling | **Vercel Cron Jobs** (≥5 min cadence) / **Railway cron** (30 s/60 s cadence) | Vercel free tier supports daily crons; Pro supports 1-min crons |

---

## Architecture

```
Browser
  └── Next.js on Vercel
        ├── /app routes (all 8 screens)
        ├── /api/* (REST endpoints for alerts, campgrounds, user)
        └── Supabase JS client (auth, realtime subscriptions)

Supabase (PostgreSQL + Auth + Realtime)
  ├── campgrounds table (seeded from Recreation.gov via camply)
  ├── alerts table (per-user alert configs)
  ├── history table (polling results, matched sites)
  └── Realtime channel: "hits" → pushes to dashboard toast

Python Worker (Railway)
  ├── camply polling engine (RecreationDotGov + GoingToCamp providers)
  ├── Reads active alerts from Supabase every N seconds (per alert's cadence)
  ├── On match → writes to history table + triggers Supabase Realtime
  └── Calls Resend (email) / Twilio (SMS) for notifications
```

**Key constraint**: The 30 s / 60 s polling cadence in the Pro plan requires a persistent
process and cannot run on Vercel serverless. Free/base tier alerts (5 min, 30 min) can be
triggered by Vercel Cron Jobs hitting an API route that enqueues work.

---

## Database Schema

```sql
-- Campground catalog (seeded, not user-editable)
campgrounds (
  id          text primary key,       -- Recreation.gov facility ID slug
  name        text,
  park        text,
  region      text,
  lat         float, lng float,
  sites       int,
  elevation   text,
  tags        text[],
  description text,
  cancellations_30d int
)

-- Per-user alerts
alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users,
  campground_id text references campgrounds(id),
  arrive_date date,
  depart_date date,
  flexibility text,                   -- exact | 3d | week | wknd
  site_mode   text,                   -- specific | any
  site_ids    text[],
  site_type   text,
  min_occupancy int,
  adults      int, kids int, vehicles int,
  channels    jsonb,                  -- { email: true, sms: false }
  frequency   int,                    -- seconds: 30 | 60 | 300 | 1800
  status      text default 'monitoring', -- monitoring | found | paused
  hits        int default 0,
  last_check  timestamptz,
  created_at  timestamptz default now()
)

-- Polling results
history (
  id          uuid primary key default gen_random_uuid(),
  alert_id    uuid references alerts(id),
  user_id     uuid references auth.users,
  action      text,                   -- Notified | Skipped | Continuing
  detail      text,
  created_at  timestamptz default now()
)
```

---

## Project Phases

### Phase 0 — Scaffolding (2 days)

**Goal**: Blank Next.js app deploying to Vercel, connected to Supabase, with design tokens wired.

- [ ] `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- [ ] Configure Tailwind with all `[data-theme="field"]` CSS variables from `styles.css`
- [ ] Install shadcn/ui, Lucide React, MapLibre GL
- [ ] Create Supabase project; generate TypeScript types
- [ ] Connect Supabase env vars; deploy skeleton to Vercel
- [ ] Set up Google Fonts (`Source Serif 4`, `Inter Tight`, `JetBrains Mono`) in `layout.tsx`

**Deliverable**: `https://campsearch.vercel.app` loads a blank parchment page.

---

### Phase 1 — Design System & Static Screens (5 days)

**Goal**: All 8 screens pixel-faithful to the design, wired with local mock data, no backend yet.

**Component library** (maps to `components.jsx` + `styles.css`):
- `CsButton` (default, ghost, quiet, accent, sm, lg variants)
- `CsInput` (underline-only style)
- `CsLabel` (uppercase mono eyebrow)
- `CsCard`, `CsPill` (success, accent, ink, muted variants)
- `CsNav` with logo
- `CsSpot` (campsite grid cell: available, watched, selected, taken)
- `CsCal` (date range picker)
- `CsToast` (with toast-in + ping animations)
- `CsSwitch`, `CsSparkline`

**Routes to build**:
| Route | Screen | Priority |
|---|---|---|
| `/` | Landing + marketing | P0 |
| `/signup` | 2-step signup | P0 |
| `/search` | Map + list | P0 |
| `/campgrounds/[id]` | Campground detail + site grid | P0 |
| `/campgrounds/[id]/alert/new` | Create alert (4-group form) | P0 |
| `/dashboard` | Active alerts + sidebar + toast | P0 |
| `/alerts/[id]/preview` | Email preview | P1 |
| `/account/[tab]` | Profile, notifications, plan, defaults | P1 |

**Deliverable**: Full clickable prototype in production build; all screens navigable.

---

### Phase 2 — Auth & Database (3 days)

**Goal**: Real user accounts; Supabase data replaces mock data.

- [ ] Supabase Auth: email/password sign-up + Google OAuth
- [ ] Next.js middleware for protected routes (`/dashboard`, `/account`, alert creation)
- [ ] Run database migrations (schema above)
- [ ] Seed campground catalog: run camply `campgrounds --state CA` locally, transform output into Supabase rows (~138 campgrounds)
- [ ] `campgrounds` API route: search by name/park/region, paginated
- [ ] Row-Level Security policies (users only read/write their own alerts/history)

**Deliverable**: Sign up, log in, log out all work; `/search` pulls real campground data.

---

### Phase 3 — Search & Browse (3 days)

**Goal**: Functional campground search with map.

- [ ] `/search` — filter bar (region, site type, dates, party), live search against Supabase
- [ ] MapLibre GL integration: render campground pins from lat/lng (replacing % coords from design)
- [ ] Campground card list, selected state, split/list/map view toggle
- [ ] `/campgrounds/[id]` — stat strip, site grid (seeded from camply site data), tabs
- [ ] "Watch" / "Alert me" CTAs navigate to alert creation

**Deliverable**: Users can browse, search, and view real California campground data.

---

### Phase 4 — Alert Management (3 days)

**Goal**: Full CRUD for alerts; dashboard shows live state.

- [ ] Create alert form → writes to Supabase `alerts` table
- [ ] Dashboard fetches and renders user's active alerts, history feed
- [ ] Alert detail sidebar (right column)
- [ ] Pause / resume / delete alert actions
- [ ] "Simulate a hit" button writes a test `history` row and triggers the toast

**Deliverable**: Users can create, view, and manage alerts; dashboard reflects Supabase state.

---

### Phase 5 — Monitoring Worker (5 days)

**Goal**: Python service continuously checks availability and writes hits back.

**Worker design**:
```
Worker loop (runs every N seconds per alert):
  1. Poll Supabase for active alerts due for a check
  2. For each due alert, call camply's search API programmatically:
       SearchRecreationDotGov(campground_id, dates, sites, party)
  3. If sites found:
       a. Update alert: status='found', hits++, last_check=now
       b. Insert history row: action='Notified'
       c. Insert into Supabase Realtime channel → dashboard toast fires
       d. Call Resend → send notification email
       e. (Pro) Call Twilio → send SMS
  4. If not found:
       Update last_check, insert history row: action='Continuing'
```

- [ ] Python service: `worker/` directory in repo
- [ ] Wrap camply `SearchRecreationDotGov` as a callable function (not CLI subprocess)
- [ ] `supabase-py` client for DB reads/writes
- [ ] `resend` Python SDK for email
- [ ] Dockerfile + `railway.toml` for Railway deployment
- [ ] Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`, `TWILIO_*`
- [ ] Respect per-alert `frequency` field; don't re-check an alert more often than configured

**Deliverable**: Worker deployed on Railway; a test alert with a known-available campsite sends a real notification email.

---

### Phase 6 — Notifications & Email Template (2 days)

**Goal**: Pixel-faithful email matching the `EmailScreen` design; Supabase Realtime toast.

- [ ] React Email template mirroring `EmailScreen` (600px, email-safe Georgia serif, inline styles)
- [ ] Resend integration: send on every `Notified` history row
- [ ] Supabase Realtime subscription in dashboard: channel `hits:user_id=eq.{userId}` fires toast
- [ ] Toast auto-dismiss + "Book →" link opens Recreation.gov booking URL

**Deliverable**: End-to-end: alert triggers → worker detects → email arrives + dashboard toast pops.

---

### Phase 7 — Account & Billing (3 days)

**Goal**: Account settings, notification preferences, and plan tiers.

- [ ] `/account/profile` — name, email, avatar
- [ ] `/account/notifications` — email always-on, SMS toggle, phone field
- [ ] `/account/plan` — Free / Pro / Ranger cards (Stripe Checkout for upgrades)
- [ ] `/account/defaults` — default region chips, site type, party size
- [ ] Enforce plan limits: Free = 5 min min cadence, 2 active alerts; Pro = 60 s, unlimited; Ranger = 30 s, unlimited + SMS

**Deliverable**: Users can upgrade; plan tier gates polling cadence.

---

### Phase 8 — Polish & Launch (3 days)

- [ ] Replace `<Photo>` placeholders with real California campground photography
- [ ] Loading skeletons for search, dashboard, campground detail
- [ ] Empty states: 0 search results, 0 active alerts, alert with no hits yet
- [ ] SEO: metadata, OG tags, sitemap for `/campgrounds/[id]` pages
- [ ] Lighthouse audit: performance, accessibility (WCAG AA color contrast check for Field Notes palette)
- [ ] Final security pass: RLS policies, API route auth checks, rate limiting
- [ ] Custom domain on Vercel

---

## Timeline Summary

| Phase | Description | Duration |
|---|---|---|
| 0 | Scaffolding & deployment pipeline | 2 days |
| 1 | Design system & all 8 static screens | 5 days |
| 2 | Auth & database | 3 days |
| 3 | Search & browse | 3 days |
| 4 | Alert management | 3 days |
| 5 | Monitoring worker (camply integration) | 5 days |
| 6 | Notifications & email template | 2 days |
| 7 | Account & billing | 3 days |
| 8 | Polish & launch | 3 days |
| **Total** | | **~29 days** |

---

## Open Questions / Decisions Needed

1. **ReserveCalifornia vs Recreation.gov**: camply supports both. Many popular California
   campgrounds (State Parks) use ReserveCalifornia (`GoingToCamp` provider), not Recreation.gov.
   Confirm which provider covers the target 138 campgrounds before Phase 5.

2. **Map provider**: MapLibre GL is free and open-source but requires a tile server. Options:
   - Maptiler free tier (75k tiles/month) — easiest to start
   - self-hosted tiles — more work, no cost
   Decide before Phase 3.

3. **Billing**: Stripe integration in Phase 7 is scoped to Checkout only (no customer portal).
   Add Stripe Customer Portal in a follow-up if needed.

4. **Worker hosting**: Railway is the simplest path for the Python worker. If the project
   outgrows it, the worker can be migrated to a Fly.io Machine or a Supabase Edge Function
   (Deno, so camply would need a reimplementation).

5. **Pro cadence (30 s)**: Recreation.gov's API has rate limits. Verify acceptable polling
   frequency before advertising 30 s on the pricing page.

---

## Repository Structure (target)

```
CampSearch/
├── app/                        # Next.js App Router
│   ├── (marketing)/
│   │   └── page.tsx            # Landing
│   ├── signup/
│   ├── search/
│   ├── campgrounds/[id]/
│   │   └── alert/new/
│   ├── dashboard/
│   ├── alerts/[id]/preview/
│   └── account/[tab]/
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   └── cs/                     # CampSearch-specific (CsNav, CsSpot, CsToast, …)
├── lib/
│   ├── supabase/               # client, server, types
│   └── email/                  # React Email templates
├── worker/                     # Python polling service
│   ├── main.py
│   ├── poller.py
│   ├── notifications.py
│   ├── requirements.txt
│   └── Dockerfile
├── supabase/
│   └── migrations/
├── design_handoff_campsearch/  # reference only, not imported
└── PROJECT_PLAN.md
```
