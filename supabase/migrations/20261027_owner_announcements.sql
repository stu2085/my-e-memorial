-- Internal announcement delivery and opt-out records are never client-accessible.
create table if not exists public.owner_announcement_optouts (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.owner_announcement_deliveries (
  campaign_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('sending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  primary key (campaign_id, owner_id)
);
alter table public.owner_announcement_optouts enable row level security;
alter table public.owner_announcement_deliveries enable row level security;
revoke all on public.owner_announcement_optouts, public.owner_announcement_deliveries from anon, authenticated;
create table if not exists public.owner_announcement_campaigns (
  id uuid primary key,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.owner_announcement_campaigns enable row level security;
revoke all on public.owner_announcement_campaigns from anon, authenticated;
