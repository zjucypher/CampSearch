-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- campgrounds (public catalog, no RLS needed)
-- ─────────────────────────────────────────────
create table if not exists campgrounds (
  id            text primary key,           -- slug, e.g. "upper-pines"
  name          text not null,
  park          text not null,
  state         text not null default 'CA',
  rec_area_id   integer,                    -- Recreation.gov facility ID
  agency        text not null default 'NPS',
  lat           double precision,
  lng           double precision,
  site_count    integer not null default 0,
  amenities     text[] not null default '{}',
  photo_url     text,
  description   text,
  booking_url   text,
  created_at    timestamptz not null default now()
);

create index if not exists campgrounds_park_idx on campgrounds(park);
create index if not exists campgrounds_state_idx on campgrounds(state);

-- ─────────────────────────────────────────────
-- alerts  (per-user, RLS enforced)
-- ─────────────────────────────────────────────
create table if not exists alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  campground_id   text not null references campgrounds(id),

  -- Date window
  arrive_date     date not null,
  depart_date     date not null,
  flexibility     text not null default 'exact'
                    check (flexibility in ('exact','3d','week','wknd')),

  -- Site filter
  site_mode       text not null default 'any'
                    check (site_mode in ('specific','any')),
  site_ids        integer[] not null default '{}',
  site_type       text,
  min_occupancy   integer not null default 1,
  amenity_filter  text[] not null default '{}',

  -- Party
  adults          integer not null default 2,
  kids            integer not null default 0,
  vehicles        integer not null default 1,

  -- Notifications
  channel_email   boolean not null default true,
  channel_sms     boolean not null default false,
  channel_push    boolean not null default false,
  poll_interval   integer not null default 60
                    check (poll_interval in (30, 60, 300, 1800)),

  -- State
  status          text not null default 'monitoring'
                    check (status in ('monitoring','paused','found','expired')),
  hits            integer not null default 0,
  last_checked_at timestamptz,
  last_hit_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists alerts_user_idx on alerts(user_id);
create index if not exists alerts_campground_idx on alerts(campground_id);
create index if not exists alerts_status_idx on alerts(status);

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger alerts_updated_at
  before update on alerts
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────
-- alert_history (append-only log, RLS enforced)
-- ─────────────────────────────────────────────
create table if not exists alert_history (
  id          uuid primary key default gen_random_uuid(),
  alert_id    uuid not null references alerts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_type  text not null
                check (event_type in ('check','hit','notified','paused','resumed','deleted')),
  site_id     integer,
  site_name   text,
  arrive_date date,
  depart_date date,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists history_alert_idx on alert_history(alert_id);
create index if not exists history_user_idx on alert_history(user_id);
create index if not exists history_created_idx on alert_history(created_at desc);

-- ─────────────────────────────────────────────
-- profiles (mirrors auth.users for app data)
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  timezone    text not null default 'America/Los_Angeles',
  plan        text not null default 'free'
                check (plan in ('free','pro','ranger')),
  -- alert defaults
  default_adults      integer not null default 2,
  default_kids        integer not null default 0,
  default_flexibility text not null default 'exact',
  default_poll        integer not null default 60,
  default_channels    text[] not null default '{email}',
  -- notification prefs
  notify_email  boolean not null default true,
  notify_sms    boolean not null default false,
  notify_push   boolean not null default false,
  quiet_start   time,
  quiet_end     time,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

-- auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
