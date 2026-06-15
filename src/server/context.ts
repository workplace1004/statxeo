import "server-only";

import {redirect} from "next/navigation";

import {PERSONA_ONBOARDING_PATH} from "./auth/constants";
import {getSession} from "./auth/session";
import {collections} from "./db/collections";
import {idToString} from "./db/schemas/_helpers";

/**
 * Resolve the signed-in user's DB record.
 *
 * - No session     → redirect to /login/partners (middleware should have caught this)
 * - No DB user     → redirect to onboarding (first sign-in, record not seeded)
 * - Has user       → return the doc
 *
 * Results are NOT cached across calls in a single render — Next.js Server
 * Components are pure async functions, so callers can call this once and
 * destructure what they need.
 */
async function requireCurrentUser() {
  const session = await getSession();
  if (!session) {
    redirect("/login/partners");
  }

  const c = await collections.users();
  const user = await c.findOne({
    $or: [{googleSub: session.sub}, {email: session.email}],
  });

  if (!user) {
    redirect(PERSONA_ONBOARDING_PATH[session.persona]);
  }

  return user;
}

/**
 * Returns the agency org ID for the currently signed-in white-label user.
 * Redirects to onboarding if the user has not yet completed setup.
 */
export async function getCurrentAgencyOrgId(): Promise<string> {
  const user = await requireCurrentUser();
  if (!user.organizationId) {
    redirect(PERSONA_ONBOARDING_PATH["white-label"]);
  }
  return user.organizationId;
}

/**
 * Returns the customer org ID for the currently signed-in customer user.
 * Redirects to onboarding if the user has not yet completed setup.
 */
export async function getCurrentCustomerOrgId(): Promise<string> {
  const user = await requireCurrentUser();
  if (!user.organizationId) {
    redirect(PERSONA_ONBOARDING_PATH["customer"]);
  }
  return user.organizationId;
}

/**
 * Returns the user ID that scopes all affiliate data (referral links, leads,
 * commissions). Affiliates are identified by their own user _id, not an org.
 */
export async function getCurrentAffiliateUserId(): Promise<string> {
  const user = await requireCurrentUser();
  return idToString(user._id);
}

