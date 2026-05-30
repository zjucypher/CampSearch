-- Add alerts to the Supabase Realtime publication so UPDATE subscriptions work.
-- REPLICA IDENTITY FULL is required for UPDATE events to include the full row
-- data, which Supabase Realtime needs to apply RLS filtering before delivery.
alter publication supabase_realtime add table alerts;
alter table alerts replica identity full;

-- alert_history should already be in the publication from the initial setup,
-- but add it explicitly to make the migration self-contained.
alter publication supabase_realtime add table alert_history;
