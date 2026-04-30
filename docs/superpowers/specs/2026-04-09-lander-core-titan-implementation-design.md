# Lander / Core / Titan — Implementation Design Spec

**Date:** 2026-04-09
**Status:** Approved — replaces previous draft
**Author context:** Senior fullstack + DB + TypeScript + Supabase

---

## 1. Package Definitions

### Lander — `statxeo_lander` · $149.99

Single-page conversion site. Fastest path to launch. Maximum CTA focus.

Rendered routes: `/`

Sections: hero · service highlights · about summary · testimonials · contact · final CTA

---

### Core — `statxeo_core` · $399.99

4-page business website. Real SEO footprint. Dedicated pages for each intent.

Rendered routes:

```
/
/services/
/about/
/contact/
```

---

### Titan — `statxeo_titan` · $999.99

Core base site + dynamic service detail pages + city/area landing pages.

Rendered routes:

```
/
/services/
/about/
/contact/
/services/[service-slug]/      ← one per offered service
/areas/[city-slug]/            ← one per city in serviceAreas
```

`/areas/[city-slug]/` is used instead of root-level city slugs to prevent collisions with `/about/`, `/contact/`, `/services/`.

No cross-product (service × city) pages in v1. Service pages focus on the service. City pages summarize all services in that area.

---

## 2. Non-Page Static Outputs

Every deployed site also produces supporting files.

| File | Lander | Core | Titan |
|---|---|---|---|
| `robots.txt` | ✓ | ✓ | ✓ |
| `sitemap.xml` | ✓ | ✓ | ✓ |
| `llms.txt` | — | ✓ | ✓ |

---

## 3. Data Model Changes

### 3.1 New DB column

Add to `statxeo_site_projects`:

```sql
offered_services text[]
```

This is separate from `unique_selling_points`. Both fields must remain distinct.

| Field | Meaning | Examples |
|---|---|---|
| `unique_selling_points` | Trust differentiators | "Licensed & insured", "Same-day service" |
| `offered_services` | Structured service list | "AC Repair", "Duct Cleaning" |
| `service_areas` | City targets for Titan pages | "Austin TX", "Round Rock TX" |

### 3.2 Intake schema additions

**`WebsitePreferencesSchema`** — add:

```ts
offeredServices: z.array(z.string().trim().max(120)).max(12).optional()
```

**`NormalizedIntakeSchema`** — add:

```ts
offeredServices: z.array(z.string()).optional()
```

**`normalize-intake.ts`** — add to merge block:

```ts
offeredServices: prefs.offeredServices ?? project.offered_services,
```

### 3.3 Intake API route

`app/api/site-projects/[projectId]/intake/route.ts`:

- Accept `offeredServices` in the request body
- Write to `project.offered_services`
- Do not touch `unique_selling_points`

---

## 4. Template Registry Rules

### 4.1 Entries

| Field | lander-default | core-default | titan-default |
|---|---|---|---|
| `supported_packages` | `{statxeo_lander}` | `{statxeo_core}` | `{statxeo_titan}` |
| `pages` | `["home"]` | `["home","services","about","contact"]` | `["home","services","about","contact"]` |
| `renderer_version` | `1.0` | `1.0` | `1.0` |
| `is_active` | true | true | true |

`lander-default` must not be seeded as supporting all packages once Core/Titan are live.

### 4.2 Migration strategy

Use `ON CONFLICT (name) DO UPDATE SET ...` — not `DO NOTHING`. `core-default` may already exist from the foundation migration. `DO NOTHING` would silently leave it stale.

### 4.3 Template resolution

```ts
// lib/statxai/agents/resolve-template.ts
const PACKAGE_TEMPLATE_DEFAULTS = {
  statxeo_lander: "lander-default",
  statxeo_core:   "core-default",
  statxeo_titan:  "titan-default",   // was incorrectly "core-default"
}
```

Titan must never resolve to `core-default`.

---

## 5. Schema Design — Code-First Rule

**DB `slot_schema` is metadata only.** It is not the runtime contract.

- Zod schemas in `lib/statxai/schemas/` are the source of truth
- The LLM prompt must use the shape derived from the code schema, not arbitrary DB JSON
- `assemble-prompt.ts` builds the schema description from the imported Zod type, not from `template.slotSchema`

This prevents contract drift between code and DB.

---

## 6. Content Schemas

### 6.1 LanderContentSchema — unchanged

