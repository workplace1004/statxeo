> [!WARNING]
> **THIS DOCUMENT IS OUTDATED — V1 ARCHITECTURE ONLY**
>
> This doc describes the original V1 architecture of StatXEO which has since been **fully replaced**.
> Key things that have changed:
>
> - ❌ **Supabase** — fully purged from the codebase. A `check:no-supabase` CI script prevents re-introduction.
> - ❌ **`/app` directory** — decommissioned. All code now lives in `/src`.
> - ❌ **Shared STATXT Supabase DB** — replaced by **MongoDB Atlas** (`xeo.d7ee8bx.mongodb.net`, db: `statxeo`) with 38 isolated collections.
> - ❌ **`lib/statxt-api.ts` Supabase client** — replaced with HMAC session auth and MongoDB.
> - ❌ **`SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_URL`** — no longer used.
>
> **Current architecture reference:** See [`docs/development-log.md`](./development-log.md) for the full V2 migration history (starting May 4, 2026).
> For a quick catch-up on the current system, see the Mic Briefing artifact.

# STATXEO White-Label + AI Site Builder Onboarding


## 1) Current Product State (Today)

STATXEO is a Next.js app that serves:
- Public marketing site and checkout intake
- Customer portal
- Affiliate portal
- Staff support ops view
- API proxy layer to STATXT services

This app already runs on Vercel and is linked to a Vercel project.

Vercel linkage:
- `.vercel/project.json`
  - projectId: `prj_4oaVoA4IxKB6doHbnlXMFBch7v9P`
  - orgId: `team_hHlrcGQzziFgLa4HUdvzXH8J`

## 2) Current Stack

Core framework/runtime:
- Next.js 16.1.6
- React 19.2.4
- TypeScript 5.7.3
- pnpm 10

Styling + UI:
- Tailwind CSS 4
- shadcn/ui (New York style) + Radix primitives
- lucide-react icons
- custom visual components in `components/react-bits/*`

Data/Auth:
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Server/client/admin Supabase clients in `lib/supabase/*`

Monitoring/analytics:
- `@vercel/analytics`

Important note:
- `next.config.mjs` currently has `typescript.ignoreBuildErrors: true`.
- Build will not fail on TS errors right now.

## 3) Current Architecture (High Level)

### Frontend
- App Router pages in `app/*`
- Main marketing page composed from sections in `components/sections/*`
- Intake and pricing flow is in-app, not externalized yet

### API Layer
- Local API routes under `app/api/*`
- Some routes execute directly against Supabase (customer portal)
- Affiliate and checkout routes proxy to STATXT upstream via `lib/statxt-api.ts`

### Upstream Integration
`lib/statxt-api.ts` forwards requests to:
- `STATXT_API_BASE_URL` (default `https://statxt.com`)
- Optional `STATXT_INTERNAL_API_KEY`
- Authorization and cookies are forwarded when available

## 4) Shared DB / Shared Platform Reality

This project is not isolated from STATXT. It is coupled by design.

### Shared data assumptions currently in code
- Shared auth domain (Supabase `auth.users`)
- Shared business tables in public schema (examples used by this app):
  - `statxeo_leads`
  - `statxeo_purchases`
  - `statxeo_workflow_tasks`
  - `statxeo_support_threads`
  - `statxeo_support_messages`
  - `statxeo_lead_images`
  - `statxeo_customer_lead_links`
  - `statxeo_customer_documents`
  - `users`
  - `system_admins`

### Migration currently present in this repo
- `supabase/migrations/20260311_customer_portal_linking_and_documents.sql`
- Adds customer lead linking + customer documents tables and RLS policies

### Why this matters for onboarding
Any "white-label website builder" implementation must respect:
- Existing STATXT contracts and route behavior
- Existing Supabase auth/user records
- Existing commission, checkout, and lead workflows

## 5) Current Portal Status

## Customer portal
Entry pages:
- `app/customer/page.tsx`
- `app/customer/login/page.tsx`
- `app/customer/support-ops/page.tsx`

Client implementation:
- `components/sections/customer-portal.tsx`
- `components/sections/customer-support-ops.tsx`
- `lib/statxeo/customer-client.ts`
- `lib/statxeo/customer-server.ts`

API routes implemented locally:
- `app/api/customer/overview/route.ts`
- `app/api/customer/orders/route.ts`
- `app/api/customer/workflow/route.ts`
- `app/api/customer/documents/route.ts`
- `app/api/customer/documents/download/route.ts`
- `app/api/customer/support/thread/route.ts`
- `app/api/customer/support/messages/route.ts`
- `app/api/customer/support/staff/threads/route.ts`
- `app/api/customer/support/staff/messages/route.ts`

What is already real:
- Auth gating via Supabase user session
- Ownership checks via `statxeo_customer_lead_links` fallback to email match
- Support thread/message flow with staff view and replies
- Document listing + download endpoint

## Affiliate portal
Entry pages:
- `app/affiliate/page.tsx`
- `app/affiliate/login/page.tsx`
- `app/affiliate/help/page.tsx`

Client implementation:
- `components/sections/affiliate-portal.tsx`
- `components/sections/affiliate-help.tsx`
- `lib/statxeo/affiliate-client.ts`

API routes (proxied to STATXT):
- `app/api/affiliate/overview/route.ts`
- `app/api/affiliate/links/route.ts`
- `app/api/affiliate/ledger/route.ts`
- `app/api/affiliate/payouts/route.ts`
- `app/api/affiliate/admin/access/route.ts`
- `app/api/affiliate/admin/payout-export/route.ts`

