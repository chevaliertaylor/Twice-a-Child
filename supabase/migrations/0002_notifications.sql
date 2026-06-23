-- Push notifications + scheduled check-ins.

-- Expo push tokens, one row per device. Both parent and child devices share the
-- same account, so RLS stays a simple ownership check.
create table device (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references account (id) on delete cascade,
  role            role not null,
  expo_push_token text not null,
  platform        text,
  updated_at      timestamptz not null default now(),
  unique (account_id, expo_push_token)
);
create index on device (account_id, role);

alter table device enable row level security;

create policy device_owner on device
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Track when the last proactive check-in was sent so the cron doesn't repeat.
alter table preferences add column last_checkin_at timestamptz;