```ts
LanderContentSchema = z.object({
  hero:         LanderHeroSchema,
  services:     LanderServicesSchema,
  about:        LanderAboutSchema,
  testimonials: LanderTestimonialsSchema,
  contact:      LanderContactSchema,
  cta:          LanderCtaSchema,
})
```

### 6.2 CoreContentSchema — new file: `schemas/core-content.ts`

Core has dedicated page-level structure, not a renamed Lander blob.

```ts
CoreContentSchema = z.object({
  home: z.object({
    hero:            LanderHeroSchema,
    featuredServices:z.array(CoreFeaturedServiceSchema).min(3).max(6),
    aboutPreview:    z.object({ headline: z.string(), body: z.string() }),
    testimonials:    LanderTestimonialsSchema,
    primaryCta:      LanderCtaSchema,
  }),
  servicesPage: z.object({
    headline: z.string(),
    intro:    z.string().describe("30-60 words"),
    services: z.array(CoreServiceDetailSchema).min(3).max(12),
    faq:      z.array(FaqItemSchema).min(2).max(6).optional(),
    cta:      LanderCtaSchema,
  }),
  aboutPage: z.object({
    headline:  z.string(),
    story:     z.string().describe("80-150 words"),
    values:    z.array(z.string()).max(6).optional(),
    ownerName: z.string(),
    ownerRole: z.string(),
    cta:       LanderCtaSchema,
  }),
  contactPage: z.object({
    headline:        z.string(),
    intro:           z.string(),
    phoneLabel:      z.string(),
    emailLabel:      z.string(),
    addressLabel:    z.string(),
    hoursLabel:      z.string(),
    formHeadline:    z.string(),
    formButtonText:  z.string(),
    cta:             LanderCtaSchema,
  }),
})
```

**Supporting types:**

```ts
CoreFeaturedServiceSchema = z.object({
  slug:             z.string(),      // kebab-case, reused in Titan service routes
  title:            z.string(),
  shortDescription: z.string(),      // 20-40 words
  icon:             z.string(),      // Lucide icon name
})

CoreServiceDetailSchema = CoreFeaturedServiceSchema.extend({
  longDescription:  z.string(),      // 60-120 words
  bulletPoints:     z.array(z.string()).min(3).max(6).optional(),
  priceHint:        z.string().nullable(),
})

FaqItemSchema = z.object({
  question: z.string(),
  answer:   z.string(),
})
```

### 6.3 TitanContentSchema — new file: `schemas/titan-content.ts`

```ts
TitanContentSchema = CoreContentSchema.extend({
  servicePages: z.array(TitanServicePageSchema).min(1).max(12),
  cityPages:    z.array(TitanCityPageSchema).min(1).max(20),
})
```

**`TitanServicePageSchema`:**

```ts
z.object({
  slug:           z.string(),       // matches CoreServiceDetailSchema.slug
  serviceName:    z.string(),
  headline:       z.string(),
  intro:          z.string(),
  whyChooseUs:    z.string(),
  process:        z.array(z.string()).optional(),
  faqs:           z.array(FaqItemSchema).min(2).max(5).optional(),
  cta:            LanderCtaSchema,
  seo: z.object({
    title:       z.string().max(60),
    description: z.string().max(160),
  }),
})
```

**`TitanCityPageSchema`:**

```ts
z.object({
  slug:               z.string(),   // e.g. "austin-tx"
  city:               z.string(),   // e.g. "Austin TX"
  state:              z.string().optional(),
  headline:           z.string(),
  intro:              z.string(),
  localTrustSection:  z.string(),
  featuredServices:   z.array(z.object({
    title:   z.string(),
    summary: z.string(),
    href:    z.string(),             // e.g. "/services/ac-repair/"
  })).min(2).max(6),
  faqs:               z.array(FaqItemSchema).optional(),
  cta:                LanderCtaSchema,
  seo: z.object({
    title:       z.string().max(60),
    description: z.string().max(160),
  }),
})
```

**City page uniqueness — enforced in `validate-output.ts`:**

Each `TitanCityPage` must pass these checks or the job fails validation:

1. `intro` must not be a substring match of any other city's `intro` after removing the city name (similarity check: reject if >80% token overlap after stripping the city string)
2. `localTrustSection` must contain the city name at least once
3. At least one of `faqs` (min 1 item) or `featuredServices` must differ by content from the equivalent array on at least one other city page

