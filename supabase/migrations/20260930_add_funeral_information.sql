-- Optional public funeral arrangements in the Obituary chapter.
-- The service time is the local time at the venue, without conversion.
begin;

alter table public.memorials
  add column if not exists funeral_date date,
  add column if not exists funeral_time time without time zone,
  add column if not exists funeral_venue_name text,
  add column if not exists funeral_address text;

notify pgrst, 'reload schema';

commit;
