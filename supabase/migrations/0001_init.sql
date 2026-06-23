-- Twice a Child — initial schema
--
-- Account model (PRD §4): one Supabase Auth user is the shared login used on
-- both the parent and child devices. Every row is scoped to that user via
-- account_id = auth.uid(), so RLS is a simple ownership check.

-- ---------- enums ----------
create type role as enum ('parent', 'child');
create type plan_choice as enum ('trial', 'subscribe');
create type cadence as enum ('daily', 'few_days', 'weekly');
create type checkin_window as enum ('morning', 'midday', 'evening');
create type avatar_kind as enum ('photo', 'preset');
create type message_sender as enum ('parent', 'companion');
create type message_modality as enum ('text', 'voice');
create type concern_level as enum ('none', 'low', 'medium', 'high');

-- ---------- accounts ----------
create table account (
  id            uuid primary key references auth.users (id) on delete cascade,
  plan          plan_choice,
  trial_ends_at timestamptz,
  created_at    timestamptz not null default now()
);

-- Up to two profiles per account (one parent, one child).
create table profile (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references account (id) on delete cascade,
  role         role not null,
  display_name text,
  avatar_kind  avatar_kind,
  avatar_ref   text, -- preset id or storage object path
  created_at   timestamptz not null default now(),
  unique (account_id, role)
);

-- Child-configured notification & check-in preferences (PRD §5.4).
create table preferences (
  account_id        uuid primary key references account (id) on delete cascade,
  summary_frequency cadence not null default 'daily',
  summary_time      text not null default '08:00',
  checkin_frequency cadence not null default 'daily',
  checkin_window    checkin_window not null default 'morning',
  urgent_alerts     boolean not null default true,
  updated_at        timestamptz not null default now()
);

-- ---------- conversations ----------
create table conversation (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references account (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz
);
create index on conversation (account_id, started_at desc);

create table message (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references account (id) on delete cascade,
  conversation_id uuid not null references conversation (id) on delete cascade,
  sender          message_sender not null,
  modality        message_modality not null default 'text',
  content         text not null,
  created_at      timestamptz not null default now()
);
create index on message (conversation_id, created_at);

-- ---------- wellbeing outputs ----------
create table summary (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references account (id) on delete cascade,
  conversation_id uuid references conversation (id) on delete set null,
  summary_text    text not null,
  mood            text,
  energy          text,
  sleep           text,
  appetite        text,
  pain            text,
  social_contact  text,
  cognitive_flags jsonb not null default '[]'::jsonb,
  highlights      jsonb not null default '[]'::jsonb,
  concern_level   concern_level not null default 'none',
  created_at      timestamptz not null default now()
);
create index on summary (account_id, created_at desc);

create table alert (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references account (id) on delete cascade,
  conversation_id uuid references conversation (id) on delete set null,
  message_id      uuid references message (id) on delete set null,
  category        text not null,
  severity        concern_level not null,
  description     text not null,
  created_at      timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index on alert (account_id, created_at desc);

-- ---------- row level security ----------
-- Every table is owned by exactly one auth user (the shared account login).
alter table account     enable row level security;
alter table profile     enable row level security;
alter table preferences enable row level security;
alter table conversation enable row level security;
alter table message     enable row level security;
alter table summary     enable row level security;
alter table alert       enable row level security;

create policy account_owner on account
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy profile_owner on profile
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy preferences_owner on preferences
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy conversation_owner on conversation
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy message_owner on message
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy summary_owner on summary
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy alert_owner on alert
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Create the account + empty preferences row automatically on signup.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into account (id) values (new.id) on conflict do nothing;
  insert into preferences (account_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