These checks run in code inside `validate-output.ts` after schema validation passes. A city page failing uniqueness fails the entire Titan job with a descriptive error message identifying which city and which check failed. This gives the orchestrator a retryable error with a clear cause.

---

## 7. Slug Generation — Deterministic, Code-Owned

Slugs for service pages and city pages are **generated in code before prompting**. The LLM receives the canonical slug list as input and must use those exact slugs in its output. Slugs are never invented by the model.

### Algorithm (`slugify`)

```ts
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// Examples:
// "AC Repair"    → "ac-repair"
// "A/C Repair"   → "a-c-repair"
// "Austin, TX"   → "austin-tx"
// "Austin TX"    → "austin-tx"
```

### Collision resolution

Duplicate slugs are resolved in code before the prompt is assembled:

```ts
function dedupeslugs(inputs: string[]): Array<{ original: string; slug: string }> {
  const seen = new Map<string, number>()
  return inputs.map((input) => {
    const base = slugify(input)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return { original: input, slug: count === 0 ? base : `${base}-${count}` }
  })
}
// "AC Repair" + "AC Repair" → "ac-repair" + "ac-repair-1"
```

### Where slugs are generated

- `assemble-prompt.ts` calls `dedupeslugs(intake.offeredServices)` and `dedupeslugs(intake.serviceAreas)` before building the prompt
- The prompt explicitly lists: `"Service slugs: ac-repair, heating, duct-cleaning"`
- The prompt explicitly lists: `"City slugs: austin-tx, round-rock-tx, cedar-park-tx"`
- `TitanServicePageSchema` and `TitanCityPageSchema` both have `slug: z.string()` — the model must echo the provided slug exactly
- `validate-output.ts` checks that every slug in the output matches a slug in the pre-computed list. Mismatches fail validation.

---

## 8. Generation Strategy

### Lander

Single `generateObject()` call. Schema: `LanderContentSchema`.

### Core

Single `generateObject()` call. Schema: `CoreContentSchema`.

### Titan

**Multiple model calls inside the `generate-content` stage.** The orchestrator stage name stays `llm_calling`. The agent handles batching internally.

Sequence:

1. Call 1 — generate `CoreContent` base (home, servicesPage, aboutPage, contactPage)
2. Call 2 — generate `servicePages[]`, one batch (all services, ≤12)
3. Call 3+ — generate `cityPages[]`, batched if > 10 cities

Assemble the final `TitanContent` object in memory after all calls. Write one `generated_copy` artifact.

**Why batching:** A single call with 12 service pages + 20 city pages degrades output quality and may exceed context limits.

---

## 8. Route-Scoped Slot Maps

Replace the global flat slot map with route-scoped slot maps.

```ts
type SlotMap = Record<string, unknown>

type SlotsByRoute = Record<string, SlotMap>
// key = route string, e.g. "/" or "/services/" or "/areas/austin-tx/"
```

**Why:** Flat keys like `servicesPage.hero.title` and `cityPages[3].headline` are fragile and make renderers harder to compose. Route-scoped maps let each renderer function receive only the slots it needs.

**`map-slots.ts` output:**

```ts
{
  "/":                       { hero.headline, hero.subheadline, ... },
  "/services/":              { servicesPage.headline, servicesPage.services, ... },
  "/about/":                 { aboutPage.headline, aboutPage.story, ... },
  "/contact/":               { contactPage.headline, ... },
  "/services/ac-repair/":    { slug, serviceName, headline, intro, ... },
  "/areas/austin-tx/":       { slug, city, headline, intro, ... },
}
```

---

## 9. Render Manifest — Upgraded

```ts
type RenderManifest = {
  templateName:    string
  rendererVersion: string
  routes:          PreviewPage[]
  slotsByRoute:    Record<string, Record<string, unknown>>
  seoByRoute:      Record<string, SeoBundle>
  meta: {
    businessName:   string
    phone:          string | null
    email:          string | null
    address:        string | null
    primaryColor:   string
    secondaryColor: string
    socialLinks:    Record<string, string>
  }
  assets: {
    logos:  AssetRef[]
    photos: AssetRef[]
  }
  generatedAt: string
  projectId:   string
  jobId:       string
}

type PreviewPage = {
  key:   string
  label: string
  route: string
  kind:  "base" | "service" | "city"
  order: number
}

type AssetRef = {
  storagePath:      string
  placementHint:    string | null
  originalFilename: string | null
}
```