What is already real:
- Link creation UI and API call path
- Ledger and payouts with pagination controls
- Admin access check + CSV payout export

## 6) Checkout + Intake Status

Current intake:
- `components/sections/intake-form.tsx`
- Supports website-only, boost-only, and combined checkout payloads

Validation schemas:
- `lib/statxeo/checkout-schemas.ts` (zod)

Checkout API routes:
- `app/api/statxeo/checkout/route.ts`
- `app/api/statxeo/boost-checkout/route.ts`
- `app/api/statxeo/checkout-combined/route.ts`

All three forward to STATXT checkout routes through proxy.

Known combined-checkout behavior from repo memory:
- Combined flow uses `source=statxeo_combined`
- Webhook must run website + boost handlers for completed/expired
- Website commission basis must use website amount metadata, not total session amount

## 7) SEO/Discovery State (Already Implemented)

- Metadata in `app/layout.tsx`
- JSON-LD on home in `app/page.tsx`
- Sitemap in `app/sitemap.ts`
- Robots in `app/robots.ts`
- LLM-readable text route in `app/llms.txt/route.ts`

This is a good base for white-label SEO output automation.

## 8) Gap Analysis Against Proposed White-Label AI Pipeline

Your desired flow:
1. Set up Next.js on Vercel
2. Add Vercel AI SDK
3. Use shadcn + Tailwind + custom components
4. Store user preferences during intake
5. Fetch Vercel template by ID
6. Get photos from client
7. Send data to AI agent
8. AI returns text + images
9. Build React components
10. Inject AI content as props
11. Assemble template
12. Render and deploy final site

What is already done:
- 1: Yes (already on Vercel)
- 3: Yes (shadcn + Tailwind + custom component library)
- Partial 4: Intake captures business + package data but not a full white-label preference model

What is missing and must be designed:
- 2: Vercel AI SDK not integrated in this app yet
- 4: Tenant-aware intake persistence model (template id, brand tokens, locale, content prefs)
- 5: Template registry/fetcher for v0 or internal templates
- 6: Media upload and asset curation pipeline (storage + moderation + dedupe)
- 7: Orchestration service for prompt assembly and generation stages
- 8: Deterministic output contract for copy/assets (JSON schema + validation)
- 9/10/11: Component mapping engine (template slots -> typed props)
- 12: Programmatic deployment pipeline and status tracking

## 9) Recommended White-Label System Design

Add a tenant/job model first.

Suggested core tables (in shared Supabase):
- `statxeo_tenants`
- `statxeo_site_projects`
- `statxeo_site_intake_submissions`
- `statxeo_template_registry`
- `statxeo_generation_jobs`
- `statxeo_generation_artifacts`
- `statxeo_project_media_assets`
- `statxeo_project_deployments`

Suggested pipeline stages:
1. Intake saved
2. Assets uploaded and approved
3. Template resolved
4. Content generation
5. Component prop mapping
6. Static validation (schema, links, SEO checks)
7. Preview deploy
8. QA approval
9. Production deploy

Use queue/state machine semantics so every stage is retryable and observable.

## 10) What To Tell New Developer On Day 1

- STATXEO is a front-end + portal app with partial direct DB access and partial STATXT proxying.
- It uses the same Supabase auth/data ecosystem as STATXT (not a greenfield DB).
- Customer portal APIs are local and enforce ownership.
- Affiliate APIs are mostly pass-through to STATXT admin/affiliate endpoints.
- Checkout is validated locally, fulfilled upstream in STATXT.
- Existing migrations in this repo are additive to shared `statxeo_*` tables and policies.
- White-label AI site generation should be built as a new subsystem, not by overloading current checkout routes.

## 11) Environment Variables To Know

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STATXT_API_BASE_URL`
- `STATXT_INTERNAL_API_KEY`
- `REACTBITS_LICENSE_KEY` (for registries in `components.json`)

## 12) Suggested 4-Phase Execution Plan

Phase 1: Foundation
- Add tenant/project/intake/media/deployment tables
- Add signed upload flow for client photos
- Add project settings UI in customer portal

Phase 2: Generation Engine
- Integrate Vercel AI SDK
- Define strict JSON schema for generated copy + image prompts
- Build server-side generation endpoint with audit logs

Phase 3: Template Assembly
- Implement template registry + slot mapping
- Inject generated content into typed component props
- Render preview project automatically

Phase 4: Deploy + Operations
- Deploy preview/production to Vercel via API
- Store deployment metadata and URLs
- Add QA gates, approval workflow, rollback support

## 13) Portal Completion Priorities

Customer portal:
- Add explicit loading/error telemetry and event tracking
- Add richer document metadata and preview links
- Add thread assignment/status workflow for support ops

Affiliate portal:
- Add stronger admin UX around payout export history
- Add better copy/share analytics for affiliate links
- Confirm edge-case handling from upstream API errors

## 14) Immediate Next Tasks (Practical)

1. Lock data model and naming for white-label entities.
2. Implement intake persistence endpoint and tables before generation logic.
3. Integrate Vercel AI SDK behind a single `site-generation` service module.
4. Build one end-to-end MVP path: intake -> generate -> preview deploy.
5. Add regression tests around existing checkout + portal flows before broad changes.
