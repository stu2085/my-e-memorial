alter table public.celebration_presentations
  add column if not exists offline_render_submission_token uuid;

comment on column public.celebration_presentations.offline_render_submission_token
  is 'Reserves an offline render submission until its job ID is saved or the provider confirms rejection.';
