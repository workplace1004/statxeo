# Supabase removal rule

Supabase is **not** a dependency, fallback, shadow system, or runtime adapter.

All production behavior uses:

- Mongo collections (source of truth)
- `statxeo_session` (user auth)
- Scoped internal API keys (`api_keys` + env v1 keys)
- Object storage for large blobs (metadata in Mongo)
- `outbox_events` for external side effects
- `site_generation_events` for job history

Root Supabase-era code is behavioral reference only. Do not copy `lib/supabase` or add `@supabase/*` packages.

Run `pnpm check:no-supabase` in CI.
