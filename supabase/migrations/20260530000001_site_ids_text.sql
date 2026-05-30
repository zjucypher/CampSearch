-- Change site_ids from integer[] to text[] so site names like 'A03' can be stored.
-- Existing integer values (e.g. {3}) are cast to their text equivalents (e.g. {'3'}).
alter table alerts
  alter column site_ids type text[]
  using site_ids::text[];
