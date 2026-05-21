import "server-only";

/**
 * Temporary export surface for the generation pipeline data layer.
 * This is **not** a Supabase adapter — all reads/writes go to Mongo via `statxai-store`.
 *
 * @deprecated Import from `@/server/site-projects/statxai-store` directly.
 */
export * from "./statxai-store";
