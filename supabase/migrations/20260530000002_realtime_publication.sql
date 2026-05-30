-- Add alerts and alert_history to the Supabase Realtime publication so
-- postgres_changes subscriptions work for both tables.
-- REPLICA IDENTITY FULL is required on alerts so UPDATE events include the
-- full row data that Supabase Realtime needs for RLS-based delivery filtering.
--
-- Wrapped in DO blocks so the migration is idempotent (safe to re-run).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'alerts'
  ) then
    alter publication supabase_realtime add table alerts;
  end if;
end $$;

alter table alerts replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'alert_history'
  ) then
    alter publication supabase_realtime add table alert_history;
  end if;
end $$;
