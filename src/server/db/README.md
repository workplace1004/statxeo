# StatXEO data layer

A typed MongoDB layer that backs every view in the dashboard. Read this before adding a
new entity, a new query, or a new index.

## Folder map

```
src/server/
├── context.ts          # getCurrentAgencyOrgId / CustomerOrgId / AffiliateUserId
├── actions/            # "use server" mutations (form-friendly, validated with zod)
├── db/
│   ├── client.ts       # cached MongoClient (HMR-safe in dev, fresh in prod)
│   ├── database.ts     # getDb() → "statxeo" database
│   ├── collections.ts  # typed Collection<T> accessors
│   ├── indexes.ts      # ensureIndexes() — idempotent
│   ├── README.md       # ← you are here
│   └── schemas/        # one file per entity (Doc + Client + Zod + UI color maps)
└── queries/            # read-only async functions grouped by domain
    ├── agency.ts       # white-label dashboard
    ├── affiliate.ts    # affiliate dashboard
    ├── customer.ts     # end-customer dashboard
    └── support.ts      # tickets, KB, FAQ (cross-cutting)
```

## Connection

`src/server/db/client.ts` reads `MONGODB_URI` from the environment, builds a
`MongoClient` with `maxPoolSize: 10` and `serverSelectionTimeoutMS: 5000`, and caches the
connect promise on `globalThis` so HMR doesn't open a new socket on every save.

The database name is **`statxeo`** (`DATABASE_NAME` in `database.ts`).

## Collections

| Collection | Schema | Indexes |
| --- | --- | --- |
| `users` | `schemas/users.ts` | `email` unique, `(organizationId, role)` |
| `organizations` | `schemas/organizations.ts` | `(type, name)`, `ownerUserId` |
| `customers` | `schemas/customers.ts` | `(agencyOrgId, status)`, `(agencyOrgId, lastActivityAt -1)`, `(agencyOrgId, mrrCents -1)` |
| `sites` | `schemas/sites.ts` | `(agencyOrgId, status)`, `customerId` |
| `keywords` | `schemas/keywords.ts` | `(customerId, term)` unique, `(customerId, rank)`, `(agencyOrgId, lastCheckedAt -1)` |
| `socialPosts` | `schemas/social-posts.ts` | `(customerId, scheduledFor)`, `(customerOrgId, scheduledFor)`, `(agencyOrgId, status)` |
| `workflows` | `schemas/workflows.ts` | `(agencyOrgId, status)`, `(agencyOrgId, updatedAt -1)` |
| `revenueEvents` | `schemas/revenue-events.ts` | `(orgId, occurredAt -1)` |
| `aiActivity` | `schemas/ai-activity.ts` | `(orgId, occurredAt -1)`, **TTL** 180 days |
| `approvals` | `schemas/approvals.ts` | `(orgId, status, dueAt)` |
| `agencyTeam` | `schemas/agency-team.ts` | `(agencyOrgId, status)` |
| `activityLog` | `schemas/agency-team.ts` | `(agencyOrgId, occurredAt -1)` |
| `invoices` | `schemas/invoices.ts` | `(orgId, issuedAt -1)`, `(orgId, status)` |
| `referralLinks` | `schemas/referral-links.ts` | `(affiliateUserId, status)`, `slug` unique |
| `leads` | `schemas/leads.ts` | `(affiliateUserId, stage)`, `(affiliateUserId, updatedAt -1)` |
| `commissions` | `schemas/commissions.ts` | `(affiliateUserId, status)`, `(affiliateUserId, closedDate -1)` |
| `payouts` | `schemas/commissions.ts` | `(affiliateUserId, scheduledFor -1)` |
| `meetings` | `schemas/meetings.ts` | `(affiliateUserId, scheduledFor)` |
| `marketingAssets` | `schemas/marketing-assets.ts` | `(type, updatedAt -1)`, `tags` |
| `trainingModules` | `schemas/training.ts` | `(category, isRequired -1)` |
| `trainingProgress` | `schemas/training.ts` | `(userId, moduleId)` unique |
| `plans` | `schemas/plans.ts` | `slug` unique |
| `customerKeywords` | `schemas/customer-keywords.ts` | `(customerOrgId, keyword)` unique, `(customerOrgId, position)` |
| `competitors` | `schemas/competitors.ts` | `(customerOrgId, visibility -1)` |
| `reviews` | `schemas/reviews.ts` | `(customerOrgId, postedAt -1)`, `(customerOrgId, rating)` |
| `calls` | `schemas/calls.ts` | `(customerOrgId, startedAt -1)`, `(customerOrgId, tag)` |
| `phoneNumbers` | `schemas/calls.ts` | `(customerOrgId, isPrimary -1)`, `e164` unique |
| `aiTasks` | `schemas/ai-tasks.ts` | `(customerOrgId, status, createdAt -1)` |
| `aiSettings` | `schemas/ai-settings.ts` | `(customerOrgId, key)` unique |
| `integrations` | `schemas/integrations.ts` | `(orgId, kind)` unique |
| `customerTeam` | `schemas/customer-team.ts` | `(customerOrgId, role)` |
| `domains` | `schemas/domains.ts` | `(customerOrgId, isPrimary -1)` |
| `websitePages` | `schemas/website-pages.ts` | `(customerOrgId, slug)` unique, `(customerOrgId, status)` |
| `chatMessages` | `schemas/chat-messages.ts` | `(customerOrgId, conversationId, sentAt)` |
| `supportTickets` | `schemas/support-tickets.ts` | `(audience, orgId, lastUpdatedAt -1)`, `(audience, userId, lastUpdatedAt -1)` |
| `notificationPreferences` | `schemas/notification-preferences.ts` | `(orgId, key)`, `(userId, key)` |
| `brandPalettes` / `brandAssets` / `brandedDomains` / `brandVoices` | `schemas/branding.ts` | scoped by `agencyOrgId` |
| `onboardingFlows` / `onboardingSteps` / `serviceOptions` | `schemas/onboarding.ts` | scoped by `agencyOrgId` |
| `knowledgeArticles` / `faqs` | `schemas/support-tickets.ts` | `(audience, …)` |

