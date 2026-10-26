create table if not exists public.memory_reminder_deliveries (memorial_id bigint not null references public.memorials(id) on delete cascade, stage smallint not null check (stage in (30,60,90)), status text not null check (status in ('sending','sent','failed','skipped')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key (memorial_id, stage));
alter table public.memory_reminder_deliveries enable row level security;
revoke all on public.memory_reminder_deliveries from anon, authenticated;
grant select, insert, update on public.memory_reminder_deliveries to service_role;
