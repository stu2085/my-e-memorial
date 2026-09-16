-- Change the standalone Celebration of Life Presentation offer
-- to $29.95 without altering historical paid purchases.

alter table public.celebration_presentations
  alter column price_cents set default 2995;

update public.celebration_presentations
set price_cents = 2995
where payment_status = 'unpaid'
  and price_cents = 1995;