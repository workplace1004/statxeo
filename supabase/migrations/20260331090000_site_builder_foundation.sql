-- ============================================================================
-- STATXEO Site Builder Foundation
-- ============================================================================
-- Creates the 7 core tables for AI-powered website generation.
--
-- Naming: statxeo_site_* prefix to avoid collision with existing
-- statxeo_projects table (owned by STATXT, migration 20260309120000).
--
-- RLS pattern: matches statxeo_customer_documents (20260311 migration).
--   - service_role: full access
--   - authenticated: SELECT own via customer_lead_links or email match
--
-- Trigger pattern: matches statxeo_leads, statxeo_white_labelers.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. statxeo_site_template_registry
--    Available website templates. Must be created first (FK target).
--    Pattern: statxeo_workflow_task_templates (active flag, package binding)
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.statxeo_site_template_registry (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  supported_packages text[] not null default '{}',
  slot_schema jsonb not null default '{}'::jsonb,
  renderer_version text not null default '1.0',
  pages text[] not null default '{}',
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_statxeo_site_template_registry_name
  on public.statxeo_site_template_registry (name);

create index if not exists idx_statxeo_site_template_registry_active
  on public.statxeo_site_template_registry (is_active, created_at desc)
  where is_active = true;

create or replace function public.set_statxeo_site_template_registry_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_site_template_registry_set_updated_at'
      and tgrelid = 'public.statxeo_site_template_registry'::regclass
  ) then
    create trigger trg_statxeo_site_template_registry_set_updated_at
      before update on public.statxeo_site_template_registry
      for each row
      execute function public.set_statxeo_site_template_registry_updated_at();
  end if;
end
$$;

alter table public.statxeo_site_template_registry enable row level security;

create policy "site_template_registry_service_role_all"
  on public.statxeo_site_template_registry
  for all
  to service_role
  using (true)
  with check (true);

create policy "site_template_registry_authenticated_select"
  on public.statxeo_site_template_registry
  for select
  to authenticated
  using (is_active = true);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. statxeo_site_projects
--    Central record per AI-generated website.
--    Links to STATXT-owned statxeo_leads + statxeo_purchases.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.statxeo_site_projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.statxeo_leads(id) on delete cascade,
  purchase_id uuid references public.statxeo_purchases(id) on delete set null,
  white_labeler_id uuid references public.statxeo_white_labelers(id) on delete set null,

  -- Denormalized from statxeo_leads.intake_json
  business_name text,
  business_industry text,
  business_address text,
  business_products_services text,
  owner_full_name text,
  email text,
  phone text,

  -- Package + template binding
  package_tier text not null,
  template_id uuid references public.statxeo_site_template_registry(id) on delete set null,
  template_version integer not null default 1,

  -- Website preferences (collected post-purchase, NOT in checkout payload)
  brand_tone text,
  primary_color text,
  secondary_color text,
  target_audience text,
  unique_selling_points text[],
  service_areas text[],
  cta_preference text,
  business_hours jsonb,
  social_links jsonb,

  -- Lifecycle
  status text not null default 'awaiting_purchase',

  -- Deployment URLs
  preview_url text,
  production_url text,
  domain_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_projects_status_check'
      and conrelid = 'public.statxeo_site_projects'::regclass
  ) then
    alter table public.statxeo_site_projects
      add constraint statxeo_site_projects_status_check
      check (status in (
        'awaiting_purchase',
        'awaiting_preferences',
        'assets_pending',
        'ready_for_generation',
        'generating',
        'preview_ready',
        'changes_requested',
        'approved',
        'production_deploying',
        'live',
        'failed'
      ));
  end if;
end
$$;

create unique index if not exists idx_statxeo_site_projects_lead
  on public.statxeo_site_projects (lead_id);

create index if not exists idx_statxeo_site_projects_status
  on public.statxeo_site_projects (status, updated_at desc);

create index if not exists idx_statxeo_site_projects_white_labeler
  on public.statxeo_site_projects (white_labeler_id, created_at desc)
  where white_labeler_id is not null;

create index if not exists idx_statxeo_site_projects_package
  on public.statxeo_site_projects (package_tier, status);

