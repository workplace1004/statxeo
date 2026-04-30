-- Migration: add vercel_deployment_id to site_projects
-- Needed to promote a preview deployment to production via the Vercel API.

alter table public.statxeo_site_projects
  add column if not exists vercel_deployment_id text;

comment on column public.statxeo_site_projects.vercel_deployment_id
  is 'Vercel deployment ID of the current preview build — used to promote to production';
