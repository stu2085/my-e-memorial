begin;

alter table public.memorials
  add column if not exists published_at timestamptz;

create or replace function public.set_memorial_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_published is true then
      new.published_at := statement_timestamp();
    else
      new.published_at := null;
    end if;
  else
    new.published_at := old.published_at;

    if old.is_published is not true
       and new.is_published is true
       and new.published_at is null then
      new.published_at := statement_timestamp();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_memorial_published_at on public.memorials;

create trigger set_memorial_published_at
before insert or update on public.memorials
for each row
execute function public.set_memorial_published_at();

commit;