create or replace function public.set_statxeo_site_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_site_projects_set_updated_at'
      and tgrelid = 'public.statxeo_site_projects'::regclass
  ) then
    create trigger trg_statxeo_site_projects_set_updated_at
      before update on public.statxeo_site_projects
      for each row
      execute function public.set_statxeo_site_projects_updated_at();
  end if;
end
$$;

alter table public.statxeo_site_projects enable row level security;

-- Service role: full access
create policy "site_projects_service_role_all"
  on public.statxeo_site_projects
  for all
  to service_role
  using (true)
  with check (true);

-- Authenticated: SELECT own via customer_lead_links or email match
-- (matches statxeo_customer_documents RLS pattern exactly)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_site_projects'
      and policyname = 'site_projects_authenticated_select_own'
  ) then
    create policy site_projects_authenticated_select_own
      on public.statxeo_site_projects
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_customer_lead_links as links
          where links.lead_id = statxeo_site_projects.lead_id
            and links.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.statxeo_leads as leads
          where leads.id = statxeo_site_projects.lead_id
            and lower(coalesce(leads.contact_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      );
  end if;
end
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. statxeo_site_intake_submissions
--    Versioned intake snapshots per project.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.statxeo_site_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.statxeo_site_projects(id) on delete cascade,
  version integer not null default 1,
  source text not null default 'customer_portal',
  raw_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  submitted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_intake_submissions_source_check'
      and conrelid = 'public.statxeo_site_intake_submissions'::regclass
  ) then
    alter table public.statxeo_site_intake_submissions
      add constraint statxeo_site_intake_submissions_source_check
      check (source in ('customer_portal', 'white_labeler_portal', 'checkout_seed', 'admin_override'));
  end if;
end
$$;

create unique index if not exists idx_statxeo_site_intake_submissions_project_version
  on public.statxeo_site_intake_submissions (project_id, version);

create index if not exists idx_statxeo_site_intake_submissions_project
  on public.statxeo_site_intake_submissions (project_id, created_at desc);

alter table public.statxeo_site_intake_submissions enable row level security;

create policy "site_intake_submissions_service_role_all"
  on public.statxeo_site_intake_submissions
  for all
  to service_role
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_site_intake_submissions'
      and policyname = 'site_intake_submissions_authenticated_select_own'
  ) then
    create policy site_intake_submissions_authenticated_select_own
      on public.statxeo_site_intake_submissions
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_customer_lead_links as links on links.lead_id = sp.lead_id
          where sp.id = statxeo_site_intake_submissions.project_id
            and links.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_leads as leads on leads.id = sp.lead_id
          where sp.id = statxeo_site_intake_submissions.project_id
            and lower(coalesce(leads.contact_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      );
  end if;
end
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 4. statxeo_site_media_assets
--    Uploads and derived media per project.
--    Pattern: statxeo_lead_images + statxeo_customer_documents
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.statxeo_site_media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.statxeo_site_projects(id) on delete cascade,
  asset_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  optimized_path text,
  original_filename text,
  mime_type text,
  size_bytes bigint,
  checksum text,
  placement_hint text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_media_assets_asset_type_check'
      and conrelid = 'public.statxeo_site_media_assets'::regclass
  ) then
    alter table public.statxeo_site_media_assets
      add constraint statxeo_site_media_assets_asset_type_check
      check (asset_type in ('logo', 'photo', 'generated_image', 'favicon'));
  end if;
end
$$;

create unique index if not exists idx_statxeo_site_media_assets_storage
  on public.statxeo_site_media_assets (storage_bucket, storage_path);

create index if not exists idx_statxeo_site_media_assets_project
  on public.statxeo_site_media_assets (project_id, sort_order, created_at);

alter table public.statxeo_site_media_assets enable row level security;

