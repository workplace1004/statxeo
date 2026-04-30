create table if not exists public.statxeo_white_labeler_applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  contact_full_name text not null,
  contact_email text not null,
  company_name text not null,
  company_website text,
  desired_slug text,
  referred_by text,
  notes text,
  review_notes text,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  approved_white_labeler_id uuid references public.statxeo_white_labelers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.statxeo_white_labelers
  add column if not exists onboarding_started_at timestamptz not null default now(),
  add column if not exists signup_submitted_at timestamptz,
  add column if not exists org_created_at timestamptz not null default now(),
  add column if not exists branding_completed_at timestamptz,
  add column if not exists stripe_connected_at timestamptz,
  add column if not exists domain_verified_at timestamptz,
  add column if not exists workspace_ready_at timestamptz,
  add column if not exists team_invited_at timestamptz,
  add column if not exists first_client_created_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz;

create unique index if not exists idx_statxeo_wl_applications_pending_email
  on public.statxeo_white_labeler_applications (lower(contact_email))
  where status = 'pending_review';

create index if not exists idx_statxeo_wl_applications_status_created
  on public.statxeo_white_labeler_applications (status, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_white_labeler_applications_set_updated_at'
      and tgrelid = 'public.statxeo_white_labeler_applications'::regclass
  ) then
    create trigger trg_statxeo_white_labeler_applications_set_updated_at
      before update on public.statxeo_white_labeler_applications
      for each row
      execute function public.set_statxeo_white_labeler_updated_at();
  end if;
end
$$;

alter table public.statxeo_white_labeler_applications enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_applications'
      and policyname = 'statxeo_white_labeler_applications_service_role_all'
  ) then
    create policy statxeo_white_labeler_applications_service_role_all
      on public.statxeo_white_labeler_applications
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;