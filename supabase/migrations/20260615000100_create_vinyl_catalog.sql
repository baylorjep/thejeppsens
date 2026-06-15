create table if not exists public.vinyl_records (
  id text primary key,
  record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vinyl_records enable row level security;

drop policy if exists "Public can read vinyl records" on public.vinyl_records;
create policy "Public can read vinyl records"
  on public.vinyl_records
  for select
  using (true);

insert into storage.buckets (id, name, public)
values ('vinyl-covers', 'vinyl-covers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read vinyl covers" on storage.objects;
create policy "Public can read vinyl covers"
  on storage.objects
  for select
  using (bucket_id = 'vinyl-covers');
