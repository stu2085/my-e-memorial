-- At most 25 announcement reservations, then pause for two minutes.
-- Other messages from the Microsoft 365 mailbox are not counted here.
create table if not exists public.owner_announcement_batch_limit (
  id boolean primary key default true check (id),
  reserved_count integer not null default 0 check (reserved_count between 0 and 25),
  next_batch_at timestamptz
);
alter table public.owner_announcement_batch_limit enable row level security;
revoke all on public.owner_announcement_batch_limit from anon, authenticated;
insert into public.owner_announcement_batch_limit (id) values (true) on conflict do nothing;
create or replace function public.reserve_owner_announcement_slot()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  used_slots integer;
  next_time timestamptz;
  current_time_utc timestamptz;
begin
  select reserved_count, next_batch_at into used_slots, next_time
    from public.owner_announcement_batch_limit where id = true for update;
  if not found then return false; end if;
  current_time_utc := clock_timestamp();
  if used_slots >= 25 then
    if next_time is null or current_time_utc < next_time then return false; end if;
    used_slots := 0;
  end if;
  used_slots := used_slots + 1;
  update public.owner_announcement_batch_limit
    set reserved_count = used_slots,
        next_batch_at = case when used_slots = 25 then current_time_utc + interval '120 seconds' else null end
    where id = true;
  return true;
end;
$$;
revoke all on function public.reserve_owner_announcement_slot() from public, anon, authenticated;
grant execute on function public.reserve_owner_announcement_slot() to service_role;
