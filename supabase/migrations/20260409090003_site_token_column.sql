-- Add site_token to statxeo_site_projects.
-- An opaque token embedded in generated site HTML for form submission auth.
-- Generated at project creation time, never exposed as a UUID.

alter table public.statxeo_site_projects
  add column if not exists site_token text;

create unique index if not exists idx_statxeo_site_projects_site_token
  on public.statxeo_site_projects (site_token)
  where site_token is not null;

comment on column public.statxeo_site_projects.site_token
  is 'Opaque token for form submission auth. Embedded in generated site HTML.';
