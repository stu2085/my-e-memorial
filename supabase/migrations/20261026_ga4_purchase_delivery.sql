-- Independent analytics ledger. No payment/entitlement tables are changed.
begin;
create table if not exists public.ga4_purchase_deliveries (
  transaction_id text primary key,
  stripe_event_id text not null,
  paid_at timestamptz not null,
  payload jsonb,
  status text not null check (status in ('pending','processing','http_accepted','skipped','expired','rejected')),
  reason text,
  attempts integer not null default 0,
  lease_token uuid,
  lease_until timestamptz,
  last_http_status integer,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.ga4_purchase_deliveries enable row level security;
revoke all on public.ga4_purchase_deliveries from anon, authenticated;
grant select, insert, update on public.ga4_purchase_deliveries to service_role;
-- Atomic claim prevents simultaneous webhook deliveries from sending concurrently.
create or replace function public.claim_ga4_purchase(p_transaction_id text, p_lease_token uuid)
returns setof public.ga4_purchase_deliveries
language sql security invoker set search_path = public as $$
  update public.ga4_purchase_deliveries
  set status='processing', lease_token=p_lease_token,
      lease_until=now()+interval '2 minutes', attempts=attempts+1, updated_at=now()
  where transaction_id=p_transaction_id
    and (status='pending' or (status='processing' and lease_until < now()))
  returning *;
$$;
revoke all on function public.claim_ga4_purchase(text, uuid) from public, anon, authenticated;
grant execute on function public.claim_ga4_purchase(text, uuid) to service_role;
commit;
