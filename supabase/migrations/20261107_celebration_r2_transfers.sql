create table public.celebration_r2_transfers (
  presentation_public_id uuid not null,
  render_job_id text not null,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  storage_key text not null unique,
  expected_bytes bigint check (expected_bytes >= 1024),
  upload_id text,
  completed_parts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(completed_parts) = 'array'),
  status text not null default 'queued'
    check (status in ('queued', 'uploading', 'stored', 'failed', 'superseded')),
  lease_token uuid,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  consecutive_failures integer not null default 0
    check (consecutive_failures >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (presentation_public_id, render_job_id)
);

create index celebration_r2_transfers_pending_idx
  on public.celebration_r2_transfers (next_attempt_at)
  where status in ('queued', 'uploading');

alter table public.celebration_r2_transfers enable row level security;
revoke all on table public.celebration_r2_transfers from public, anon, authenticated;
grant select, insert, update, delete on table public.celebration_r2_transfers to service_role;

create function public.claim_celebration_r2_transfer()
returns setof public.celebration_r2_transfers
language sql
set search_path = ''
as $$
  with candidate as (
    select t.presentation_public_id, t.render_job_id
    from public.celebration_r2_transfers t
    where t.status in ('queued', 'uploading')
      and t.next_attempt_at <= now()
      and (t.lease_expires_at is null or t.lease_expires_at <= now())
    order by t.next_attempt_at, t.created_at
    limit 1
    for update skip locked
  )
  update public.celebration_r2_transfers t
  set status = 'uploading',
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + interval '2 minutes',
      updated_at = now()
  from candidate c
  where t.presentation_public_id = c.presentation_public_id
    and t.render_job_id = c.render_job_id
  returning t.*;
$$;

revoke all on function public.claim_celebration_r2_transfer()
  from public, anon, authenticated;
grant execute on function public.claim_celebration_r2_transfer()
  to service_role;
