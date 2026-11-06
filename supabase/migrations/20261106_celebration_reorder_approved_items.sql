-- Execute once in Supabase SQL Editor before deploying the updated builder.
-- Reorders approved, non-removed media in one transaction. Service-role access only.
create or replace function public.celebration_reorder_approved_items(
  p_presentation_id bigint,
  p_item_ids bigint[]
)
returns bigint[]
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current bigint[];
  v_count integer;
  v_index integer;
begin
  -- Lock the parent row so concurrent reorder requests cannot interleave.
  perform 1 from public.celebration_presentations
  where id = p_presentation_id for update;
  if not found then
    raise exception 'Presentation not found';
  end if;

  select array_agg(id order by sort_order, id), count(*)
    into v_current, v_count
  from public.celebration_presentation_items
  where presentation_id = p_presentation_id
    and approval_status = 'approved'
    and removed_at is null;

  if p_item_ids is null or array_length(p_item_ids, 1) is distinct from v_count
     or v_count > 2000
     or (select count(distinct x) from unnest(p_item_ids) as x) <> v_count
     or (select array_agg(x order by x) from unnest(p_item_ids) as x)
        is distinct from (select array_agg(x order by x) from unnest(v_current) as x)
  then
    raise exception 'Presentation items changed; refresh before rearranging';
  end if;

  -- Every update belongs to this same SQL transaction: all or none.
  for v_index in 1..v_count loop
    update public.celebration_presentation_items
       set sort_order = v_index - 1
     where id = p_item_ids[v_index]
       and presentation_id = p_presentation_id
       and approval_status = 'approved'
       and removed_at is null;
  end loop;
  return p_item_ids;
end;
$$;

revoke all on function public.celebration_reorder_approved_items(bigint, bigint[]) from public, anon, authenticated;
grant execute on function public.celebration_reorder_approved_items(bigint, bigint[]) to service_role;
