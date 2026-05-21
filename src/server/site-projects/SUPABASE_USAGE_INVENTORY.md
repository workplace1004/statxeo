# Supabase usage inventory → Mongo replacement map

Supabase is **reference-only**. Production uses Mongo + `statxeo_session` + scoped API keys + object storage.

**Scope:** `lib/statxeo` was removed. Site-projects + AI generation use **`lib/statxai`** (pipeline) and **`server/site-projects`** (domain) only.

## Site-projects pipeline (`lib/statxai`)

| Old pattern | Replacement |
|-------------|-------------|
| `.from("statxeo_site_projects")` | `statxai-store.ts` → `findProjectById`, `updateProjectFields` |
| `.from("statxeo_site_generation_jobs")` | `statxai-store.updateJob`, `statxai-store.getJob` |
| `.from("statxeo_site_generation_artifacts")` | `statxai-store.writeArtifact`, `readArtifactPayload` |
| `.from("statxeo_site_change_requests")` | `reconcile-change-requests.ts` + repositories |
| `.from("statxeo_site_intake_submissions")` | `statxai-store` intake helpers |
| `.from("statxeo_site_media_assets")` | `repositories.listMedia` / store |
| `.from("statxeo_leads")` | `siteLeads` collection via `statxai-store` |
| `.from("statxeo_lead_images")` | `leadImages` collection |
| `.from("statxeo_site_template_registry")` | `siteTemplateRegistry` collection |
| `getStatxaiSupabase()` | **Removed** — use `@/server/site-projects/statxai-store` |

## Auth

| Old | Replacement |
|-----|-------------|
| `getApiUser` / Supabase session | `getSession()` + `resolveRequestContext()` |
| `SUPABASE_SERVICE_ROLE_KEY` | Scoped `STATXAI_API_KEY` / `api_keys` collection |
| Service-role bearer | `resolveInternalApiKey()` + permissions matrix |

## White-label social (Mongo, not statxeo lib)

| Concern | Replacement |
|---------|-------------|
| `statxeo_white_labeler_social_accounts` | `whiteLabelerSocialAccounts` collection + `service.completeSocialCallback` |

## Storage

| Old | Replacement |
|-----|-------------|
| Supabase Storage buckets | Object storage (S3/R2/Vercel Blob); Mongo holds `storageKey` metadata |

## CI enforcement

Run `pnpm check:no-supabase` — fails on `@supabase`, `SUPABASE_`, `.from("statxeo_`, `lib/supabase`.
