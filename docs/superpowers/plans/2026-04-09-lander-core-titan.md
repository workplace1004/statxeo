# Lander / Core / Titan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the end-to-end AI generation pipeline and customer portal for all three STATXEO website packages (Lander, Core, Titan) so any purchased tier produces a deployed multi-page static site.

**Architecture:** Strict inheritance — Core extends Lander schemas, Titan extends Core schemas. Each tier adds content schemas, renderer functions, and slot mapping on top of the previous tier. Renderers share primitives but Core renders its own home page (it does not spread Lander's output). Titan spreads Core's output and adds dynamic service/city pages. Route-scoped slot maps (`slotsByRoute`) and per-route SEO (`seoByRoute`) replace the current flat structures.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5.7 · Zod · Vercel AI SDK · Supabase (Postgres + RLS + Storage) · Upstash (rate limiting) · pnpm 10 · Vitest (new — added in this plan)

**Spec:** `docs/superpowers/specs/2026-04-09-lander-core-titan-implementation-design.md`

---

## PR 1: Migrations + Intake Schema + Intake API

### Task 1: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install vitest**

Run: `pnpm add -D vitest`

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs**

Run: `pnpm test`

Expected: `No test files found` (clean exit, no errors)

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml
git commit -m "chore: add vitest for unit testing"
```

---

### Task 2: Migration — `offered_services` column

**Files:**
- Create: `supabase/migrations/20260409090000_offered_services_column.sql`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/20260409090000_offered_services_column.sql`:

```sql
-- Add offered_services column to statxeo_site_projects.
-- Distinct from unique_selling_points (trust signals) and service_areas (city targets).
-- offered_services stores the structured list of services the business provides.

alter table public.statxeo_site_projects
  add column if not exists offered_services text[];

comment on column public.statxeo_site_projects.offered_services
  is 'Structured list of services the business offers. Used for Core/Titan service pages.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260409090000_offered_services_column.sql
git commit -m "migration: add offered_services column to site_projects"
```

---

### Task 3: Migration — seed/update Core and Titan templates

**Files:**
- Create: `supabase/migrations/20260409090001_seed_core_titan_templates.sql`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/20260409090001_seed_core_titan_templates.sql`:

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260409090001_seed_core_titan_templates.sql
git commit -m "migration: seed core-default and titan-default templates"
```

---

### Task 4: Migration — `statxeo_site_form_submissions` table

**Files:**
- Create: `supabase/migrations/20260409090002_site_form_submissions.sql`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/20260409090002_site_form_submissions.sql`:

```sql
-- Dedicated table for contact form submissions from generated sites.
-- Separate from statxeo_leads (purchase intent) — these are post-launch engagement.

create table if not exists public.statxeo_site_form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.statxeo_site_projects(id) on delete cascade,
  route text not null,
  name text,
  email text,
  phone text,
  message text,
  ip_hash text,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_site_form_submissions_project
  on public.statxeo_site_form_submissions (project_id, submitted_at desc);

alter table public.statxeo_site_form_submissions enable row level security;

create policy "site_form_submissions_service_role_all"
  on public.statxeo_site_form_submissions
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.statxeo_site_form_submissions
  is 'Contact form submissions from generated client sites. Inserted via /api/public/site-lead.';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260409090002_site_form_submissions.sql
git commit -m "migration: add statxeo_site_form_submissions table"
```

---

### Task 5: Add `offeredServices` to intake schemas

**Files:**
- Modify: `lib/statxai/schemas/intake.ts`
- Create: `lib/statxai/schemas/__tests__/intake.test.ts`

- [ ] **Step 1: Write test for offeredServices validation**

Create `lib/statxai/schemas/__tests__/intake.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { WebsitePreferencesSchema, NormalizedIntakeSchema } from "../intake"

describe("WebsitePreferencesSchema", () => {
  it("accepts valid offeredServices", () => {
    const result = WebsitePreferencesSchema.safeParse({
      offeredServices: ["AC Repair", "Duct Cleaning", "Furnace Install"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offeredServices).toEqual(["AC Repair", "Duct Cleaning", "Furnace Install"])
    }
  })

  it("rejects offeredServices exceeding max 12", () => {
    const result = WebsitePreferencesSchema.safeParse({
      offeredServices: Array.from({ length: 13 }, (_, i) => `Service ${i}`),
    })
    expect(result.success).toBe(false)
  })

  it("trims offeredServices entries", () => {
    const result = WebsitePreferencesSchema.safeParse({
      offeredServices: ["  AC Repair  "],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offeredServices![0]).toBe("AC Repair")
    }
  })

  it("keeps uniqueSellingPoints and offeredServices independent", () => {
    const result = WebsitePreferencesSchema.safeParse({
      uniqueSellingPoints: ["Licensed & Insured"],
      offeredServices: ["AC Repair"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.uniqueSellingPoints).toEqual(["Licensed & Insured"])
      expect(result.data.offeredServices).toEqual(["AC Repair"])
    }
  })
})

describe("NormalizedIntakeSchema", () => {
  const baseIntake = {
    businessName: "Smith HVAC",
    ownerFullName: "John Smith",
    packageTier: "statxeo_core",
  }

  it("accepts offeredServices in normalized intake", () => {
    const result = NormalizedIntakeSchema.safeParse({
      ...baseIntake,
      offeredServices: ["AC Repair", "Heating"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offeredServices).toEqual(["AC Repair", "Heating"])
    }
  })

  it("accepts normalized intake without offeredServices", () => {
    const result = NormalizedIntakeSchema.safeParse(baseIntake)
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

Run: `pnpm test lib/statxai/schemas/__tests__/intake.test.ts`

Expected: FAIL — `offeredServices` not in schema yet

- [ ] **Step 3: Add offeredServices to WebsitePreferencesSchema**

In `lib/statxai/schemas/intake.ts`, add after the `domainPreference` field (line 50, before the closing `)`):

```ts
  offeredServices: z.array(z.string().trim().max(120)).max(12).optional(),
```

- [ ] **Step 4: Add offeredServices to NormalizedIntakeSchema**

In `lib/statxai/schemas/intake.ts`, add after the `socialLinks` field (line 81, before the closing `)`):

```ts
  offeredServices: z.array(z.string()).optional(),
```

- [ ] **Step 5: Run test — expect pass**

Run: `pnpm test lib/statxai/schemas/__tests__/intake.test.ts`

Expected: All 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/statxai/schemas/intake.ts lib/statxai/schemas/__tests__/intake.test.ts
git commit -m "feat: add offeredServices to intake schemas with tests"
```

---

### Task 6: Update normalize-intake agent

**Files:**
- Modify: `lib/statxai/agents/normalize-intake.ts`

- [ ] **Step 1: Add offeredServices to merge block**

In `lib/statxai/agents/normalize-intake.ts`, add to the `raw` object (after line ~44, after the `socialLinks` entry):

```ts
    offeredServices: prefs.offeredServices ?? project.offered_services,
```

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/normalize-intake.ts
git commit -m "feat: normalize offeredServices from preferences into intake"
```

---

### Task 7: Update intake API route

**Files:**
- Modify: `app/api/site-projects/[projectId]/intake/route.ts`

- [ ] **Step 1: Add offeredServices to project updates**

In `app/api/site-projects/[projectId]/intake/route.ts`, add after line 108 (`if (prefs.serviceAreas) ...`):

```ts
  if (prefs.offeredServices) projectUpdates.offered_services = prefs.offeredServices
```

- [ ] **Step 2: Commit**

```bash
git add app/api/site-projects/[projectId]/intake/route.ts
git commit -m "feat: persist offeredServices via intake API"
```

---

### Task 8: Update load-project agent to fetch offered_services

**Files:**
- Modify: `lib/statxai/agents/load-project.ts`

- [ ] **Step 1: Add offered_services to select query**

In `lib/statxai/agents/load-project.ts`, add `offered_services` to the `.select()` column list (after `service_areas` on ~line 22):

```ts
      offered_services,
```

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/load-project.ts
git commit -m "feat: load offered_services in project snapshot"
```

---

### Task 9: Fix dev seed to use real tiers

**Files:**
- Modify: `app/api/dev/seed-demo-project/route.ts`

- [ ] **Step 1: Replace statxeo_thin with statxeo_lander**

In `app/api/dev/seed-demo-project/route.ts`, replace both occurrences of `"statxeo_thin"` with `"statxeo_lander"`:

Line ~64 in the lead insert:
```ts
      package_tier: "statxeo_lander",
```

Line ~128 in the `createProject` function:
```ts
      package_tier: "statxeo_lander",
```

- [ ] **Step 2: Commit**

```bash
git add app/api/dev/seed-demo-project/route.ts
git commit -m "fix: use statxeo_lander instead of invalid statxeo_thin in dev seed"
```

---

### Task 10: Update index exports

**Files:**
- Modify: `lib/statxai/index.ts`

- [ ] **Step 1: Add new type exports**

In `lib/statxai/index.ts`, add after the existing exports:

```ts
export type { CoreContent } from "./schemas/core-content"
export type { TitanContent } from "./schemas/titan-content"
```

Note: these files don't exist yet — they'll be created in PR 2. Add the exports now so they're ready. If TypeScript complains during build, that's expected until PR 2 lands. For now, **skip this step** — it will be done in PR 2, Task 12.

- [ ] **Step 2: Commit PR 1**

Review all changes:
```bash
git log --oneline main..HEAD
```

Expected: ~8 commits covering vitest, 3 migrations, intake schema, normalize-intake, intake API, load-project, dev seed fix.

---

## PR 2: Content Schemas + Prompt/Schema Routing + Slug Generation

### Task 11: Slug utility with tests

**Files:**
- Create: `lib/statxai/utils/slugify.ts`
- Create: `lib/statxai/utils/__tests__/slugify.test.ts`

- [ ] **Step 1: Write slug tests**

Create `lib/statxai/utils/__tests__/slugify.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { slugify, dedupeSlugList } from "../slugify"

describe("slugify", () => {
  it("lowercases and replaces non-alphanumeric with hyphens", () => {
    expect(slugify("AC Repair")).toBe("ac-repair")
  })

  it("handles slashes", () => {
    expect(slugify("A/C Repair")).toBe("a-c-repair")
  })

  it("handles commas and state abbreviations", () => {
    expect(slugify("Austin, TX")).toBe("austin-tx")
  })

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world")
  })

  it("collapses consecutive hyphens", () => {
    expect(slugify("one   two---three")).toBe("one-two-three")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })
})

describe("dedupeSlugList", () => {
  it("returns unique slugs from distinct inputs", () => {
    const result = dedupeSlugList(["AC Repair", "Heating"])
    expect(result).toEqual([
      { original: "AC Repair", slug: "ac-repair" },
      { original: "Heating", slug: "heating" },
    ])
  })

  it("deduplicates colliding slugs", () => {
    const result = dedupeSlugList(["AC Repair", "AC Repair"])
    expect(result).toEqual([
      { original: "AC Repair", slug: "ac-repair" },
      { original: "AC Repair", slug: "ac-repair-1" },
    ])
  })

  it("deduplicates near-collisions", () => {
    const result = dedupeSlugList(["Austin TX", "Austin, TX"])
    expect(result).toEqual([
      { original: "Austin TX", slug: "austin-tx" },
      { original: "Austin, TX", slug: "austin-tx-1" },
    ])
  })

  it("handles empty array", () => {
    expect(dedupeSlugList([])).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

Run: `pnpm test lib/statxai/utils/__tests__/slugify.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement slugify**

Create `lib/statxai/utils/slugify.ts`:

```ts
/**
 * Deterministic slug generation. Used before prompting so the LLM
 * receives canonical slugs as input and echoes them back.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export type SlugEntry = { original: string; slug: string }

/**
 * Generate unique slugs from a list of display names.
 * Appends `-1`, `-2`, etc. for collisions.
 */
export function dedupeSlugList(inputs: string[]): SlugEntry[] {
  const seen = new Map<string, number>()
  return inputs.map((input) => {
    const base = slugify(input)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return { original: input, slug: count === 0 ? base : `${base}-${count}` }
  })
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm test lib/statxai/utils/__tests__/slugify.test.ts`

Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/statxai/utils/slugify.ts lib/statxai/utils/__tests__/slugify.test.ts
git commit -m "feat: add deterministic slug generation with deduplication"
```

---

### Task 12: CoreContentSchema

**Files:**
- Create: `lib/statxai/schemas/core-content.ts`
- Create: `lib/statxai/schemas/__tests__/core-content.test.ts`

- [ ] **Step 1: Write test for CoreContentSchema**

Create `lib/statxai/schemas/__tests__/core-content.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { CoreContentSchema } from "../core-content"

const validCoreContent = {
  home: {
    hero: {
      headline: "Professional HVAC You Can Trust",
      subheadline: "Fast reliable service for your home and business in the Austin area.",
      ctaText: "Book Now",
      ctaUrl: "tel:5551234567",
      backgroundImagePrompt: "professional hvac technician working on AC unit",
    },
    featuredServices: [
      { slug: "ac-repair", title: "AC Repair", shortDescription: "Fast AC diagnostics and repair.", icon: "wrench" },
      { slug: "heating", title: "Heating", shortDescription: "Furnace and heat pump service.", icon: "zap" },
      { slug: "duct-cleaning", title: "Duct Cleaning", shortDescription: "Complete duct system cleaning.", icon: "leaf" },
    ],
    aboutPreview: { headline: "About Us", body: "Serving the Austin area for over 15 years." },
    testimonials: {
      headline: "What Our Clients Say",
      items: [
        { quote: "Fixed our AC same day. Great service.", name: "Sarah M.", role: "Homeowner" },
        { quote: "Professional and affordable. Highly recommend.", name: "Mike T.", role: "Business Owner" },
      ],
    },
    primaryCta: {
      headline: "Ready to get started?",
      subheadline: "Call us today for a free estimate.",
      buttonText: "Call Now",
      buttonUrl: "tel:5551234567",
    },
  },
  servicesPage: {
    headline: "Our Services",
    intro: "We provide comprehensive HVAC solutions for residential and commercial customers.",
    services: [
      {
        slug: "ac-repair",
        title: "AC Repair",
        shortDescription: "Fast AC diagnostics and repair.",
        longDescription: "Our certified technicians diagnose and repair all AC brands and models with same-day service availability.",
        bulletPoints: ["Same-day service", "All brands", "Warranty included"],
        priceHint: null,
        icon: "wrench",
      },
      {
        slug: "heating",
        title: "Heating",
        shortDescription: "Furnace and heat pump service.",
        longDescription: "Full heating system service including furnaces, heat pumps, and radiant heating installations and repairs.",
        bulletPoints: ["Free estimates", "Energy efficient", "Licensed techs"],
        priceHint: null,
        icon: "zap",
      },
      {
        slug: "duct-cleaning",
        title: "Duct Cleaning",
        shortDescription: "Complete duct system cleaning.",
        longDescription: "Professional duct cleaning to improve air quality and HVAC efficiency for your home or office.",
        bulletPoints: ["Improves air quality", "Reduces allergens", "Full system clean"],
        priceHint: "$199+",
        icon: "leaf",
      },
    ],
    faq: [
      { question: "How often should I service my AC?", answer: "We recommend annual maintenance for optimal performance." },
      { question: "Do you offer emergency service?", answer: "Yes, we offer 24/7 emergency HVAC service." },
    ],
    cta: { headline: "Need service?", subheadline: "Contact us today.", buttonText: "Get a Quote", buttonUrl: "#contact" },
  },
  aboutPage: {
    headline: "About Smith HVAC",
    story: "Founded in 2010 by John Smith, our company has grown from a one-person operation to a full-service HVAC provider serving the greater Austin area.",
    values: ["Reliability", "Transparency", "Quality"],
    ownerName: "John Smith",
    ownerRole: "Owner & Lead Technician",
    cta: { headline: "Work with us", subheadline: "Get started today.", buttonText: "Contact Us", buttonUrl: "/contact/" },
  },
  contactPage: {
    headline: "Contact Us",
    intro: "We are here to help with all your HVAC needs.",
    phoneLabel: "(555) 123-4567",
    emailLabel: "info@smithhvac.com",
    addressLabel: "123 Main St, Austin, TX 78701",
    hoursLabel: "Mon-Fri 8am-6pm",
    formHeadline: "Send Us a Message",
    formButtonText: "Send Message",
    cta: { headline: "Call us now", subheadline: "Fast response guaranteed.", buttonText: "Call Now", buttonUrl: "tel:5551234567" },
  },
}

describe("CoreContentSchema", () => {
  it("validates a complete Core content object", () => {
    const result = CoreContentSchema.safeParse(validCoreContent)
    expect(result.success).toBe(true)
  })

  it("rejects missing servicesPage", () => {
    const { servicesPage, ...incomplete } = validCoreContent
    const result = CoreContentSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
  })

  it("rejects missing aboutPage", () => {
    const { aboutPage, ...incomplete } = validCoreContent
    const result = CoreContentSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
  })

  it("rejects missing contactPage", () => {
    const { contactPage, ...incomplete } = validCoreContent
    const result = CoreContentSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
  })

  it("rejects fewer than 3 services on servicesPage", () => {
    const bad = {
      ...validCoreContent,
      servicesPage: {
        ...validCoreContent.servicesPage,
        services: validCoreContent.servicesPage.services.slice(0, 2),
      },
    }
    const result = CoreContentSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

Run: `pnpm test lib/statxai/schemas/__tests__/core-content.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement CoreContentSchema**

Create `lib/statxai/schemas/core-content.ts`:

```ts
import { z } from "zod"
import {
  LanderHeroSchema,
  LanderTestimonialsSchema,
  LanderCtaSchema,
} from "./lander-content"

// ─── Shared sub-schemas ──────────────────────────────────────────────────────

export const FaqItemSchema = z.object({
  question: z.string().describe("FAQ question"),
  answer: z.string().describe("FAQ answer"),
})

export type FaqItem = z.infer<typeof FaqItemSchema>

export const CoreFeaturedServiceSchema = z.object({
  slug: z.string().describe("Kebab-case slug, e.g. 'ac-repair'. Must match a pre-provided canonical slug."),
  title: z.string().describe("Service name, 2-5 words"),
  shortDescription: z.string().describe("20-40 word summary"),
  icon: z.string().describe("Lucide icon name, e.g. 'wrench', 'zap'"),
})

export type CoreFeaturedService = z.infer<typeof CoreFeaturedServiceSchema>

export const CoreServiceDetailSchema = CoreFeaturedServiceSchema.extend({
  longDescription: z.string().describe("60-120 word detailed description"),
  bulletPoints: z.array(z.string()).min(3).max(6).optional(),
  priceHint: z.string().nullable().describe("Price hint like '$199+' or null"),
})

export type CoreServiceDetail = z.infer<typeof CoreServiceDetailSchema>

// ─── Core page schemas ───────────────────────────────────────────────────────

export const CoreHomeSchema = z.object({
  hero: LanderHeroSchema,
  featuredServices: z.array(CoreFeaturedServiceSchema).min(3).max(6),
  aboutPreview: z.object({
    headline: z.string(),
    body: z.string().describe("30-60 word preview"),
  }),
  testimonials: LanderTestimonialsSchema,
  primaryCta: LanderCtaSchema,
})

export const CoreServicesPageSchema = z.object({
  headline: z.string().describe("Section heading, 3-8 words"),
  intro: z.string().describe("30-60 word section intro"),
  services: z.array(CoreServiceDetailSchema).min(3).max(12),
  faq: z.array(FaqItemSchema).min(2).max(6).optional(),
  cta: LanderCtaSchema,
})

export const CoreAboutPageSchema = z.object({
  headline: z.string(),
  story: z.string().describe("80-150 word business story"),
  values: z.array(z.string()).max(6).optional(),
  ownerName: z.string(),
  ownerRole: z.string().describe("e.g. 'Owner & Lead Technician'"),
  cta: LanderCtaSchema,
})

export const CoreContactPageSchema = z.object({
  headline: z.string(),
  intro: z.string(),
  phoneLabel: z.string(),
  emailLabel: z.string(),
  addressLabel: z.string(),
  hoursLabel: z.string(),
  formHeadline: z.string(),
  formButtonText: z.string(),
  cta: LanderCtaSchema,
})

// ─── Full Core content schema ────────────────────────────────────────────────

export const CoreContentSchema = z.object({
  home: CoreHomeSchema,
  servicesPage: CoreServicesPageSchema,
  aboutPage: CoreAboutPageSchema,
  contactPage: CoreContactPageSchema,
})

export type CoreContent = z.infer<typeof CoreContentSchema>
```

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm test lib/statxai/schemas/__tests__/core-content.test.ts`

Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/statxai/schemas/core-content.ts lib/statxai/schemas/__tests__/core-content.test.ts
git commit -m "feat: add CoreContentSchema for 4-page business sites"
```

---

### Task 13: TitanContentSchema

**Files:**
- Create: `lib/statxai/schemas/titan-content.ts`
- Create: `lib/statxai/schemas/__tests__/titan-content.test.ts`

- [ ] **Step 1: Write test for TitanContentSchema**

Create `lib/statxai/schemas/__tests__/titan-content.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { TitanContentSchema } from "../titan-content"

// Build a valid Titan content object (Core base + service pages + city pages)
const validCorePart = {
  home: {
    hero: { headline: "Pro HVAC", subheadline: "Serving Austin.", ctaText: "Book", ctaUrl: "tel:555", backgroundImagePrompt: "hvac tech" },
    featuredServices: [
      { slug: "ac-repair", title: "AC Repair", shortDescription: "Fast AC fix.", icon: "wrench" },
      { slug: "heating", title: "Heating", shortDescription: "Heating service.", icon: "zap" },
      { slug: "ducts", title: "Duct Cleaning", shortDescription: "Clean ducts.", icon: "leaf" },
    ],
    aboutPreview: { headline: "About", body: "Serving Austin for 15 years." },
    testimonials: { headline: "Reviews", items: [{ quote: "Great work.", name: "A. B.", role: "Homeowner" }, { quote: "Fast.", name: "C. D.", role: "Owner" }] },
    primaryCta: { headline: "Ready?", subheadline: "Call today.", buttonText: "Call", buttonUrl: "tel:555" },
  },
  servicesPage: {
    headline: "Services", intro: "Our services.", cta: { headline: "Get help", subheadline: "Contact us.", buttonText: "Contact", buttonUrl: "/contact/" },
    services: [
      { slug: "ac-repair", title: "AC Repair", shortDescription: "Fast.", longDescription: "We fix all brands of AC units with certified technicians.", bulletPoints: ["Fast", "Reliable", "Affordable"], priceHint: null, icon: "wrench" },
      { slug: "heating", title: "Heating", shortDescription: "Heat.", longDescription: "Full heating service for furnaces, heat pumps, and more.", bulletPoints: ["Licensed", "Insured", "Quality"], priceHint: null, icon: "zap" },
      { slug: "ducts", title: "Ducts", shortDescription: "Clean.", longDescription: "Professional duct cleaning for better air and efficiency.", bulletPoints: ["Air quality", "Efficiency", "Clean"], priceHint: "$199+", icon: "leaf" },
    ],
  },
  aboutPage: { headline: "About Us", story: "Founded in 2010, we have grown to serve the entire Austin metro.", ownerName: "John", ownerRole: "Owner", cta: { headline: "Join us", subheadline: ".", buttonText: "Contact", buttonUrl: "/contact/" } },
  contactPage: { headline: "Contact", intro: "Reach out.", phoneLabel: "555", emailLabel: "a@b.com", addressLabel: "123 Main", hoursLabel: "8-6", formHeadline: "Message", formButtonText: "Send", cta: { headline: "Call", subheadline: ".", buttonText: "Call", buttonUrl: "tel:555" } },
}

const validTitan = {
  ...validCorePart,
  servicePages: [
    {
      slug: "ac-repair", serviceName: "AC Repair", headline: "Expert AC Repair in Austin",
      intro: "We provide top-tier AC repair.", whyChooseUs: "Licensed and insured with 15 years experience.",
      process: ["Diagnose", "Quote", "Repair"], faqs: [{ question: "How fast?", answer: "Same day." }, { question: "Cost?", answer: "Free estimates." }],
      cta: { headline: "Need repair?", subheadline: "Call now.", buttonText: "Call", buttonUrl: "tel:555" },
      seo: { title: "AC Repair Austin | Smith HVAC", description: "Expert AC repair in Austin TX." },
    },
  ],
  cityPages: [
    {
      slug: "austin-tx", city: "Austin TX", state: "TX",
      headline: "HVAC Services in Austin TX", intro: "Trusted HVAC provider serving Austin and surrounding areas.",
      localTrustSection: "We have served Austin TX for over 15 years with thousands of satisfied customers.",
      featuredServices: [{ title: "AC Repair", summary: "Fast AC repair.", href: "/services/ac-repair/" }],
      faqs: [{ question: "Do you serve Austin?", answer: "Yes, we are based in Austin." }],
      cta: { headline: "Austin service", subheadline: "Call us.", buttonText: "Call", buttonUrl: "tel:555" },
      seo: { title: "HVAC Austin TX | Smith HVAC", description: "HVAC service in Austin TX." },
    },
  ],
}

describe("TitanContentSchema", () => {
  it("validates complete Titan content", () => {
    const result = TitanContentSchema.safeParse(validTitan)
    expect(result.success).toBe(true)
  })

  it("includes all Core fields", () => {
    const result = TitanContentSchema.safeParse(validTitan)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.home).toBeDefined()
      expect(result.data.servicesPage).toBeDefined()
      expect(result.data.aboutPage).toBeDefined()
      expect(result.data.contactPage).toBeDefined()
    }
  })

  it("rejects missing servicePages", () => {
    const { servicePages, ...bad } = validTitan
    const result = TitanContentSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it("rejects missing cityPages", () => {
    const { cityPages, ...bad } = validTitan
    const result = TitanContentSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it("rejects city page without localTrustSection", () => {
    const bad = {
      ...validTitan,
      cityPages: [{ ...validTitan.cityPages[0], localTrustSection: undefined }],
    }
    const result = TitanContentSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it("requires seo on each service page", () => {
    const bad = {
      ...validTitan,
      servicePages: [{ ...validTitan.servicePages[0], seo: undefined }],
    }
    const result = TitanContentSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

Run: `pnpm test lib/statxai/schemas/__tests__/titan-content.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement TitanContentSchema**

Create `lib/statxai/schemas/titan-content.ts`:

```ts
import { z } from "zod"
import { LanderCtaSchema } from "./lander-content"
import { CoreContentSchema, FaqItemSchema } from "./core-content"

// ─── Titan-specific page schemas ─────────────────────────────────────────────

const TitanServicePageSeoSchema = z.object({
  title: z.string().max(60).describe("Unique page title for this service"),
  description: z.string().max(160).describe("Unique meta description for this service"),
})

export const TitanServicePageSchema = z.object({
  slug: z.string().describe("Must exactly match a pre-provided canonical service slug"),
  serviceName: z.string(),
  headline: z.string().describe("5-12 words, SEO-primary H1"),
  intro: z.string().describe("40-80 word service introduction"),
  whyChooseUs: z.string().describe("40-80 words on differentiators"),
  process: z.array(z.string()).optional().describe("Ordered process steps"),
  faqs: z.array(FaqItemSchema).min(2).max(5).optional(),
  cta: LanderCtaSchema,
  seo: TitanServicePageSeoSchema,
})

export type TitanServicePage = z.infer<typeof TitanServicePageSchema>

const TitanCityPageSeoSchema = z.object({
  title: z.string().max(60).describe("Unique page title for this city"),
  description: z.string().max(160).describe("Unique meta description for this city"),
})

export const TitanCityPageSchema = z.object({
  slug: z.string().describe("Must exactly match a pre-provided canonical city slug, e.g. 'austin-tx'"),
  city: z.string().describe("Display name, e.g. 'Austin TX'"),
  state: z.string().optional(),
  headline: z.string().describe("5-12 words, city-specific H1"),
  intro: z.string().describe("60-120 words with local context"),
  localTrustSection: z.string().describe("40-80 words about serving this specific city. Must mention the city name."),
  featuredServices: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        href: z.string().describe("Link to /services/[slug]/"),
      }),
    )
    .min(2)
    .max(6),
  faqs: z.array(FaqItemSchema).optional(),
  cta: LanderCtaSchema,
  seo: TitanCityPageSeoSchema,
})

export type TitanCityPage = z.infer<typeof TitanCityPageSchema>

// ─── Full Titan content schema (extends Core) ────────────────────────────────

export const TitanContentSchema = CoreContentSchema.extend({
  servicePages: z.array(TitanServicePageSchema).min(1).max(12),
  cityPages: z.array(TitanCityPageSchema).min(1).max(20),
})

export type TitanContent = z.infer<typeof TitanContentSchema>
```

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm test lib/statxai/schemas/__tests__/titan-content.test.ts`

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/statxai/schemas/titan-content.ts lib/statxai/schemas/__tests__/titan-content.test.ts
git commit -m "feat: add TitanContentSchema extending Core with service/city pages"
```

---

### Task 14: Schema selector utility

**Files:**
- Create: `lib/statxai/schemas/index.ts`
- Create: `lib/statxai/schemas/__tests__/select-schema.test.ts`

- [ ] **Step 1: Write test**

Create `lib/statxai/schemas/__tests__/select-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { selectContentSchema } from "../index"
import { LanderContentSchema } from "../lander-content"
import { CoreContentSchema } from "../core-content"
import { TitanContentSchema } from "../titan-content"

describe("selectContentSchema", () => {
  it("returns LanderContentSchema for lander-default", () => {
    expect(selectContentSchema("lander-default")).toBe(LanderContentSchema)
  })

  it("returns CoreContentSchema for core-default", () => {
    expect(selectContentSchema("core-default")).toBe(CoreContentSchema)
  })

  it("returns TitanContentSchema for titan-default", () => {
    expect(selectContentSchema("titan-default")).toBe(TitanContentSchema)
  })

  it("defaults to LanderContentSchema for unknown template", () => {
    expect(selectContentSchema("unknown")).toBe(LanderContentSchema)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

Run: `pnpm test lib/statxai/schemas/__tests__/select-schema.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement selector**

Create `lib/statxai/schemas/index.ts`:

```ts
import { type ZodType } from "zod"
import { LanderContentSchema } from "./lander-content"
import { CoreContentSchema } from "./core-content"
import { TitanContentSchema } from "./titan-content"

export { LanderContentSchema } from "./lander-content"
export { CoreContentSchema } from "./core-content"
export { TitanContentSchema } from "./titan-content"
export { FaqItemSchema } from "./core-content"

/**
 * Select the correct content schema for a template name.
 * Code-first — the DB slot_schema is metadata only.
 */
export function selectContentSchema(templateName: string): ZodType {
  switch (templateName) {
    case "titan-default":
      return TitanContentSchema
    case "core-default":
      return CoreContentSchema
    case "lander-default":
    default:
      return LanderContentSchema
  }
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm test lib/statxai/schemas/__tests__/select-schema.test.ts`

Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/statxai/schemas/index.ts lib/statxai/schemas/__tests__/select-schema.test.ts
git commit -m "feat: add selectContentSchema dispatcher for template routing"
```

---

### Task 15: Update resolve-template for Titan

**Files:**
- Modify: `lib/statxai/agents/resolve-template.ts`

- [ ] **Step 1: Fix Titan mapping**

In `lib/statxai/agents/resolve-template.ts`, change the `PACKAGE_TEMPLATE_DEFAULTS` constant (line ~19):

```ts
const PACKAGE_TEMPLATE_DEFAULTS: Record<string, string> = {
  statxeo_lander: "lander-default",
  statxeo_core: "core-default",
  statxeo_titan: "titan-default",
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/resolve-template.ts
git commit -m "fix: map statxeo_titan to titan-default template"
```

---

### Task 16: Update generate-content with schema routing

**Files:**
- Modify: `lib/statxai/agents/generate-content.ts`

- [ ] **Step 1: Replace selectSchema with imported selectContentSchema**

In `lib/statxai/agents/generate-content.ts`:

Replace the `selectSchema` function (lines ~47-55) and its import with:

Add import at top:
```ts
import { selectContentSchema } from "../schemas"
```

Replace the `selectSchema` function call on line ~30:
```ts
  const schema = selectContentSchema(template.name)
```

Delete the old `selectSchema` function at the bottom of the file.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/generate-content.ts
git commit -m "feat: route content generation schema by template name"
```

---

### Task 17: Update validate-output with schema routing

**Files:**
- Modify: `lib/statxai/agents/validate-output.ts`

- [ ] **Step 1: Replace selectSchema with imported selectContentSchema**

In `lib/statxai/agents/validate-output.ts`:

Add import at top:
```ts
import { selectContentSchema } from "../schemas"
```

Replace line ~14:
```ts
  const schema = selectContentSchema(artifact.template.name)
```

Delete the old `selectSchema` function at the bottom.

Delete the old `LanderContentSchema` import.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/validate-output.ts
git commit -m "feat: route output validation schema by template name"
```

---

### Task 18: Refactor assemble-prompt for code-first schemas and slug injection

**Files:**
- Modify: `lib/statxai/agents/assemble-prompt.ts`

- [ ] **Step 1: Update imports**

In `lib/statxai/agents/assemble-prompt.ts`, add at top:

```ts
import { selectContentSchema } from "../schemas"
import { dedupeSlugList } from "../utils/slugify"
import { zodToJsonSchema } from "zod-to-json-schema"
```

Note: Install `zod-to-json-schema` first:

Run: `pnpm add zod-to-json-schema`

- [ ] **Step 2: Refactor buildUserPrompt to use code-first schema**

Replace the end of `buildUserPrompt` (the `lines.push("Output Schema:")` section) with:

```ts
  // Code-first schema — derive from Zod, not from DB slot_schema
  const schema = selectContentSchema(template.name)
  const jsonSchema = zodToJsonSchema(schema, { name: "content", nameStrategy: "title" })
  lines.push("")
  lines.push(`Template: ${template.name}`)
  lines.push(`Pages: ${template.pages.join(", ")}`)
  lines.push("")
  lines.push("Output Schema:")
  lines.push(JSON.stringify(jsonSchema, null, 2))
```

- [ ] **Step 3: Add Titan-specific slug injection**

In `buildUserPrompt`, after the service areas section, add:

```ts
  // Deterministic slugs for Titan — LLM must echo these exactly
  if (template.name === "titan-default" || template.name === "core-default") {
    if (intake.offeredServices && intake.offeredServices.length > 0) {
      const serviceSlugs = dedupeSlugList(intake.offeredServices)
      lines.push("")
      lines.push("Service slugs (use these exact slugs in your output):")
      for (const { original, slug } of serviceSlugs) {
        lines.push(`- "${original}" → slug: "${slug}"`)
      }
    }
  }

  if (template.name === "titan-default") {
    if (intake.serviceAreas && intake.serviceAreas.length > 0) {
      const citySlugs = dedupeSlugList(intake.serviceAreas)
      lines.push("")
      lines.push("City slugs (use these exact slugs in your output):")
      for (const { original, slug } of citySlugs) {
        lines.push(`- "${original}" → slug: "${slug}"`)
      }
      lines.push("")
      lines.push("Generate one cityPage entry per city above.")
      lines.push("Each city page must have a unique intro, unique localTrustSection mentioning the city,")
      lines.push("and at least one unique FAQ or different service emphasis.")
    }
  }
```

- [ ] **Step 4: Commit**

```bash
git add lib/statxai/agents/assemble-prompt.ts package.json pnpm-lock.yaml
git commit -m "feat: code-first schema in prompts + slug injection for Core/Titan"
```

---

### Task 19: Update index exports with new types

**Files:**
- Modify: `lib/statxai/index.ts`

- [ ] **Step 1: Add Core and Titan type exports**

Add to `lib/statxai/index.ts`:

```ts
export type { CoreContent } from "./schemas/core-content"
export type { TitanContent, TitanServicePage, TitanCityPage } from "./schemas/titan-content"
export type { FaqItem } from "./schemas/core-content"
```

- [ ] **Step 2: Commit PR 2**

```bash
git add lib/statxai/index.ts
git commit -m "feat: export Core and Titan content types"
```

Review: `git log --oneline main..HEAD` — should show ~10 commits across PR 1 and PR 2.

---

## PR 3: Titan Batching + Validation

### Task 20: Titan multi-call generation in generate-content

**Files:**
- Modify: `lib/statxai/agents/generate-content.ts`

- [ ] **Step 1: Implement Titan batching**

In `lib/statxai/agents/generate-content.ts`, replace the single `generateObject` call with tier-aware logic.

Replace the body of `generateContent` after reading the artifact:

```ts
export async function generateContent(ctx: JobContext): Promise<void> {
  const artifact = await readArtifact<{
    normalizedIntake: NormalizedIntake
    template: { name: string; slotSchema: unknown; pages: string[] }
    systemPrompt: string
    userPrompt: string
  }>(ctx.projectId, "generated_copy")

  const { systemPrompt, userPrompt, template } = artifact
  const modelId = process.env.AI_MODEL ?? DEFAULT_MODEL

  let output: unknown
  let totalInputTokens = 0
  let totalOutputTokens = 0

  if (template.name === "titan-default") {
    // Titan: multi-call batching inside one stage
    output = await generateTitanContent(
      systemPrompt,
      userPrompt,
      modelId,
      (input, out) => {
        totalInputTokens += input
        totalOutputTokens += out
      },
    )
  } else {
    // Lander and Core: single call
    const schema = selectContentSchema(template.name)
    const result = await generateObject({
      model: openai(modelId),
      schema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.4,
    })
    output = result.object
    totalInputTokens = result.usage?.inputTokens ?? 0
    totalOutputTokens = result.usage?.outputTokens ?? 0
  }

  await updateTokenUsage(ctx.jobId, totalInputTokens, totalOutputTokens, modelId)

  await writeArtifact(ctx.jobId, ctx.projectId, "generated_copy", {
    ...artifact,
    rawOutput: output,
    generatedAt: new Date().toISOString(),
    modelId,
  })
}
```

- [ ] **Step 2: Add generateTitanContent function**

Add to the same file:

```ts
import { CoreContentSchema } from "../schemas/core-content"
import { TitanServicePageSchema, TitanCityPageSchema } from "../schemas/titan-content"

async function generateTitanContent(
  systemPrompt: string,
  userPrompt: string,
  modelId: string,
  trackTokens: (input: number, output: number) => void,
): Promise<unknown> {
  // Call 1: generate Core base content
  const baseResult = await generateObject({
    model: openai(modelId),
    schema: CoreContentSchema,
    system: systemPrompt,
    prompt: userPrompt + "\n\nGenerate the base site content (home, servicesPage, aboutPage, contactPage) only. Do not generate servicePages or cityPages.",
    temperature: 0.4,
  })
  trackTokens(baseResult.usage?.inputTokens ?? 0, baseResult.usage?.outputTokens ?? 0)

  // Call 2: generate service detail pages
  const serviceResult = await generateObject({
    model: openai(modelId),
    schema: z.object({ servicePages: z.array(TitanServicePageSchema).min(1).max(12) }),
    system: systemPrompt,
    prompt: userPrompt + "\n\nGenerate the servicePages array only. One entry per service slug listed above. Reference the base site content for consistency.",
    temperature: 0.4,
  })
  trackTokens(serviceResult.usage?.inputTokens ?? 0, serviceResult.usage?.outputTokens ?? 0)

  // Call 3: generate city pages (batch if >10)
  const cityResult = await generateObject({
    model: openai(modelId),
    schema: z.object({ cityPages: z.array(TitanCityPageSchema).min(1).max(20) }),
    system: systemPrompt,
    prompt: userPrompt + "\n\nGenerate the cityPages array only. One entry per city slug listed above. Each city page must be unique — do not reuse intro or FAQ text across cities.",
    temperature: 0.4,
  })
  trackTokens(cityResult.usage?.inputTokens ?? 0, cityResult.usage?.outputTokens ?? 0)

  // Assemble into TitanContent shape
  return {
    ...baseResult.object,
    servicePages: serviceResult.object.servicePages,
    cityPages: cityResult.object.cityPages,
  }
}
```

Add `z` import at top:
```ts
import { z } from "zod"
```

- [ ] **Step 3: Commit**

```bash
git add lib/statxai/agents/generate-content.ts
git commit -m "feat: Titan multi-call batching in generate-content stage"
```

---

### Task 21: Titan validation — slug checks and city uniqueness

**Files:**
- Modify: `lib/statxai/agents/validate-output.ts`
- Create: `lib/statxai/agents/__tests__/validate-titan.test.ts`

- [ ] **Step 1: Write Titan validation tests**

Create `lib/statxai/agents/__tests__/validate-titan.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { validateTitanSlugs, validateCityUniqueness } from "../validate-output"

describe("validateTitanSlugs", () => {
  it("passes when all slugs match canonical list", () => {
    const canonicalServices = ["ac-repair", "heating"]
    const canonicalCities = ["austin-tx", "round-rock-tx"]
    const servicePages = [{ slug: "ac-repair" }, { slug: "heating" }]
    const cityPages = [{ slug: "austin-tx" }, { slug: "round-rock-tx" }]

    expect(() => validateTitanSlugs(servicePages, cityPages, canonicalServices, canonicalCities)).not.toThrow()
  })

  it("throws when service slug does not match", () => {
    const servicePages = [{ slug: "ac-repair" }, { slug: "plumbing" }]
    const cityPages: Array<{ slug: string }> = []

    expect(() => validateTitanSlugs(servicePages, cityPages, ["ac-repair", "heating"], [])).toThrow("plumbing")
  })

  it("throws when city slug does not match", () => {
    const servicePages: Array<{ slug: string }> = []
    const cityPages = [{ slug: "dallas-tx" }]

    expect(() => validateTitanSlugs(servicePages, cityPages, [], ["austin-tx"])).toThrow("dallas-tx")
  })
})

describe("validateCityUniqueness", () => {
  it("passes when city pages are unique", () => {
    const pages = [
      { slug: "austin-tx", city: "Austin TX", intro: "We serve the Austin area with top-notch HVAC repair and maintenance services.", localTrustSection: "Serving Austin TX for 15 years." },
      { slug: "round-rock-tx", city: "Round Rock TX", intro: "Round Rock residents trust us for all their heating and cooling needs.", localTrustSection: "Proud to serve Round Rock TX." },
    ]
    expect(() => validateCityUniqueness(pages)).not.toThrow()
  })

  it("throws when city pages have near-identical intros", () => {
    const pages = [
      { slug: "austin-tx", city: "Austin TX", intro: "We serve the area with great HVAC service.", localTrustSection: "Serving Austin TX." },
      { slug: "round-rock-tx", city: "Round Rock TX", intro: "We serve the area with great HVAC service.", localTrustSection: "Serving Round Rock TX." },
    ]
    expect(() => validateCityUniqueness(pages)).toThrow("uniqueness")
  })

  it("throws when localTrustSection does not mention city name", () => {
    const pages = [
      { slug: "austin-tx", city: "Austin TX", intro: "Unique intro for this city.", localTrustSection: "We have served for over 15 years." },
    ]
    expect(() => validateCityUniqueness(pages)).toThrow("Austin TX")
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

Run: `pnpm test lib/statxai/agents/__tests__/validate-titan.test.ts`

Expected: FAIL

- [ ] **Step 3: Add validation functions to validate-output.ts**

In `lib/statxai/agents/validate-output.ts`, add these exported functions:

```ts
/**
 * Validate that every slug in the Titan output matches the pre-computed canonical list.
 */
export function validateTitanSlugs(
  servicePages: Array<{ slug: string }>,
  cityPages: Array<{ slug: string }>,
  canonicalServiceSlugs: string[],
  canonicalCitySlugs: string[],
): void {
  const serviceSet = new Set(canonicalServiceSlugs)
  for (const sp of servicePages) {
    if (!serviceSet.has(sp.slug)) {
      throw new Error(`Service page slug "${sp.slug}" does not match any canonical slug. Expected one of: ${canonicalServiceSlugs.join(", ")}`)
    }
  }

  const citySet = new Set(canonicalCitySlugs)
  for (const cp of cityPages) {
    if (!citySet.has(cp.slug)) {
      throw new Error(`City page slug "${cp.slug}" does not match any canonical slug. Expected one of: ${canonicalCitySlugs.join(", ")}`)
    }
  }
}

/**
 * Validate Titan city page uniqueness.
 * Each page must have a unique intro and localTrustSection must mention the city name.
 */
export function validateCityUniqueness(
  pages: Array<{ slug: string; city: string; intro: string; localTrustSection: string }>,
): void {
  // Check localTrustSection mentions city name
  for (const page of pages) {
    if (!page.localTrustSection.toLowerCase().includes(page.city.toLowerCase())) {
      throw new Error(`City page "${page.slug}" localTrustSection must mention "${page.city}"`)
    }
  }

  // Check intro uniqueness (>80% token overlap = fail)
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const a = stripCityName(pages[i].intro, pages[i].city)
      const b = stripCityName(pages[j].intro, pages[j].city)
      const overlap = tokenOverlap(a, b)
      if (overlap > 0.8) {
        throw new Error(
          `City pages "${pages[i].slug}" and "${pages[j].slug}" fail uniqueness check: ` +
          `intro text is ${Math.round(overlap * 100)}% similar after removing city names (max 80%)`,
        )
      }
    }
  }
}

function stripCityName(text: string, city: string): string {
  return text.toLowerCase().replace(new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "").trim()
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(a.split(/\s+/).filter(Boolean))
  const tokensB = new Set(b.split(/\s+/).filter(Boolean))
  if (tokensA.size === 0 && tokensB.size === 0) return 0
  let intersection = 0
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++
  }
  const union = new Set([...tokensA, ...tokensB]).size
  return union === 0 ? 0 : intersection / union
}
```

- [ ] **Step 4: Wire Titan validation into validateOutput main function**

In the `validateOutput` function, after the schema parse passes and before writing `validated_slots`, add:

```ts
  // Titan-specific validations
  if (artifact.template.name === "titan-default") {
    const titanData = parsed.data as { servicePages: Array<{ slug: string }>; cityPages: Array<{ slug: string; city: string; intro: string; localTrustSection: string }> }

    // Read the prompt artifact for canonical slugs
    const promptArtifact = await readArtifact<{
      normalizedIntake: { offeredServices?: string[]; serviceAreas?: string[] }
    }>(ctx.projectId, "generated_copy")

    const { dedupeSlugList } = await import("../utils/slugify")
    const canonicalServices = dedupeSlugList(promptArtifact.normalizedIntake.offeredServices ?? []).map((s) => s.slug)
    const canonicalCities = dedupeSlugList(promptArtifact.normalizedIntake.serviceAreas ?? []).map((s) => s.slug)

    validateTitanSlugs(titanData.servicePages, titanData.cityPages, canonicalServices, canonicalCities)
    validateCityUniqueness(titanData.cityPages)
  }
```

Add import at top:
```ts
import { readArtifact } from "../orchestrator"
```

(Note: `readArtifact` may already be imported — check and deduplicate.)

- [ ] **Step 5: Run tests — expect pass**

Run: `pnpm test lib/statxai/agents/__tests__/validate-titan.test.ts`

Expected: All 6 tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/statxai/agents/validate-output.ts lib/statxai/agents/__tests__/validate-titan.test.ts
git commit -m "feat: Titan slug validation and city uniqueness checks"
```

---

## PR 4: Manifest + Slots + SEO + Renderers

This is the largest PR. It converts the pipeline from single-page to route-aware rendering.

### Task 22: Refactor map-slots to route-scoped output

**Files:**
- Modify: `lib/statxai/agents/map-slots.ts`

- [ ] **Step 1: Rewrite map-slots to produce slotsByRoute**

Replace the full contents of `lib/statxai/agents/map-slots.ts`:

```ts
import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import type { LanderContent } from "../schemas/lander-content"
import type { CoreContent } from "../schemas/core-content"
import type { TitanContent } from "../schemas/titan-content"
import type { NormalizedIntake } from "../schemas/intake"

type SlotMap = Record<string, unknown>
type SlotsByRoute = Record<string, SlotMap>

export async function mapSlots(ctx: JobContext): Promise<void> {
  const validatedArtifact = await readArtifact<{
    content: unknown
    templateName: string
  }>(ctx.projectId, "validated_slots")

  const copyArtifact = await readArtifact<{
    normalizedIntake: NormalizedIntake
    template: { name: string; pages: string[] }
  }>(ctx.projectId, "generated_copy")

  const slotsByRoute = buildSlotsByRoute(
    validatedArtifact.templateName,
    validatedArtifact.content,
    copyArtifact.normalizedIntake,
  )

  await writeArtifact(ctx.jobId, ctx.projectId, "validated_slots", {
    ...validatedArtifact,
    slotsByRoute,
    mappedAt: new Date().toISOString(),
  })
}

function buildSlotsByRoute(
  templateName: string,
  content: unknown,
  intake: NormalizedIntake,
): SlotsByRoute {
  switch (templateName) {
    case "titan-default":
      return buildTitanSlots(content as TitanContent, intake)
    case "core-default":
      return buildCoreSlots(content as CoreContent, intake)
    case "lander-default":
    default:
      return buildLanderSlots(content as LanderContent, intake)
  }
}

function buildLanderSlots(content: LanderContent, intake: NormalizedIntake): SlotsByRoute {
  return {
    "/": {
      "hero.headline": content.hero.headline,
      "hero.subheadline": content.hero.subheadline,
      "hero.ctaText": content.hero.ctaText,
      "hero.ctaUrl": resolveCtaUrl(content.hero.ctaUrl, intake),
      "hero.backgroundImagePrompt": content.hero.backgroundImagePrompt,
      "services.headline": content.services.headline,
      "services.items": content.services.items.map((item, i) => ({
        key: `service_${i}`, title: item.title, description: item.description, icon: item.icon,
      })),
      "about.headline": content.about.headline,
      "about.body": content.about.body,
      "about.ownerName": content.about.ownerName,
      "about.ownerRole": content.about.ownerRole,
      "testimonials.headline": content.testimonials.headline,
      "testimonials.items": content.testimonials.items.map((t, i) => ({
        key: `testimonial_${i}`, quote: t.quote, name: t.name, role: t.role,
      })),
      "contact.headline": content.contact.headline,
      "contact.subheadline": content.contact.subheadline,
      "contact.phone": intake.phone ?? content.contact.phone,
      "contact.email": intake.email ?? content.contact.email,
      "contact.address": intake.businessAddress ?? content.contact.address,
      "contact.hours": content.contact.hours,
      "cta.headline": content.cta.headline,
      "cta.subheadline": content.cta.subheadline,
      "cta.buttonText": content.cta.buttonText,
      "cta.buttonUrl": resolveCtaUrl(content.cta.buttonUrl, intake),
      "site.businessName": intake.businessName,
      "site.phone": intake.phone,
      "site.email": intake.email,
      "site.address": intake.businessAddress,
      "site.primaryColor": intake.primaryColor,
      "site.secondaryColor": intake.secondaryColor,
      "site.socialLinks": intake.socialLinks ?? {},
    },
  }
}

function buildCoreSlots(content: CoreContent, intake: NormalizedIntake): SlotsByRoute {
  return {
    "/": {
      "home.hero": content.home.hero,
      "home.featuredServices": content.home.featuredServices,
      "home.aboutPreview": content.home.aboutPreview,
      "home.testimonials": content.home.testimonials,
      "home.primaryCta": content.home.primaryCta,
      "site.businessName": intake.businessName,
      "site.phone": intake.phone,
      "site.email": intake.email,
      "site.address": intake.businessAddress,
      "site.primaryColor": intake.primaryColor,
      "site.secondaryColor": intake.secondaryColor,
      "site.socialLinks": intake.socialLinks ?? {},
    },
    "/services/": {
      headline: content.servicesPage.headline,
      intro: content.servicesPage.intro,
      services: content.servicesPage.services,
      faq: content.servicesPage.faq ?? [],
      cta: content.servicesPage.cta,
    },
    "/about/": {
      headline: content.aboutPage.headline,
      story: content.aboutPage.story,
      values: content.aboutPage.values ?? [],
      ownerName: content.aboutPage.ownerName,
      ownerRole: content.aboutPage.ownerRole,
      cta: content.aboutPage.cta,
    },
    "/contact/": {
      headline: content.contactPage.headline,
      intro: content.contactPage.intro,
      phoneLabel: content.contactPage.phoneLabel,
      emailLabel: content.contactPage.emailLabel,
      addressLabel: content.contactPage.addressLabel,
      hoursLabel: content.contactPage.hoursLabel,
      formHeadline: content.contactPage.formHeadline,
      formButtonText: content.contactPage.formButtonText,
      cta: content.contactPage.cta,
    },
  }
}

function buildTitanSlots(content: TitanContent, intake: NormalizedIntake): SlotsByRoute {
  const coreSlots = buildCoreSlots(content, intake)

  const serviceSlots: SlotsByRoute = {}
  for (const sp of content.servicePages) {
    serviceSlots[`/services/${sp.slug}/`] = {
      slug: sp.slug,
      serviceName: sp.serviceName,
      headline: sp.headline,
      intro: sp.intro,
      whyChooseUs: sp.whyChooseUs,
      process: sp.process ?? [],
      faqs: sp.faqs ?? [],
      cta: sp.cta,
      seo: sp.seo,
    }
  }

  const citySlots: SlotsByRoute = {}
  for (const cp of content.cityPages) {
    citySlots[`/areas/${cp.slug}/`] = {
      slug: cp.slug,
      city: cp.city,
      state: cp.state,
      headline: cp.headline,
      intro: cp.intro,
      localTrustSection: cp.localTrustSection,
      featuredServices: cp.featuredServices,
      faqs: cp.faqs ?? [],
      cta: cp.cta,
      seo: cp.seo,
    }
  }

  return { ...coreSlots, ...serviceSlots, ...citySlots }
}

function resolveCtaUrl(llmUrl: string, intake: NormalizedIntake): string {
  if (llmUrl.startsWith("tel:") || llmUrl.startsWith("mailto:") || llmUrl.startsWith("http")) {
    return llmUrl
  }
  switch (intake.ctaPreference) {
    case "call":
      return intake.phone ? `tel:${intake.phone.replace(/\D/g, "")}` : "/contact/"
    case "book":
    case "quote":
    case "contact":
    default:
      return "/contact/"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/map-slots.ts
git commit -m "feat: route-scoped slotsByRoute in map-slots agent"
```

---

### Task 23: Refactor generate-seo for per-route output

**Files:**
- Modify: `lib/statxai/agents/generate-seo.ts`

- [ ] **Step 1: Update to produce seoByRoute**

This is a significant rewrite. Replace the full body of `generate-seo.ts` with a version that produces `seoByRoute: Record<string, SeoBundle>`.

For **Lander**: one call producing `seoByRoute["/"]`.
For **Core**: one call producing SEO for all 4 routes.
For **Titan**: base call + per-route SEO from the `TitanServicePage.seo` and `TitanCityPage.seo` fields already generated.

The implementation is long — the subagent executing this task should read the spec Section 13 (SEO Output) and the existing `generate-seo.ts` for full context. Key change: import `NormalizedIntake` from schemas, read `validated_slots` to get the template name and content, and branch by template.

For Titan, service page and city page SEO is already in the content (each has a `seo: { title, description }` field). The agent should extract those and combine with a `generateObject` call for the base routes.

Write artifact as: `{ seoByRoute: Record<string, SeoBundle> }`.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/generate-seo.ts
git commit -m "feat: per-route SEO generation in generate-seo stage"
```

---

### Task 24: Upgrade build-manifest for new RenderManifest type

**Files:**
- Modify: `lib/statxai/agents/build-manifest.ts`

- [ ] **Step 1: Define PreviewPage and RenderManifest types**

Create a shared types file or add to the top of `build-manifest.ts`:

The subagent should update `build-manifest.ts` to:
1. Read `slotsByRoute` from the `validated_slots` artifact (instead of `slots`)
2. Read `seoByRoute` from the `seo_bundle` artifact (instead of `seo`)
3. Build a `routes: PreviewPage[]` array from the keys of `slotsByRoute`
4. Output the new `RenderManifest` shape per spec Section 9

Key type:
```ts
export type PreviewPage = {
  key: string
  label: string
  route: string
  kind: "base" | "service" | "city"
  order: number
}

export type RenderManifest = {
  templateName: string
  rendererVersion: string
  routes: PreviewPage[]
  slotsByRoute: Record<string, Record<string, unknown>>
  seoByRoute: Record<string, SeoBundle>
  meta: { businessName: string; phone: string | null; email: string | null; address: string | null; primaryColor: string; secondaryColor: string; socialLinks: Record<string, string> }
  assets: { logos: AssetRef[]; photos: AssetRef[] }
  generatedAt: string
  projectId: string
  jobId: string
}
```

Route classification: `/` and `/services/` and `/about/` and `/contact/` are `"base"`. Routes matching `/services/*/` are `"service"`. Routes matching `/areas/*/` are `"city"`.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/build-manifest.ts
git commit -m "feat: upgraded RenderManifest with slotsByRoute and seoByRoute"
```

---

### Task 25: Renderer primitives

**Files:**
- Create: `lib/statxai/renderer/primitives.ts`

- [ ] **Step 1: Extract shared HTML functions from lander-default.ts**

Create `lib/statxai/renderer/primitives.ts` by extracting these functions from the existing `lander-default.ts`:

- `esc(str)` — HTML escaping
- `iconSvg(name, size)` — inline Lucide SVG lookup
- `buildJsonLd(seo)` — schema.org JSON-LD builder

Add new composition functions:

```ts
export function renderHead(title: string, description: string, ogTitle: string, ogDescription: string, primaryColor: string, secondaryColor: string): string
export function renderNav(businessName: string, phone: string | null, links?: Array<{ label: string; href: string }>): string
export function renderHero(headline: string, subheadline: string, ctaText: string, ctaUrl: string, primaryColor: string, secondaryColor: string): string
export function renderServicesGrid(items: Array<{ title: string; description: string; icon: string }>): string
export function renderAbout(headline: string, body: string, ownerName: string, ownerRole: string): string
export function renderTestimonials(headline: string, items: Array<{ quote: string; name: string; role: string }>): string
export function renderContact(phone: string, email: string, address: string, hours: string, headline: string, subheadline: string): string
export function renderContactForm(projectId: string, siteToken: string, route: string, formHeadline: string, formButtonText: string): string
export function renderCta(headline: string, subheadline: string, buttonText: string, buttonUrl: string, primaryColor: string, secondaryColor: string): string
export function renderFooter(businessName: string, phone: string | null, email: string | null, address: string | null, socialLinks: Record<string, string>): string
export function renderPageShell(headHtml: string, navHtml: string, bodyHtml: string, footerHtml: string): string
export function slugify(input: string): string
export function baseStyles(primaryColor: string, secondaryColor: string): string
```

The `renderContactForm` function embeds hidden fields for `projectId` and `siteToken` and sets the form action to the STATXEO API origin + `/api/public/site-lead`. Include a honeypot field `<input name="website" type="text" style="display:none" tabindex="-1" autocomplete="off">`.

The CSS from the existing `lander-default.ts` should move into `baseStyles()` so all renderers share it.

This is a large extraction. The subagent should read `lander-default.ts` line by line and factor out each section into a named function.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/renderer/primitives.ts
git commit -m "feat: shared renderer primitives for HTML generation"
```

---

### Task 26: Refactor lander-default.ts to use primitives and return RenderResult

**Files:**
- Modify: `lib/statxai/renderer/lander-default.ts`

- [ ] **Step 1: Refactor to use primitives and return RenderResult**

Import from `primitives.ts` and rebuild `renderLanderDefault` to compose from primitives.

Return type changes from `string` to `RenderResult`:

```ts
import type { PreviewPage } from "../agents/build-manifest"

export type RenderResult = {
  files: Record<string, string>
  previewPages: PreviewPage[]
  sitemapRoutes: string[]
}
```

The function reads `manifest.slotsByRoute["/"]` instead of `manifest.slots`.

For backward compat, also check for old-style `manifest.slots` if `manifest.slotsByRoute` is undefined.

Generate `robots.txt` and `sitemap.xml` as additional files.

```ts
export function renderLanderDefault(manifest: RenderManifest): RenderResult {
  const slots = manifest.slotsByRoute?.["/"] ?? manifest.slots ?? {}
  const seo = manifest.seoByRoute?.["/"] ?? manifest.seo
  // ... compose HTML from primitives ...
  return {
    files: {
      "index.html": html,
      "robots.txt": `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml`,
      "sitemap.xml": buildSitemap(siteUrl, ["/"]),
    },
    previewPages: [{ key: "home", label: "Home", route: "/", kind: "base", order: 1 }],
    sitemapRoutes: ["/"],
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/renderer/lander-default.ts
git commit -m "refactor: lander renderer uses primitives and returns RenderResult"
```

---

### Task 27: Core renderer

**Files:**
- Create: `lib/statxai/renderer/core-default.ts`

- [ ] **Step 1: Implement renderCoreDefault**

Core renders its own `index.html` (different home layout from Lander) plus `/services/`, `/about/`, `/contact/`.

Uses primitives for each section. Contact page includes `renderContactForm()`.

Generates `robots.txt`, `sitemap.xml`, `llms.txt`.

```ts
export function renderCoreDefault(manifest: RenderManifest): RenderResult {
  // Render 4 pages using primitives and slotsByRoute
  // Build sitemap with all 4 routes
  // Build llms.txt from seoByRoute["/"].llmsTxt
  return {
    files: {
      "index.html": homeHtml,
      "services/index.html": servicesHtml,
      "about/index.html": aboutHtml,
      "contact/index.html": contactHtml,
      "robots.txt": robotsTxt,
      "sitemap.xml": sitemapXml,
      "llms.txt": llmsTxt,
    },
    previewPages: [
      { key: "home", label: "Home", route: "/", kind: "base", order: 1 },
      { key: "services", label: "Services", route: "/services/", kind: "base", order: 2 },
      { key: "about", label: "About", route: "/about/", kind: "base", order: 3 },
      { key: "contact", label: "Contact", route: "/contact/", kind: "base", order: 4 },
    ],
    sitemapRoutes: ["/", "/services/", "/about/", "/contact/"],
  }
}
```

The subagent must implement the full HTML for each page. Read the spec Section 11 (Page Composition) for the exact section order per page.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/renderer/core-default.ts
git commit -m "feat: Core 4-page renderer"
```

---

### Task 28: Titan renderer

**Files:**
- Create: `lib/statxai/renderer/titan-default.ts`

- [ ] **Step 1: Implement renderTitanDefault**

Titan spreads Core output and adds service/city pages.

```ts
import { renderCoreDefault } from "./core-default"

export function renderTitanDefault(manifest: RenderManifest): RenderResult {
  const core = renderCoreDefault(manifest)

  // Render service sub-pages from slotsByRoute["/services/[slug]/"]
  const serviceFiles: Record<string, string> = {}
  const servicePages: PreviewPage[] = []
  const serviceSitemapRoutes: string[] = []
  let order = 10

  for (const [route, slots] of Object.entries(manifest.slotsByRoute)) {
    if (route.startsWith("/services/") && route !== "/services/") {
      const slug = slots.slug as string
      const seo = manifest.seoByRoute[route]
      serviceFiles[routeToFile(route)] = renderServiceDetailPage(manifest, slots, seo)
      servicePages.push({ key: `service-${slug}`, label: slots.serviceName as string, route, kind: "service", order: order++ })
      serviceSitemapRoutes.push(route)
    }
  }

  // Render city pages from slotsByRoute["/areas/[slug]/"]
  const cityFiles: Record<string, string> = {}
  const cityPreviews: PreviewPage[] = []
  const citySitemapRoutes: string[] = []
  order = 100

  for (const [route, slots] of Object.entries(manifest.slotsByRoute)) {
    if (route.startsWith("/areas/")) {
      const slug = slots.slug as string
      const seo = manifest.seoByRoute[route]
      cityFiles[routeToFile(route)] = renderCityPage(manifest, slots, seo)
      cityPreviews.push({ key: `area-${slug}`, label: slots.city as string, route, kind: "city", order: order++ })
      citySitemapRoutes.push(route)
    }
  }

  const allSitemapRoutes = [...core.sitemapRoutes, ...serviceSitemapRoutes, ...citySitemapRoutes]

  // Regenerate sitemap.xml and llms.txt with full route list
  const siteUrl = "https://placeholder.vercel.app" // replaced at deploy time or from manifest
  const files = {
    ...core.files,
    ...serviceFiles,
    ...cityFiles,
    "sitemap.xml": buildSitemap(siteUrl, allSitemapRoutes),
  }

  return {
    files,
    previewPages: [...core.previewPages, ...servicePages, ...cityPreviews],
    sitemapRoutes: allSitemapRoutes,
  }
}
```

The subagent must implement `renderServiceDetailPage` and `renderCityPage` using primitives. See spec Section 11 for page composition.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/renderer/titan-default.ts
git commit -m "feat: Titan renderer with service/city page generation"
```

---

### Task 29: Renderer dispatcher

**Files:**
- Create: `lib/statxai/renderer/index.ts`

- [ ] **Step 1: Implement selectRenderer**

```ts
import type { RenderManifest } from "../agents/build-manifest"
import type { RenderResult } from "./lander-default"
import { renderLanderDefault } from "./lander-default"
import { renderCoreDefault } from "./core-default"
import { renderTitanDefault } from "./titan-default"

export type { RenderResult } from "./lander-default"

export function selectRenderer(
  templateName: string,
): (manifest: RenderManifest) => RenderResult {
  switch (templateName) {
    case "titan-default":
      return renderTitanDefault
    case "core-default":
      return renderCoreDefault
    case "lander-default":
    default:
      return renderLanderDefault
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/renderer/index.ts
git commit -m "feat: selectRenderer dispatcher for template routing"
```

---

## PR 5: Preview/Production Deployment Refactor

### Task 30: Update deploy-preview

**Files:**
- Modify: `lib/statxai/agents/deploy-preview.ts`

- [ ] **Step 1: Use selectRenderer and store RenderResult**

Replace the import and rendering logic:

```ts
import { selectRenderer } from "../renderer"
import type { RenderManifest } from "./build-manifest"

export async function deployPreview(ctx: JobContext): Promise<void> {
  const manifest = await readArtifact<RenderManifest>(ctx.projectId, "render_manifest")

  const renderer = selectRenderer(manifest.templateName)
  const result = renderer(manifest)

  const files: VercelDeploymentFile[] = Object.entries(result.files).map(
    ([file, content]) => ({ file, content }),
  )

  // ... existing Vercel deploy logic (unchanged) ...

  await writeArtifact(ctx.jobId, ctx.projectId, "preview_deployment", {
    previewUrl,
    vercelDeploymentId,
    projectName: vercelProjectName(ctx.projectId),
    deployedAt: new Date().toISOString(),
    renderedFiles: result.files,
    previewPages: result.previewPages,
    sitemapRoutes: result.sitemapRoutes,
  })
}
```

Remove the old `renderLanderDefault` import and `renderedHtml` usage.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/deploy-preview.ts
git commit -m "feat: multi-file preview deployment with selectRenderer"
```

---

### Task 31: Update deploy-production with backward compat

**Files:**
- Modify: `lib/statxai/agents/deploy-production.ts`

- [ ] **Step 1: Add 3-tier fallback**

```ts
import { selectRenderer } from "../renderer"
import type { RenderManifest } from "./build-manifest"
import type { VercelDeploymentFile } from "../vercel-client"

export async function deployProduction(ctx: JobContext): Promise<void> {
  let renderedFiles: Record<string, string>

  // Tier 1: reuse renderedFiles from preview artifact
  try {
    const previewArtifact = await readArtifact<{
      renderedFiles?: Record<string, string>
      renderedHtml?: string
    }>(ctx.projectId, "preview_deployment")

    if (previewArtifact.renderedFiles) {
      renderedFiles = previewArtifact.renderedFiles
    } else if (previewArtifact.renderedHtml) {
      // Tier 3: backward compat with old lander jobs
      renderedFiles = { "index.html": previewArtifact.renderedHtml }
    } else {
      throw new Error("No rendered content in preview artifact")
    }
  } catch {
    // Tier 2: re-render from manifest
    const manifest = await readArtifact<RenderManifest>(ctx.projectId, "render_manifest")
    const result = selectRenderer(manifest.templateName)(manifest)
    renderedFiles = result.files
  }

  const files: VercelDeploymentFile[] = Object.entries(renderedFiles).map(
    ([file, content]) => ({ file, content }),
  )

  // ... existing Vercel deploy + project status update logic (unchanged) ...
}
```

Remove old `renderLanderDefault` import.

- [ ] **Step 2: Commit**

```bash
git add lib/statxai/agents/deploy-production.ts
git commit -m "feat: multi-file production deployment with 3-tier fallback"
```

---

## PR 6: Portal UI + Project API + Site Lead Endpoint

### Task 32: Site lead API endpoint

**Files:**
- Create: `app/api/public/site-lead/route.ts`

- [ ] **Step 1: Implement site-lead endpoint**

```ts
import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "site-lead",
})

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const { success: withinLimit } = await ratelimit.limit(ip)
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { projectId, siteToken, route, name, email, phone, message, website } = body as Record<string, string>

  // Honeypot check
  if (website) {
    // Bot filled the hidden field — silently succeed
    return NextResponse.json({ ok: true })
  }

  if (!projectId || !route) {
    return NextResponse.json({ error: "projectId and route are required" }, { status: 400 })
  }

  if (!name && !email && !phone && !message) {
    return NextResponse.json({ error: "At least one contact field is required" }, { status: 400 })
  }

  // TODO: validate siteToken (for v1, accept any — token signing comes in a follow-up)

  const admin = createAdminSupabaseClient()

  // Verify project exists
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Invalid project" }, { status: 400 })
  }

  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16)

  const { error } = await admin.from("statxeo_site_form_submissions").insert({
    project_id: projectId,
    route: route || "/contact/",
    name: name?.trim() || null,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    message: message?.trim() || null,
    ip_hash: ipHash,
  })

  if (error) {
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/public/site-lead/route.ts
git commit -m "feat: site-lead API endpoint for generated site contact forms"
```

---

### Task 33: Update project API to return preview_pages and page_count

**Files:**
- Modify: `app/api/site-projects/[projectId]/route.ts`

- [ ] **Step 1: Read latest preview artifact and attach to response**

In the GET handler for `/api/site-projects/[projectId]`, after fetching the project detail, read the latest `preview_deployment` artifact:

```ts
// Fetch latest preview artifact for preview_pages
let previewPages: unknown[] = []
let pageCount = 0

const { data: previewArtifact } = await admin
  .from("statxeo_site_generation_artifacts")
  .select("payload")
  .eq("project_id", projectId)
  .eq("artifact_type", "preview_deployment")
  .eq("is_current", true)
  .maybeSingle()

if (previewArtifact?.payload) {
  const payload = previewArtifact.payload as Record<string, unknown>
  previewPages = (payload.previewPages as unknown[]) ?? []
  pageCount = Array.isArray(previewPages) ? previewPages.length : 0
}

// Add to response
return NextResponse.json({
  project: { ...projectData, preview_pages: previewPages, page_count: pageCount },
})
```

- [ ] **Step 2: Commit**

```bash
git add app/api/site-projects/[projectId]/route.ts
git commit -m "feat: include preview_pages and page_count in project API response"
```

---

### Task 34: Tier-aware WebsiteProjectForm

**Files:**
- Modify: `components/sections/website-project-form.tsx`

- [ ] **Step 1: Add tier detection and conditional tabs**

Read `project.package_tier` to determine which tabs to show:

```ts
const packageTier = project.package_tier as string
const showServicesTab = packageTier === "statxeo_core" || packageTier === "statxeo_titan"
const showCityPagesTab = packageTier === "statxeo_titan"
```

- [ ] **Step 2: Add Services tab**

After the existing "content" tab (around line 335), add a conditional Services tab:

```tsx
{showServicesTab && (
  <TabsTrigger value="services" className="gap-1.5 text-xs">
    <Wrench className="size-3.5" />
    Services
  </TabsTrigger>
)}
```

Add import for `Wrench` from lucide-react.

Add the Services tab content panel with a TagInput for `offeredServices`:

```tsx
{showServicesTab && (
  <TabsContent value="services" className="space-y-6">
    <div>
      <Label>Offered Services</Label>
      <p className="text-xs text-muted-foreground mb-2">
        List each service — the AI expands these into full descriptions. Max 12.
      </p>
      <TagInput
        tags={offeredServices}
        onAdd={(val) => setOfferedServices((prev) => [...prev, val])}
        onRemove={(idx) => setOfferedServices((prev) => prev.filter((_, i) => i !== idx))}
        placeholder="AC Repair"
        disabled={!isEditable}
        maxTags={12}
      />
    </div>
  </TabsContent>
)}
```

Add state: `const [offeredServices, setOfferedServices] = useState<string[]>(project.offered_services ?? [])`

Wire `offeredServices` into the save payload alongside existing preferences.

- [ ] **Step 3: Add City Pages tab (Titan only)**

```tsx
{showCityPagesTab && (
  <TabsTrigger value="cityPages" className="gap-1.5 text-xs">
    <Globe className="size-3.5" />
    City Pages
  </TabsTrigger>
)}
```

Tab content:

```tsx
{showCityPagesTab && (
  <TabsContent value="cityPages" className="space-y-6">
    <div>
      <Label>City Pages</Label>
      <p className="text-xs text-muted-foreground mb-2">
        Each city becomes a dedicated SEO landing page. Max 20.
      </p>
      <TagInput
        tags={serviceAreas}
        onAdd={(val) => setServiceAreas((prev) => [...prev, val])}
        onRemove={(idx) => setServiceAreas((prev) => prev.filter((_, i) => i !== idx))}
        placeholder="Austin TX"
        disabled={!isEditable}
        maxTags={20}
      />
    </div>
    {showCityPagesTab && (
      <Badge variant="secondary" className="text-xs">
        {4 + (offeredServices?.length ?? 0) + (serviceAreas?.length ?? 0)} pages estimated
      </Badge>
    )}
  </TabsContent>
)}
```

- [ ] **Step 4: Commit**

```bash
git add components/sections/website-project-form.tsx
git commit -m "feat: tier-aware intake form with Services and City Pages tabs"
```

---

### Task 35: Tier-aware preview in customer/website page

**Files:**
- Modify: `app/customer/website/page.tsx`

- [ ] **Step 1: Add page selector for multi-page preview**

After fetching project detail (which now includes `preview_pages`), add state for active preview page:

```ts
const [activePreviewRoute, setActivePreviewRoute] = useState("/")
const previewPages = (selectedProject as any)?.preview_pages ?? []
const hasMultiplePages = previewPages.length > 1
```

Replace the single iframe with a conditional multi-page preview:

```tsx
{selectedProject.preview_url && (
  <Card className="overflow-hidden border-border/50 bg-card/60">
    <CardHeader className="pb-0 pt-4">
      <div className="flex items-center gap-2">
        {/* Browser dots */}
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-red-500/70" />
          <div className="size-3 rounded-full bg-amber-500/70" />
          <div className="size-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex-1 rounded-md border border-border/50 bg-background/50 px-3 py-1">
          <p className="truncate text-xs text-muted-foreground">
            {selectedProject.preview_url}{activePreviewRoute}
          </p>
        </div>
      </div>
      {/* Page tabs for Core/Titan */}
      {hasMultiplePages && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {previewPages
            .filter((p: any) => p.kind === "base")
            .map((p: any) => (
              <Button
                key={p.key}
                variant={activePreviewRoute === p.route ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActivePreviewRoute(p.route)}
              >
                {p.label}
              </Button>
            ))}
          {/* Service pages dropdown */}
          {previewPages.some((p: any) => p.kind === "service") && (
            <Select
              value={activePreviewRoute.startsWith("/services/") && activePreviewRoute !== "/services/" ? activePreviewRoute : ""}
              onValueChange={(v) => v && setActivePreviewRoute(v)}
            >
              <SelectTrigger className="h-7 w-auto text-xs">
                <SelectValue placeholder="Service Pages" />
              </SelectTrigger>
              <SelectContent>
                {previewPages.filter((p: any) => p.kind === "service").map((p: any) => (
                  <SelectItem key={p.key} value={p.route}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* City pages dropdown */}
          {previewPages.some((p: any) => p.kind === "city") && (
            <Select
              value={activePreviewRoute.startsWith("/areas/") ? activePreviewRoute : ""}
              onValueChange={(v) => v && setActivePreviewRoute(v)}
            >
              <SelectTrigger className="h-7 w-auto text-xs">
                <SelectValue placeholder="City Pages" />
              </SelectTrigger>
              <SelectContent>
                {previewPages.filter((p: any) => p.kind === "city").map((p: any) => (
                  <SelectItem key={p.key} value={p.route}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </CardHeader>
    <CardContent className="p-0 pt-3">
      <div className="aspect-video w-full">
        <iframe
          src={`${selectedProject.preview_url}${activePreviewRoute === "/" ? "" : activePreviewRoute}`}
          className="h-full w-full border-0"
          title="Website Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </CardContent>
  </Card>
)}
```

- [ ] **Step 2: Update pipeline stage descriptions**

In the `PIPELINE_STAGES` array or the `getStageStatuses` function, make descriptions tier-aware. Read `selectedProject.package_tier` and adjust the "Generate" and "Review" stage descriptions accordingly:

```ts
const tierLabel = selectedProject.package_tier === "statxeo_titan"
  ? "site + city & service pages"
  : selectedProject.package_tier === "statxeo_core"
    ? "4-page site"
    : "landing page"
```

- [ ] **Step 3: Add page count badge in header**

Next to the package tier display, show the page count:

```tsx
{(selectedProject as any)?.page_count > 0 && (
  <Badge variant="outline" className="text-xs">
    {(selectedProject as any).page_count} pages
  </Badge>
)}
```

- [ ] **Step 4: Commit**

```bash
git add app/customer/website/page.tsx
git commit -m "feat: tier-aware preview with page tabs and dropdowns"
```

---

### Task 36: Final review and all-tests pass

- [ ] **Step 1: Run all tests**

Run: `pnpm test`

Expected: All tests pass (intake, slugify, core-content, titan-content, select-schema, validate-titan)

- [ ] **Step 2: Run build check**

Run: `pnpm build`

Expected: Build succeeds (note: `typescript.ignoreBuildErrors: true` in next.config.mjs means TS errors won't fail the build, but review any warnings).

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git status
# If any unstaged changes remain, stage and commit them
```

---

## Summary: PR Breakdown

| PR | Tasks | Focus |
|---|---|---|
| **PR 1** | 1–10 | Vitest · migrations · intake schema · intake API · dev seed fix |
| **PR 2** | 11–19 | Slugify · CoreContentSchema · TitanContentSchema · schema selector · resolve-template · generate-content routing · validate-output routing · assemble-prompt refactor · index exports |
| **PR 3** | 20–21 | Titan multi-call batching · slug validation · city uniqueness |
| **PR 4** | 22–29 | map-slots → slotsByRoute · generate-seo → seoByRoute · build-manifest upgrade · primitives · lander refactor · core renderer · titan renderer · renderer dispatcher |
| **PR 5** | 30–31 | deploy-preview multi-file · deploy-production 3-tier fallback |
| **PR 6** | 32–36 | site-lead endpoint · project API preview_pages · tier-aware form · tier-aware preview · tests pass |
