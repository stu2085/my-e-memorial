-- ============================================================
-- Link Celebration Presentations to MyEMemorials
-- September 23, 2026
--
-- Supports claiming a standalone Presentation into a Member
-- account and linking that same Presentation to a MyEMemorial.
-- ============================================================

alter table public.celebration_presentations
  add column if not exists claimed_by uuid
    references auth.users(id)
    on delete set null;

alter table public.celebration_presentations
  add column if not exists claimed_at timestamptz;

alter table public.celebration_presentations
  add column if not exists memorial_id bigint
    references public.memorials(id)
    on delete set null;


-- Preserve any earlier Presentation-to-memorial conversions as
-- relationships in the new unified model.
update public.celebration_presentations
set memorial_id = converted_memorial_id
where memorial_id is null
  and converted_memorial_id is not null;


create index if not exists
  celebration_presentations_claimed_by_idx
on public.celebration_presentations (
  claimed_by
)
where claimed_by is not null;


-- A MyEMemorial has one unified Celebration Presentation.
create unique index if not exists
  celebration_presentations_memorial_id_unique_idx
on public.celebration_presentations (
  memorial_id
)
where memorial_id is not null;


comment on column public.celebration_presentations.claimed_by is
  'Authenticated Member who claimed ownership of this Presentation.';

comment on column public.celebration_presentations.claimed_at is
  'Time the standalone Presentation was claimed into a Member account.';

comment on column public.celebration_presentations.memorial_id is
  'MyEMemorial currently linked to this Celebration Presentation. The standalone Presentation remains subject to its 60-day entitlement unless the linked MyEMemorial is upgraded.';
