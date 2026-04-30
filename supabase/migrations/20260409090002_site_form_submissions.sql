-- Dedicated table for contact form submissions from generated sites.
-- Separate from statxeo_leads (purchase intent) — these are post-launch engagement.

create table if not exists public.statxeo_site_form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.statxeo_site_projects(id) on delete cascade,
  site_token text not null,
  route text not null,
  name text,
  email text,
  phone text,
  message text,
  ip_hash text,
  honeypot_triggered boolean not null default false,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_site_form_submissions_project
  on public.statxeo_site_form_submissions (project_id, submitted_at desc);

create index if not exists idx_site_form_submissions_token
  on public.statxeo_site_form_submissions (site_token, submitted_at desc);

alter table public.statxeo_site_form_submissions enable row level security;

create policy "site_form_submissions_service_role_all"
  on public.statxeo_site_form_submissions
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.statxeo_site_form_submissions
  is 'Contact form submissions from generated client sites. Inserted via /api/public/site-lead.';

comment on column public.statxeo_site_form_submissions.site_token
  is 'Opaque token embedded in the generated site HTML. Identifies the project without exposing the UUID.';
