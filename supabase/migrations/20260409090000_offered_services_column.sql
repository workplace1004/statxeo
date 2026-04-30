-- Add offered_services column to statxeo_site_projects.
-- Distinct from unique_selling_points (trust signals) and service_areas (city targets).
-- offered_services stores the structured list of services the business provides.

alter table public.statxeo_site_projects
  add column if not exists offered_services text[];

comment on column public.statxeo_site_projects.offered_services
  is 'Structured list of services the business offers. Used for Core/Titan service pages.';
