-- Update lander-default to only support statxeo_lander (was supporting all tiers).
-- Seed core-default and titan-default using ON CONFLICT DO UPDATE.

update public.statxeo_site_template_registry
set supported_packages = '{statxeo_lander}'
where name = 'lander-default';

insert into public.statxeo_site_template_registry (
  name, description, supported_packages, pages, slot_schema, renderer_version, is_active
) values (
  'core-default',
  '4-page business website: Home, Services, About, Contact.',
  '{statxeo_core}',
  '{home,services,about,contact}',
  '{
    "home": { "hero": {}, "featuredServices": [], "aboutPreview": {}, "testimonials": {}, "primaryCta": {} },
    "servicesPage": { "headline": "", "intro": "", "services": [], "faq": [], "cta": {} },
    "aboutPage": { "headline": "", "story": "", "values": [], "ownerName": "", "ownerRole": "", "cta": {} },
    "contactPage": { "headline": "", "intro": "", "formHeadline": "", "formButtonText": "", "cta": {} }
  }'::jsonb,
  '1.0',
  true
)
on conflict (name) do update set
  description = excluded.description,
  supported_packages = excluded.supported_packages,
  pages = excluded.pages,
  slot_schema = excluded.slot_schema,
  renderer_version = excluded.renderer_version,
  is_active = excluded.is_active;

insert into public.statxeo_site_template_registry (
  name, description, supported_packages, pages, slot_schema, renderer_version, is_active
) values (
  'titan-default',
  'Core site + dynamic service detail pages + city/area SEO pages.',
  '{statxeo_titan}',
  '{home,services,about,contact}',
  '{
    "home": {}, "servicesPage": {}, "aboutPage": {}, "contactPage": {},
    "servicePages": [{ "slug": "", "headline": "", "intro": "", "seo": {} }],
    "cityPages": [{ "slug": "", "city": "", "headline": "", "intro": "", "seo": {} }]
  }'::jsonb,
  '1.0',
  true
)
on conflict (name) do update set
  description = excluded.description,
  supported_packages = excluded.supported_packages,
  pages = excluded.pages,
  slot_schema = excluded.slot_schema,
  renderer_version = excluded.renderer_version,
  is_active = excluded.is_active;
