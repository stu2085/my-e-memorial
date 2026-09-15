-- Single-use purchase delivery link. The raw secret is sent only to the purchaser.
alter table public.celebration_presentations
  add column if not exists email_access_token_hash text,
  add column if not exists email_access_expires_at timestamptz;

alter table public.celebration_presentations
  add column if not exists email_access_requested_at timestamptz;

alter table public.celebration_presentations
  add column if not exists credit_coupon_id text,
  add column if not exists credit_promotion_code_id text,
  add column if not exists credit_code text;
