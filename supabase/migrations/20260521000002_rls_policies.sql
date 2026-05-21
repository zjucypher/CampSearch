-- ─────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────

-- campgrounds: world-readable, no writes via client
alter table campgrounds enable row level security;
create policy "campgrounds_select" on campgrounds
  for select using (true);

-- alerts: users see and manage only their own
alter table alerts enable row level security;

create policy "alerts_select" on alerts
  for select using (auth.uid() = user_id);

create policy "alerts_insert" on alerts
  for insert with check (auth.uid() = user_id);

create policy "alerts_update" on alerts
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "alerts_delete" on alerts
  for delete using (auth.uid() = user_id);

-- alert_history: users see only their own history
alter table alert_history enable row level security;

create policy "history_select" on alert_history
  for select using (auth.uid() = user_id);

-- service role can insert history on behalf of workers
create policy "history_insert_service" on alert_history
  for insert with check (true);

-- profiles: users see and update only their own
alter table profiles enable row level security;

create policy "profiles_select" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
