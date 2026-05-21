# Site projects backfill

v1: **ignore** legacy Supabase rows. New Mongo collections are authoritative when `SITE_PROJECTS_MONGO_ENABLED=true`.

Optional later backfill:

1. Dry-run export from Supabase tables.
2. Validate with Zod public DTO schemas.
3. Import into Mongo with idempotency keys per source row.
4. Report mismatches without mutating published revisions.
