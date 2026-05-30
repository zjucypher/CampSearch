-- Retain alert_history rows when an alert is deleted.
-- Drops the NOT NULL constraint and replaces the CASCADE FK with SET NULL.

alter table alert_history alter column alert_id drop not null;

alter table alert_history drop constraint alert_history_alert_id_fkey;

alter table alert_history
  add constraint alert_history_alert_id_fkey
  foreign key (alert_id) references alerts(id) on delete set null;