create policy "site_media_assets_service_role_all"
  on public.statxeo_site_media_assets
  for all
  to service_role
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_site_media_assets'
      and policyname = 'site_media_assets_authenticated_select_own'
  ) then
    create policy site_media_assets_authenticated_select_own
      on public.statxeo_site_media_assets
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_customer_lead_links as links on links.lead_id = sp.lead_id
          where sp.id = statxeo_site_media_assets.project_id
            and links.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_leads as leads on leads.id = sp.lead_id
          where sp.id = statxeo_site_media_assets.project_id
            and lower(coalesce(leads.contact_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      );
  end if;
end
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 5. statxeo_site_generation_jobs
--    One row per generation/revision/deploy job.
--    Pattern: statxeo_workflow_tasks (status + stage tracking)
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.statxeo_site_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.statxeo_site_projects(id) on delete cascade,

  job_type text not null,
  status text not null default 'queued',
  stage text not null default 'queued',

  -- Execution metadata
  trigger_type text not null default 'manual',
  provider text not null default 'anthropic',
  model_used text not null default 'claude-sonnet-4-6',
  retry_count integer not null default 0,
  token_usage_input integer,
  token_usage_output integer,
  duration_ms integer,
  idempotency_key text,
  error_message text,

  -- Timestamps
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_generation_jobs_job_type_check'
      and conrelid = 'public.statxeo_site_generation_jobs'::regclass
  ) then
    alter table public.statxeo_site_generation_jobs
      add constraint statxeo_site_generation_jobs_job_type_check
      check (job_type in ('initial', 'revision', 'regenerate', 'deploy_preview', 'deploy_production'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_generation_jobs_status_check'
      and conrelid = 'public.statxeo_site_generation_jobs'::regclass
  ) then
    alter table public.statxeo_site_generation_jobs
      add constraint statxeo_site_generation_jobs_status_check
      check (status in ('queued', 'running', 'completed', 'failed', 'cancelled'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_generation_jobs_stage_check'
      and conrelid = 'public.statxeo_site_generation_jobs'::regclass
  ) then
    alter table public.statxeo_site_generation_jobs
      add constraint statxeo_site_generation_jobs_stage_check
      check (stage in (
        'queued', 'loading_project', 'normalizing_intake', 'resolving_template',
        'assembling_prompt', 'llm_calling', 'validating_output', 'mapping_slots',
        'generating_seo', 'building_manifest', 'deploying_preview', 'deploying_production',
        'complete', 'failed'
      ));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_generation_jobs_trigger_type_check'
      and conrelid = 'public.statxeo_site_generation_jobs'::regclass
  ) then
    alter table public.statxeo_site_generation_jobs
      add constraint statxeo_site_generation_jobs_trigger_type_check
      check (trigger_type in ('manual', 'reconciler', 'change_request', 'admin'));
  end if;
end
$$;

create unique index if not exists idx_statxeo_site_generation_jobs_idempotency
  on public.statxeo_site_generation_jobs (idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_statxeo_site_generation_jobs_project
  on public.statxeo_site_generation_jobs (project_id, created_at desc);

create index if not exists idx_statxeo_site_generation_jobs_status
  on public.statxeo_site_generation_jobs (status, updated_at desc);

create index if not exists idx_statxeo_site_generation_jobs_active
  on public.statxeo_site_generation_jobs (status, stage, updated_at desc)
  where status in ('queued', 'running');

create or replace function public.set_statxeo_site_generation_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_site_generation_jobs_set_updated_at'
      and tgrelid = 'public.statxeo_site_generation_jobs'::regclass
  ) then
    create trigger trg_statxeo_site_generation_jobs_set_updated_at
      before update on public.statxeo_site_generation_jobs
      for each row
      execute function public.set_statxeo_site_generation_jobs_updated_at();
  end if;
end
$$;

alter table public.statxeo_site_generation_jobs enable row level security;

create policy "site_generation_jobs_service_role_all"
  on public.statxeo_site_generation_jobs
  for all
  to service_role
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_site_generation_jobs'
      and policyname = 'site_generation_jobs_authenticated_select_own'
  ) then
    create policy site_generation_jobs_authenticated_select_own
      on public.statxeo_site_generation_jobs
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_customer_lead_links as links on links.lead_id = sp.lead_id
          where sp.id = statxeo_site_generation_jobs.project_id
            and links.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_leads as leads on leads.id = sp.lead_id
          where sp.id = statxeo_site_generation_jobs.project_id
            and lower(coalesce(leads.contact_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      );
  end if;
end
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 6. statxeo_site_generation_artifacts
--    Structured outputs per job.
--    Pattern: statxeo_workflow_task_evidence (per-entity storage)
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.statxeo_site_generation_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.statxeo_site_generation_jobs(id) on delete cascade,
  project_id uuid not null references public.statxeo_site_projects(id) on delete cascade,
  artifact_type text not null,
  schema_version text not null default '1.0',
  payload jsonb not null default '{}'::jsonb,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_generation_artifacts_type_check'
      and conrelid = 'public.statxeo_site_generation_artifacts'::regclass
  ) then
    alter table public.statxeo_site_generation_artifacts
      add constraint statxeo_site_generation_artifacts_type_check
      check (artifact_type in (
        'prompt', 'generated_copy', 'validated_slots', 'seo_bundle',
        'render_manifest', 'llms_txt'
      ));
  end if;
