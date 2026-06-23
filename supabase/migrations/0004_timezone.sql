-- Per-timezone check-in scheduling (PRD §10). The parent device reports its IANA
-- timezone so the cron fires check-in windows in the parent's local time rather
-- than UTC.
alter table preferences add column timezone text not null default 'UTC';