## Run `ensureIndexes()` once after deploy

The app does **not** create indexes on startup. Hit the admin route once per environment:

```bash
curl -X POST http://localhost:3000/api/admin/ensure-indexes
```

Returns `{ ok: true, result: { created: { ... }, errors: [] } }`. Safe to re-run — Mongo
skips existing indexes that share the same spec.

## Smoke-test the connection

```bash
curl http://localhost:3000/api/health/db
# → { ok: true, ping: 27, db: "statxeo" }
```

## Adding a new entity

1. **Schema** — create `src/server/db/schemas/<entity>.ts` exporting:
   - `<Entity>Doc` (`_id: ObjectId`, server-side shape)
   - `<Entity>` (serialized client-side shape — `_id: string`, ISO date strings)
   - `<entity>InputSchema` (zod) for write paths
   - `serialize<Entity>(doc)` mapper
   - Any UI color maps (e.g. `<ENTITY>_STATUS_COLOR`) — they live with the type because
     views use both together and schemas have **no `"server-only"` directive**, so they're
     safe to import from client components.
2. **Collection** — add an entry to `COLLECTION_NAMES` and the `collections` object in
   `src/server/db/collections.ts`.
3. **Indexes** — add a `safeCreate(...)` block to `src/server/db/indexes.ts` so deploys
   stay idempotent.
4. **Query** — add read-only `async function`s to the appropriate file in
   `src/server/queries/` (or create a new domain file). Always return already-serialized
   shapes (`return docs.map(serialize<Entity>)`).
5. **Action** — if the new entity needs writes, add a `"use server"` module under
   `src/server/actions/` that validates `FormData` with the zod schema and returns
   `{ ok: true, data } | { ok: false, error }`.

## Empty by design

There is **no seed data**. Every collection starts empty. Every query returns `[]` or
`null` when the database is empty, and every view renders a polished `EmptyState`
(`src/widgets/empty-state.tsx`) in that case. Do **not** add demo rows — the user has
explicitly asked that this app grow from real user input only.

## Server-only boundary

- `client.ts`, `database.ts`, `collections.ts`, `indexes.ts`, `context.ts`, every file in
  `queries/` and `actions/` start with `import "server-only"`.
- Schema files **do not** import `server-only` because views and widgets that run in the
  browser need the exported types and color maps. They only do type-level imports from
  `mongodb` (`import type { ObjectId } from "mongodb"`), so they don't pull the driver
  into the client bundle.
- If you ever import a query from a `"use client"` file, Next.js will reject the build.
  Always fetch in the route's `page.tsx` (Server Component by default) and pass results
  down as props.
