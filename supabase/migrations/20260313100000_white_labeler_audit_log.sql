create table if not exists public.statxeo_white_labeler_audit_log (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete', 'transition')),
  entity_type text not null check (entity_type in ('plan_override', 'branding', 'domain', 'team_member', 'payout_batch')),
  entity_id text,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_statxeo_wl_audit_log_labeler
  on public.statxeo_white_labeler_audit_log (white_labeler_id, created_at desc);

create index if not exists idx_statxeo_wl_audit_log_entity
  on public.statxeo_white_labeler_audit_log (white_labeler_id, entity_type, entity_id, created_at desc);

alter table public.statxeo_white_labeler_audit_log enable row level security;

create policy "service_role_all_audit_log"
  on public.statxeo_white_labeler_audit_log
  for all
  to service_role
  using (true)
  with check (true);

create policy "member_read_audit_log"
  on public.statxeo_white_labeler_audit_log
  for select
  to authenticated
  using (
    white_labeler_id in (
      select white_labeler_id
      from public.statxeo_white_labeler_members
      where user_id = auth.uid()
        and is_active = true
    )
  );
