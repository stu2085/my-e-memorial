begin;

alter table public.celebration_presentations
  add column if not exists storage_cleanup_completed_at timestamptz,
  add column if not exists storage_cleanup_next_attempt_at timestamptz,
  add column if not exists storage_cleanup_lease uuid;

create table if not exists public.celebration_cleanup_backup_catalog (
  bucket text not null check (bucket in ('memorial-photos', 'memorial-audio')),
  path text not null,
  cleaned_at timestamptz,
  primary key (bucket, path)
);

alter table public.celebration_cleanup_backup_catalog enable row level security;
revoke all on public.celebration_cleanup_backup_catalog from public, anon, authenticated;
grant select, update on public.celebration_cleanup_backup_catalog to service_role;

create or replace function public.claim_celebration_storage_cleanup(p_lease uuid)
returns uuid language sql security definer set search_path = '' as $$
  with candidate as (
    select p.id
    from public.celebration_presentations p
    left join public.memorials m on m.id = p.memorial_id
    where (select count(*) from public.celebration_cleanup_backup_catalog) >= 418
      and p.storage_cleanup_completed_at is null
      and (p.storage_cleanup_next_attempt_at is null or p.storage_cleanup_next_attempt_at <= now())
      and p.status in ('active', 'expired')
      and p.payment_status = 'paid' and p.amount_paid_cents > 0
      and left(p.stripe_checkout_session_id, 8) = 'cs_live_'
      and p.converted_memorial_id is null and p.converted_at is null
      and (p.memorial_id is null or (m.plan = 'free' and m.payment_status is distinct from 'paid'))
      and p.activated_at is not null and p.expires_at >= p.activated_at
      and greatest(p.activated_at + interval '1800 hours', p.expires_at + interval '360 hours') <= now()
    order by p.storage_cleanup_next_attempt_at nulls first, p.expires_at, p.id
    limit 1 for update of p skip locked
  )
  update public.celebration_presentations p
  set storage_cleanup_lease = p_lease, storage_cleanup_next_attempt_at = now() + interval '10 minutes'
  from candidate c where p.id = c.id returning p.public_id;
$$;

create or replace function public.list_celebration_cleanup_uploads(p_public_id uuid)
returns table (bucket text, path text, source_exists boolean)
language sql security definer set search_path = '' stable as $$
  select sources.bucket, sources.path, bool_or(sources.source_exists)
  from (
    select o.bucket_id as bucket, o.name as path, true as source_exists
    from storage.objects o
    where starts_with(o.name, 'celebration-presentations/' || p_public_id::text || '/')
    union all
    select c.bucket, c.path, false from public.celebration_cleanup_backup_catalog c
    where c.cleaned_at is null
      and starts_with(c.path, 'celebration-presentations/' || p_public_id::text || '/')
  ) sources
  group by sources.bucket, sources.path
  order by sources.bucket, sources.path
  limit 10;
$$;

create or replace function public.celebration_cleanup_has_references(p_id bigint, p_needles text[])
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (
    select 1
    from (
      select to_jsonb(m)::text as value from public.memorials m
      union all select to_jsonb(v)::text from public.memorial_videos v
      union all select to_jsonb(s)::text from public.memorial_submissions s
      union all select to_jsonb(p)::text from public.celebration_presentations p where p.id <> p_id
      union all select to_jsonb(i)::text from public.celebration_presentation_items i where i.presentation_id <> p_id
      union all select to_jsonb(m)::text from public.celebration_presentation_music m where m.presentation_id <> p_id
    ) refs
    cross join unnest(p_needles) needle
    where needle <> '' and strpos(refs.value, needle) > 0
  );
$$;

revoke all on function public.claim_celebration_storage_cleanup(uuid) from public, anon, authenticated;
revoke all on function public.list_celebration_cleanup_uploads(uuid) from public, anon, authenticated;
revoke all on function public.celebration_cleanup_has_references(bigint, text[]) from public, anon, authenticated;
grant execute on function public.claim_celebration_storage_cleanup(uuid) to service_role;
grant execute on function public.list_celebration_cleanup_uploads(uuid) to service_role;
grant execute on function public.celebration_cleanup_has_references(bigint, text[]) to service_role;

commit;
