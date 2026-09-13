create table if not exists public.discogs_release_cache (
  release_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.discogs_release_cache enable row level security;

drop policy if exists "Public can read discogs release cache" on public.discogs_release_cache;
create policy "Public can read discogs release cache"
  on public.discogs_release_cache
  for select
  using (true);
