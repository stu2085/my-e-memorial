-- Only the name explicitly chosen for public display is stored on the public memorial row.
alter table public.memorials add column if not exists public_creator_credit text;
