-- Atomic hits counter increment (called by simulate and worker)
create or replace function public.increment_alert_hits(alert_id uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  update public.alerts
  set hits = hits + 1,
      status = 'found',
      last_hit_at = now(),
      last_checked_at = now()
  where id = alert_id;
end;
$$;
