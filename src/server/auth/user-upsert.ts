import "server-only";

import type {GoogleUserProfile} from "./google-oauth";
import {collections} from "../db/collections";

/**
 * Find-or-create the DB user record that corresponds to a Google sign-in.
 *
 * Lookup order:
 *  1. Match on `googleSub` (fast, indexed, stable)
 *  2. Fall back to `email` — this handles legacy seed/manually-created users
 *     that were created before `googleSub` was tracked
 *
 * On match, we backfill `googleSub` (if missing) and keep `name`/`avatarUrl`
 * in sync with the latest profile from Google.
 */
export async function upsertUserFromGoogle(profile: GoogleUserProfile): Promise<void> {
  const c = await collections.users();
  const now = new Date();

  const existing = await c.findOne({
    $or: [{googleSub: profile.sub}, {email: profile.email}],
  });

  if (existing) {
    await c.updateOne(
      {_id: existing._id},
      {
        $set: {
          googleSub: profile.sub,
          name: profile.name ?? existing.name,
          avatarUrl: profile.picture ?? existing.avatarUrl,
          updatedAt: now,
        },
      },
    );
    return;
  }

  // New user — create a minimal record. They'll be directed to onboarding
  // where role / accountType / organizationId will be filled in.
  await c.insertOne({
    googleSub: profile.sub,
    email: profile.email,
    name: profile.name ?? profile.email,
    avatarUrl: profile.picture ?? null,
    role: "customer_owner",
    accountType: "customer",
    organizationId: null,
    createdAt: now,
    updatedAt: now,
  } as never);
}
