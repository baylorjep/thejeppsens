create table public.vinyl_pressing_submissions (
  record_id text primary key references public.vinyl_records(id) on delete cascade,
  revision uuid not null default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft','pending','needs_info','confirmed','no_match')),
  evidence jsonb not null,
  review_notes text,
  release_id bigint,
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.vinyl_pressing_submissions enable row level security;
revoke all on public.vinyl_pressing_submissions from anon, authenticated;
grant all on public.vinyl_pressing_submissions to service_role;
create index vinyl_pressing_pending on public.vinyl_pressing_submissions(updated_at) where status = 'pending';

-- Submission edits invalidate a previous pressing confirmation and save copy grades.
create function public.sync_vinyl_pressing_evidence() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  update public.vinyl_records set record = record || jsonb_build_object(
    'discogsVerified', false,
    'condition', coalesce(nullif(new.evidence->>'mediaGrade',''), 'Unknown'),
    'sleeveCondition', new.evidence->>'sleeveGrade'
  ), updated_at = now() where id = new.record_id;
  return new;
end;
$$;
revoke all on function public.sync_vinyl_pressing_evidence() from public, anon, authenticated;
grant execute on function public.sync_vinyl_pressing_evidence() to service_role;
create trigger sync_vinyl_pressing_evidence after insert or update of evidence on public.vinyl_pressing_submissions
for each row execute function public.sync_vinyl_pressing_evidence();

-- Apply the reviewed match and queue outcome together. A stale export cannot win.
create function public.review_vinyl_pressing(p_record_id text, p_revision uuid, p_status text, p_notes text, p_release_id bigint, p_metadata jsonb)
returns public.vinyl_pressing_submissions
language plpgsql security invoker set search_path = '' as $$
declare s public.vinyl_pressing_submissions;
begin
  select * into s from public.vinyl_pressing_submissions where record_id = p_record_id for update;
  if not found or s.revision <> p_revision or s.status <> 'pending' then
    raise exception 'Submission changed or is no longer pending. Export it again.';
  end if;
  if p_status not in ('confirmed', 'needs_info', 'no_match') or length(trim(p_notes)) < 10 then
    raise exception 'A review outcome and useful evidence notes are required.';
  end if;
  if p_status = 'confirmed' and (p_release_id is null or p_release_id < 1 or p_metadata is null or jsonb_typeof(p_metadata) <> 'object') then
    raise exception 'A confirmed match requires a release and metadata.';
  end if;
  if p_status = 'confirmed' then
    update public.vinyl_records set record = record || p_metadata || jsonb_build_object(
      'discogsReleaseId', p_release_id, 'discogsVerified', true, 'discogsNoMatch', false
    ), updated_at = now() where id = p_record_id;
  else
    update public.vinyl_records set record = record || jsonb_build_object('discogsVerified', false), updated_at = now() where id = p_record_id;
  end if;
  update public.vinyl_pressing_submissions set status = p_status, review_notes = p_notes,
    release_id = case when p_status = 'confirmed' then p_release_id else null end,
    processed_at = now(), updated_at = now(), revision = gen_random_uuid()
    where record_id = p_record_id returning * into s;
  return s;
end;
$$;
revoke all on function public.review_vinyl_pressing(text, uuid, text, text, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.review_vinyl_pressing(text, uuid, text, text, bigint, jsonb) to service_role;
