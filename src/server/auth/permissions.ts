import "server-only";

import type {UserRole} from "@/server/db/schemas/users";

/**
 * All actions that can be permission-checked across the platform.
 *
 * Usage:
 *   import { can } from "@/server/auth/permissions";
 *   if (!can(session.role, "delete_site")) return forbidden();
 */
export const ACTIONS = [
  // Content & publishing
  "publish_content",     // publish AI-generated pages, posts, creatives
  "approve_content",     // review and approve AI output (approve gate)
  "generate_content",    // trigger AI generation jobs

  // Site management
  "create_site",
  "edit_site",
  "delete_site",         // ⚠️ destructive — restricted to owner/admin
  "modify_dns",          // ⚠️ infrastructure-level — restricted to owner/admin

  // Campaigns & marketing
  "manage_campaigns",    // create/edit/pause ad campaigns
  "view_campaigns",

  // Billing & payouts
  "view_billing",        // read billing records and invoices
  "modify_billing",      // ⚠️ write to billing — restricted
  "manage_payouts",      // payout controls — platform_admin only

  // Team & org
  "manage_team",         // invite/remove team members, change roles
  "manage_clients",      // create/edit/delete client records
  "view_clients",

  // Platform-level
  "impersonate_user",    // ⚠️ platform_admin only
  "manage_workflows",    // create and configure workflow definitions
  "view_analytics",
] as const;

export type Action = (typeof ACTIONS)[number];

/**
 * Permission map: role → set of allowed actions.
 * This is the single source of truth for access control.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Set<Action>> = {
  // ── Platform Admin — full access ──────────────────────────────────────
  platform_admin: new Set(ACTIONS),

  // ── Agency Owner — full access within own tenant ──────────────────────
  agency_owner: new Set([
    "publish_content",
    "approve_content",
    "generate_content",
    "create_site",
    "edit_site",
    "delete_site",
    "modify_dns",
    "manage_campaigns",
    "view_campaigns",
    "view_billing",
    "modify_billing",
    "manage_team",
    "manage_clients",
    "view_clients",
    "manage_workflows",
    "view_analytics",
  ]),

  // ── Agency Staff — operations, no billing/DNS/delete ──────────────────
  agency_staff: new Set([
    "publish_content",
    "approve_content",
    "generate_content",
    "create_site",
    "edit_site",
    "manage_campaigns",
    "view_campaigns",
    "view_billing",
    "manage_clients",
    "view_clients",
    "manage_workflows",
    "view_analytics",
  ]),

  // ── Agency Member — read + limited task access ─────────────────────────
  agency_member: new Set([
    "generate_content",
    "view_campaigns",
    "view_clients",
    "view_billing",
    "view_analytics",
  ]),

  // ── Content Reviewer — approve AI outputs only ────────────────────────
  content_reviewer: new Set([
    "approve_content",
    "view_clients",
    "view_analytics",
  ]),

  // ── Billing Manager — billing/payout read+write only ─────────────────
  billing_manager: new Set([
    "view_billing",
    "modify_billing",
    "view_analytics",
  ]),

  // ── Customer Owner — full access within own client org ────────────────
  customer_owner: new Set([
    "approve_content",
    "generate_content",
    "edit_site",
    "view_campaigns",
    "view_billing",
    "manage_team",
    "view_clients",
    "view_analytics",
  ]),

  // ── Customer Member — limited operational access ──────────────────────
  customer_member: new Set([
    "approve_content",
    "view_campaigns",
    "view_analytics",
  ]),

  // ── Affiliate — referral & analytics only ─────────────────────────────
  affiliate: new Set([
    "view_analytics",
    "view_billing",
  ]),
};

/**
 * Check whether a role is permitted to perform an action.
 *
 * @example
 *   can("content_reviewer", "delete_site")  // false
 *   can("platform_admin", "impersonate_user")  // true
 *   can("agency_owner", "modify_dns")  // true
 */
export function can(role: UserRole, action: Action): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

/**
 * Assert that a role is permitted. Throws a structured 403 error if not.
 * Use inside API route handlers.
 *
 * @example
 *   assertCan(session.role, "delete_site");
 */
export function assertCan(role: UserRole, action: Action): void {
  if (!can(role, action)) {
    throw new PermissionError(role, action);
  }
}

export class PermissionError extends Error {
  readonly status = 403;
  readonly code = "FORBIDDEN";
  readonly role: UserRole;
  readonly action: Action;

  constructor(role: UserRole, action: Action) {
    super(`Role '${role}' is not permitted to perform '${action}'`);
    this.name = "PermissionError";
    this.role = role;
    this.action = action;
  }
}

/**
 * Check if a role has platform-level (global) access.
 */
export function isPlatformAdmin(role: UserRole): boolean {
  return role === "platform_admin";
}

/**
 * Check if a role is an agency-level role (owner or staff).
 */
export function isAgencyRole(role: UserRole): boolean {
  return (
    role === "agency_owner" ||
    role === "agency_staff" ||
    role === "agency_member" ||
    role === "content_reviewer" ||
    role === "billing_manager"
  );
}
