-- Photo sharing (PRD §6.2): the parent can send photos to their family.

create table photo (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references account (id) on delete cascade,
  sender       role not null,
  storage_path text not null,
  caption      text,
  created_at   timestamptz not null default now()
);
create index on photo (account_id, created_at desc);

alter table photo enable row level security;

create policy photo_owner on photo
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Private storage bucket; objects live under <account_id>/<file>.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "photos read own"
  on storage.objects for select
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos insert own"
  on storage.objects for insert
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos delete own"
  on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
