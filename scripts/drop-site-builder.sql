-- Drop all remote tables/functions/triggers created by the statxai
-- website-autogeneration agent.
--
-- Run this once against the remote Supabase database AFTER deleting
-- the local supabase/migrations/2026033109* through 20260409090003
-- files. Order matters: dependent tables first, then parent tables,
-- then helper functions.
--
-- Safe to re-run (uses IF EXISTS).

begin;

-- Dependent tables (FKs into site_projects / generation_jobs)
drop table if exists public.statxeo_site_change_requests           cascade;
drop table if exists public.statxeo_site_generation_artifacts     cascade;
drop table if exists public.statxeo_site_generation_jobs          cascade;
drop table if exists public.statxeo_site_media_assets             cascade;
drop table if exists public.statxeo_site_intake_submissions       cascade;
drop table if exists public.statxeo_site_form_submissions         cascade;

-- Parent tables
drop table if exists public.statxeo_site_projects                 cascade;
drop table if exists public.statxeo_site_template_registry        cascade;

-- updated_at trigger helper functions
drop function if exists public.set_statxeo_site_generation_jobs_updated_at()    cascade;
drop function if exists public.set_statxeo_site_projects_updated_at()           cascade;
drop function if exists public.set_statxeo_site_template_registry_updated_at()  cascade;

commit;