`seoByRoute` replaces the single `SeoBundle`. The `generate-seo` stage must produce per-route SEO for Core and Titan. Lander keeps one entry at `"/"`.

---

## 10. Renderer Contract

All renderers return `RenderResult`:

```ts
type RenderResult = {
  files:          Record<string, string>  // Vercel filename → HTML
  previewPages:   PreviewPage[]
  sitemapRoutes:  string[]
}
```

Functions:

```ts
renderLanderDefault(manifest: RenderManifest): RenderResult
renderCoreDefault(manifest: RenderManifest):   RenderResult
renderTitanDefault(manifest: RenderManifest):  RenderResult
```

### Renderer inheritance

Core has a different home-page structure from Lander (dedicated `home` object in `CoreContentSchema` vs Lander's flat fields). Therefore **Core renders its own `index.html`** using shared primitives — it does not spread Lander's rendered output. Titan spreads Core's rendered output because `TitanContentSchema` extends `CoreContentSchema` exactly.

```ts
// core-default.ts — renders all 4 pages independently using shared primitives
renderCoreDefault(manifest): RenderResult {
  const homeHtml     = renderCoreHome(manifest)      // uses primitives, core-specific layout
  const servicesHtml = renderServicesPage(manifest)
  const aboutHtml    = renderAboutPage(manifest)
  const contactHtml  = renderContactPage(manifest)
  return {
    files: {
      "index.html":           homeHtml,
      "services/index.html":  servicesHtml,
      "about/index.html":     aboutHtml,
      "contact/index.html":   contactHtml,
    },
    previewPages:  corePreviewPages,
    sitemapRoutes: ["/", "/services/", "/about/", "/contact/"],
  }
}

// titan-default.ts — spreads Core (same schema shape), adds dynamic pages
renderTitanDefault(manifest): RenderResult {
  const core         = renderCoreDefault(manifest)   // safe: TitanContent extends CoreContent
  const serviceFiles = renderServiceSubPages(manifest)
  const cityFiles    = renderCityPages(manifest)
  return {
    files:          { ...core.files, ...serviceFiles, ...cityFiles },
    previewPages:   [...core.previewPages, ...dynamicPages],
    sitemapRoutes:  [...core.sitemapRoutes, ...dynamicRoutes],
  }
}
```

**Rule:** Only spread a parent renderer's output when the child schema extends the parent schema exactly (Titan → Core). Do not spread when the content shape differs (Core ≠ Lander). Use shared primitives for code reuse instead.

### Renderer primitives — `renderer/primitives.ts`

```
renderHead(title, description, og*, colors, fonts?) → <head>
renderNav(businessName, phone, links[]) → <nav>
renderHero(slots) → <section class="hero">
renderServicesGrid(items) → <div class="services-grid">
renderAbout(slots) → <section class="about">
renderTestimonials(items) → <section>
renderContact(slots, meta) → <section class="contact">
renderContactForm(projectId, route, formSlots) → <form> wired to /api/public/site-lead
renderCta(slots) → <section class="cta">
renderFooter(meta, socialLinks) → <footer>
renderPageShell(head, nav, body, footer) → full HTML document
esc(str) → HTML-escaped string
slugify(str) → kebab-case slug
```

---

## 11. Page Composition

### Lander — `index.html`

nav · hero · services highlights · about summary · testimonials · contact section · CTA · footer

### Core — `index.html`

nav · hero · featured services · about preview · testimonials · primary CTA · footer

### Core — `services/index.html`

nav · services intro · detailed service cards (with `slug` anchor IDs) · optional FAQ · CTA · footer

### Core — `about/index.html`

nav · headline · story · values/trust · owner section · CTA · footer

### Core — `contact/index.html`

nav · headline · contact details (phone, email, address, hours) · wired contact form · CTA · footer

### Titan — `services/[slug]/index.html`

nav · service hero · overview · why choose us · process (if present) · FAQ · CTA · footer
Internal links back to `/services/` and city pages for that service area

### Titan — `areas/[city-slug]/index.html`

nav · city hero · local relevance section · featured services grid (links to `/services/[slug]/`) · trust/coverage language · FAQ · CTA · footer

---

## 12. Contact Form — Wired on `/contact/` Only

**v1 rule: only the `/contact/` page has a live form.** All other pages (home, services, about, service detail pages, city pages) use CTA buttons or anchor links pointing to `/contact/`. This keeps the implementation surface small and avoids embedding a form shell on pages where it doesn't belong.

The wired contact form is rendered by `renderContactPage()` in `renderer/primitives.ts`. No other renderer function produces a `<form>` element.

**Endpoint:** `POST /api/public/site-lead`

**Payload:**

```json
{
  "projectId": "...",
  "siteToken": "...",
  "route": "/contact/",
  "name": "...",
  "email": "...",
  "phone": "...",
  "message": "..."
}
```

**Required protections:**

- Honeypot field (hidden input, rejected server-side if filled)
- Server-side field validation
- Per-IP rate limiting (use existing Upstash Redis + `@upstash/ratelimit`)
- Origin/domain allowlist (check `Referer` against `project.domain_name` or `preview_url`)
- Hidden `siteToken` — a signed token derived from `projectId` embedded at render time

**Renderer requirement:** `renderContactForm()` primitive embeds `projectId` and `siteToken` as hidden fields and sets `action="/api/public/site-lead"` with `method="POST"` (with JS fetch progressive enhancement).

---

## 13. SEO Output — Per Tier

### Lander

- `seoByRoute["/"]`: title, description, og*, schema.org LocalBusiness JSON-LD
- `sitemap.xml`: home only
- `robots.txt`

### Core

- `seoByRoute["/"]`, `["/services/"]`, `["/about/"]`, `["/contact/"]`: title, description, canonical per page
- `sitemap.xml`: all 4 pages
- `robots.txt`, `llms.txt`

### Titan

- `seoByRoute` for every route including `/services/[slug]/` and `/areas/[slug]/`
- Each route: unique title (max 60), unique description (max 160), canonical, unique H1
- `sitemap.xml`: all base + dynamic routes
- `robots.txt`, `llms.txt`

**`generate-seo` stage change:** Must run per-route for Core/Titan. Either one call producing `Record<string, SeoBundle>` or a small batch. Write artifact as `{ seoByRoute: Record<string, SeoBundle> }`.

---

## 14. Agent File Changes

### New files

```
lib/statxai/schemas/core-content.ts
lib/statxai/schemas/titan-content.ts
lib/statxai/renderer/primitives.ts
lib/statxai/renderer/core-default.ts
lib/statxai/renderer/titan-default.ts
lib/statxai/renderer/index.ts          ← selectRenderer(templateName)
```

### Updated files

```
lib/statxai/schemas/intake.ts
  + offeredServices field in WebsitePreferencesSchema and NormalizedIntakeSchema

lib/statxai/agents/resolve-template.ts
  statxeo_titan → "titan-default"

lib/statxai/agents/assemble-prompt.ts
  + tier-aware prompt sections
  + use code-derived schema shape (not template.slotSchema from DB)
  + Titan: include city slug table, service list, batching instructions

lib/statxai/agents/generate-content.ts
  + selectSchema() routing for core-default, titan-default
  + Titan: internal multi-call batching

lib/statxai/agents/validate-output.ts
  + selectSchema() routing mirrors generate-content

lib/statxai/agents/map-slots.ts
  + output is slotsByRoute: Record<string, SlotMap>
  + buildCoreSlots(), buildTitanSlots()
  + buildCoreSlots spreads buildLanderSlots
  + buildTitanSlots spreads buildCoreSlots

lib/statxai/agents/generate-seo.ts
  + per-route SEO for Core/Titan
  + output: { seoByRoute: Record<string, SeoBundle> }

lib/statxai/agents/build-manifest.ts
  + populate routes, slotsByRoute, seoByRoute
  + use new RenderManifest type

lib/statxai/agents/deploy-preview.ts
  + selectRenderer() from renderer/index.ts
  + store renderedFiles, previewPages, sitemapRoutes in artifact

lib/statxai/agents/deploy-production.ts
  + read renderedFiles from preview_deployment artifact
  + fallback to re-render if renderedFiles missing
  + fallback to old renderedHtml for backward compat with existing lander jobs

lib/statxai/renderer/lander-default.ts
  + refactor to use primitives.ts
  + return type: string → RenderResult
```

### Portal and API

```
components/sections/website-project-form.tsx
  + tier-aware tabs (Lander/Core/Titan)
  + Services tab: offeredServices TagInput (Core + Titan)
  + City Pages tab: serviceAreas TagInput (Titan only)
  + page count badge in form header

app/customer/website/page.tsx
  + tier-aware pipeline stage descriptions
  + Lander: single iframe (unchanged)
  + Core: 4-tab preview strip (Home / Services / About / Contact)
  + Titan: 4 base tabs + Service Pages dropdown + City Pages dropdown
  + preview pages sourced from previewPages in preview_deployment artifact

app/api/site-projects/[projectId]/route.ts
  + include preview_pages, page_count, route list from latest preview artifact

app/api/site-projects/[projectId]/intake/route.ts
  + accept offeredServices, write to project.offered_services
```

### New API route

```
app/api/public/site-lead/route.ts
  POST — accepts contact form submissions from generated sites
  validates siteToken, honeypot, required fields
  rate-limited via Upstash
  stores submission in statxeo_site_form_submissions (dedicated table — see below)
```

### DB migrations

```
supabase/migrations/20260409_offered_services_column.sql
  ALTER TABLE statxeo_site_projects ADD COLUMN IF NOT EXISTS offered_services text[];

supabase/migrations/20260409_seed_core_titan_templates.sql
  INSERT/UPDATE core-default and titan-default in statxeo_site_template_registry
  Uses ON CONFLICT (name) DO UPDATE SET ...

supabase/migrations/20260409_site_form_submissions.sql
  CREATE TABLE statxeo_site_form_submissions (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references statxeo_site_projects(id) on delete cascade,
    route text not null,
    name text,
    email text,
    phone text,
    message text,
    ip_hash text,
    submitted_at timestamptz not null default now()
  );
  RLS: service_role full access; no authenticated user read (staff views via admin only)
```

**Why a dedicated table:** `statxeo_leads` is owned by the STATXT checkout pipeline and has different semantics (purchase intent). Site contact form submissions are post-launch engagement — different lifecycle, different admin queries, different CRM handoff path. Keeping them separate prevents coupling.

### Dev tooling

```
app/api/dev/seed-demo-project/route.ts
  + seed real tiers: statxeo_lander, statxeo_core, statxeo_titan
  + remove statxeo_thin (invalid tier)
```

---

## 15. Updated Deployment Artifact — `preview_deployment`

```ts
{
  previewUrl:          string | null
  vercelDeploymentId:  string | null
  projectName:         string
  deployedAt:          string
  renderedFiles:       Record<string, string>     // filename → HTML
  previewPages:        PreviewPage[]
  sitemapRoutes:       string[]
}
```

**Backward compat in `deploy-production`:**

```
1. try renderedFiles from preview_deployment artifact
2. if missing: re-render via selectRenderer(manifest.templateName)(manifest)
3. old renderedHtml (lander jobs before this release) → wrap as { "index.html": renderedHtml }
```

---

## 16. API Response Changes — `GET /api/site-projects/[projectId]`

Add to response:

```json
{
  "preview_pages": [
    { "key": "home",     "label": "Home",     "route": "/",           "kind": "base",    "order": 1 },
    { "key": "services", "label": "Services", "route": "/services/",  "kind": "base",    "order": 2 },
    { "key": "about",    "label": "About",    "route": "/about/",     "kind": "base",    "order": 3 },
    { "key": "contact",  "label": "Contact",  "route": "/contact/",   "kind": "base",    "order": 4 },
    { "key": "service-ac-repair", "label": "AC Repair", "route": "/services/ac-repair/", "kind": "service", "order": 10 },
    { "key": "area-austin-tx",    "label": "Austin TX", "route": "/areas/austin-tx/",    "kind": "city",    "order": 20 }
  ],
  "page_count": 6
}
```

`page_count` = number of entries in `preview_pages`. The example above has 4 base + 1 service + 1 city = 6. Does not count `robots.txt`, `sitemap.xml`, or `llms.txt`.

Source: latest `preview_deployment` artifact's `previewPages` array. Not derived from template registry alone.

---

## 17. Customer Portal — Tier-Aware Spec

### WebsiteProjectForm tabs

| Tab | Lander | Core | Titan |
|---|---|---|---|
| Brand | ✓ | ✓ | ✓ |
| Content | ✓ | ✓ | ✓ |
| Services | — | ✓ | ✓ |
| City Pages | — | — | ✓ |
| Media | ✓ | ✓ | ✓ |
| Social | ✓ | ✓ | ✓ |

**Content tab fields (all tiers):** target audience · brand tone · unique selling points · CTA preference

**Services tab fields (Core + Titan):** `offeredServices` TagInput. Label: *"List each service — the AI expands these into full descriptions."* Max 12. Placeholder: `"AC Repair"`.

**City Pages tab (Titan only):** `serviceAreas` TagInput. Label: *"Each city becomes a dedicated SEO landing page."* Max 20. Placeholder: `"Austin TX"`. Dynamic page count badge: `"${4 + offeredServices.length + serviceAreas.length} pages estimated"` (4 base pages + one per service + one per city).

### /customer/website page

**Pipeline stage descriptions — tier-aware:**

| Stage | Lander | Core | Titan |
|---|---|---|---|
| Generate | "AI builds your landing page" | "AI builds your 4-page site" | "AI builds site + city & service pages" |
| Review | "Preview your page" | "Preview all 4 pages" | "Preview all pages" |
| Launch | "Approve & go live" | "Approve & go live" | "Approve & go live" |

**Preview panel — tier-aware:**

- Lander: single iframe at `previewUrl` (unchanged)
- Core: 4-tab strip (Home · Services · About · Contact), iframe `src` switches per tab
- Titan: 4 base tabs + "Service Pages" dropdown + "City Pages" dropdown; iframe `src` switches to selected route via `${previewUrl}${route}`

Preview pages are sourced from the `previewPages` array in the latest `preview_deployment` artifact (fetched via `GET /api/site-projects/[projectId]` response). Not hardcoded, not derived from template registry.

---

## 18. Limits — Enforced in UI and Schema

| | Lander | Core | Titan |
|---|---|---|---|
| Service cards | 3–6 | 3–12 | 3–12 |
| Testimonials | 2–6 | 2–6 | 2–6 |
| Offered services | — | max 12 | max 12 |
| Service areas | — | — | max 20 |
| FAQ items per page | — | 2–6 | 2–6 per page |

---

## 19. Acceptance Criteria

### Lander — complete when

- One-page preview renders correctly
- Deployed files: `index.html`, `robots.txt`, `sitemap.xml`
- CTA links to `tel:` or `#contact`
- Customer can approve and deploy to production

### Core — complete when

- Preview exposes 4 tabs (Home / Services / About / Contact)
- All 4 routes render with correct content
- Contact form POSTs to `/api/public/site-lead` and is rate-limited
- `sitemap.xml` includes all 4 routes
- `llms.txt` is present
- Customer portal can switch pages in preview iframe

### Titan — complete when

- Preview exposes 4 base tabs + service + city dropdowns
- `/services/[slug]/` routes render with service-specific content
- `/areas/[city-slug]/` routes render with city-specific content
- No route collisions (all under `/services/` or `/areas/`)
- City pages pass uniqueness validation in `validate-output.ts`
- `sitemap.xml` includes all base + dynamic routes
- Customer portal can browse all dynamic pages
- Contact form on `/contact/` POSTs to `/api/public/site-lead` and is rate-limited
- All other pages link to `/contact/` via CTA buttons — no embedded forms

---

## 20. Key Decisions Summary

| Decision | Ruling |
|---|---|
| Core page count | 4 pages (home, services, about, contact) |
| Titan structure | Core + `/services/[slug]/` + `/areas/[slug]/` |
| City routes | `/areas/[city-slug]/` not root-level |
| Cross-product pages | None in v1 |
| `uniqueSellingPoints` vs `offeredServices` | Separate fields, separate DB columns |
| Runtime schema authority | Code-first (Zod) — DB `slot_schema` is metadata only |
| Renderer output | `RenderResult` with `files`, `previewPages`, `sitemapRoutes` |
| Preview page source | `previewPages` from artifact — not template registry |
| Titan generation | Multiple model calls inside one `llm_calling` stage |
| Contact forms | Wired form on `/contact/` only; CTA links on all other pages |
| Form submission storage | Dedicated `statxeo_site_form_submissions` table |
| Slug generation | Code-owned, deterministic, pre-prompt; model echoes provided slugs |
| Titan uniqueness enforcement | `validate-output.ts` checks intro overlap + localTrustSection + FAQ/service diff |
| Core renderer inheritance | Core renders its own `index.html` via primitives (not Lander's output) |
| Slot map shape | Route-scoped `slotsByRoute: Record<string, SlotMap>` |
| Template conflict strategy | `ON CONFLICT (name) DO UPDATE` |