end
$$;

create index if not exists idx_statxeo_site_artifacts_project_current
  on public.statxeo_site_generation_artifacts (project_id, artifact_type, is_current)
  where is_current = true;

create index if not exists idx_statxeo_site_artifacts_job
  on public.statxeo_site_generation_artifacts (job_id, created_at desc);

alter table public.statxeo_site_generation_artifacts enable row level security;

create policy "site_generation_artifacts_service_role_all"
  on public.statxeo_site_generation_artifacts
  for all
  to service_role
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_site_generation_artifacts'
      and policyname = 'site_generation_artifacts_authenticated_select_own'
  ) then
    create policy site_generation_artifacts_authenticated_select_own
      on public.statxeo_site_generation_artifacts
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_customer_lead_links as links on links.lead_id = sp.lead_id
          where sp.id = statxeo_site_generation_artifacts.project_id
            and links.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_leads as leads on leads.id = sp.lead_id
          where sp.id = statxeo_site_generation_artifacts.project_id
            and lower(coalesce(leads.contact_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      );
  end if;
end
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 7. statxeo_site_change_requests
--    Customer/admin revision requests.
--    Pattern: statxeo_workflow_task_notes (per-entity comments with actor)
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.statxeo_site_change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.statxeo_site_projects(id) on delete cascade,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  source text not null default 'customer',
  scope_type text not null default 'site',
  page_key text,
  section_key text,
  description text not null,
  status text not null default 'pending',
  generation_job_id uuid references public.statxeo_site_generation_jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_change_requests_source_check'
      and conrelid = 'public.statxeo_site_change_requests'::regclass
  ) then
    alter table public.statxeo_site_change_requests
      add constraint statxeo_site_change_requests_source_check
      check (source in ('customer', 'white_labeler', 'admin', 'system'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_change_requests_scope_type_check'
      and conrelid = 'public.statxeo_site_change_requests'::regclass
  ) then
    alter table public.statxeo_site_change_requests
      add constraint statxeo_site_change_requests_scope_type_check
      check (scope_type in ('site', 'page', 'section', 'seo', 'media'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_site_change_requests_status_check'
      and conrelid = 'public.statxeo_site_change_requests'::regclass
  ) then
    alter table public.statxeo_site_change_requests
      add constraint statxeo_site_change_requests_status_check
      check (status in ('pending', 'in_progress', 'resolved', 'rejected'));
  end if;
end
$$;

create index if not exists idx_statxeo_site_change_requests_project
  on public.statxeo_site_change_requests (project_id, created_at desc);

create index if not exists idx_statxeo_site_change_requests_status
  on public.statxeo_site_change_requests (status, created_at desc)
  where status in ('pending', 'in_progress');

alter table public.statxeo_site_change_requests enable row level security;

create policy "site_change_requests_service_role_all"
  on public.statxeo_site_change_requests
  for all
  to service_role
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_site_change_requests'
      and policyname = 'site_change_requests_authenticated_select_own'
  ) then
    create policy site_change_requests_authenticated_select_own
      on public.statxeo_site_change_requests
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_customer_lead_links as links on links.lead_id = sp.lead_id
          where sp.id = statxeo_site_change_requests.project_id
            and links.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.statxeo_site_projects as sp
          join public.statxeo_leads as leads on leads.id = sp.lead_id
          where sp.id = statxeo_site_change_requests.project_id
            and lower(coalesce(leads.contact_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      );
  end if;
end
$$;

-- Allow authenticated users to INSERT their own change requests
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_site_change_requests'
      and policyname = 'site_change_requests_authenticated_insert_own'
  ) then
    create policy site_change_requests_authenticated_insert_own
      on public.statxeo_site_change_requests
      for insert
      to authenticated
      with check (
        requested_by_user_id = auth.uid()
        and (
          exists (
            select 1
            from public.statxeo_site_projects as sp
            join public.statxeo_customer_lead_links as links on links.lead_id = sp.lead_id
            where sp.id = statxeo_site_change_requests.project_id
              and links.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.statxeo_site_projects as sp
            join public.statxeo_leads as leads on leads.id = sp.lead_id
            where sp.id = statxeo_site_change_requests.project_id
              and lower(coalesce(leads.contact_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
        )
      );
  end if;
end
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 8. Seed template registry with lander-default
-- ────────────────────────────────────────────────────────────────────────────

insert into public.statxeo_site_template_registry (name, description, supported_packages, pages, slot_schema, renderer_version, is_active)
values (
  'lander-default',
  'Default single-page landing template. Hero, services, about, testimonials, contact, CTA.',
  '{statxeo_lander,statxeo_core,statxeo_titan}',
  '{home}',
  '{
    "hero": {
      "headline": "string",
      "subheadline": "string",
      "ctaText": "string",
      "ctaUrl": "string",
      "backgroundImagePrompt": "string"
    },
    "services": {
      "items": [{"title": "string", "description": "string", "icon": "string"}]
    },
    "about": {
      "headline": "string",
      "body": "string",
      "ownerName": "string",
      "ownerRole": "string"
    },
    "testimonials": {
      "items": [{"quote": "string", "name": "string", "role": "string"}]
    },
    "contact": {
      "headline": "string",
      "phone": "string",
      "email": "string",
      "address": "string",
      "hours": "string"
    },
    "cta": {
      "headline": "string",
      "subheadline": "string",
      "buttonText": "string",
      "buttonUrl": "string"
    }
  }'::jsonb,
  '1.0',
  true
)
on conflict (name) do nothing;

insert into public.statxeo_site_template_registry (name, description, supported_packages, pages, slot_schema, renderer_version, is_active)
values (
  'core-default',
  'Multi-page business website. Home, Services, About, Contact pages with full SEO.',
  '{statxeo_core,statxeo_titan}',
  '{home,services,about,contact}',
  '{
    "home": {
      "hero": {"headline": "string", "subheadline": "string", "ctaText": "string"},
      "featuredServices": [{"title": "string", "description": "string"}],
      "socialProof": {"headline": "string", "stats": [{"value": "string", "label": "string"}]}
    },
    "services": {
      "headline": "string",
      "items": [{"title": "string", "description": "string", "features": ["string"]}]
    },
    "about": {
      "headline": "string",
      "story": "string",
      "mission": "string",
      "team": [{"name": "string", "role": "string", "bio": "string"}]
    },
    "contact": {
      "headline": "string",
      "formFields": ["string"],
      "address": "string",
      "phone": "string",
      "email": "string",
      "hours": "string",
      "mapEmbed": "string"
    }
  }'::jsonb,
  '1.0',
  true
)
on conflict (name) do nothing;


-- ────────────────────────────────────────────────────────────────────────────
-- 9. Storage bucket for site assets
--    Note: Supabase storage buckets must be created via the API or dashboard.
--    This comment documents the expected bucket configuration.
-- ────────────────────────────────────────────────────────────────────────────
-- Bucket: statxeo-site-assets
-- Public: false (signed URLs for access)
-- Max file size: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/svg+xml, image/x-icon
-- Folder structure:
--   logos/{project_id}/...
--   photos/{project_id}/...
--   generated/{project_id}/...
--   favicons/{project_id}/...
