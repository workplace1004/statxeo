import "server-only";

import type {GoogleAuthPersona} from "@/server/auth/constants";

import {forbidden} from "./errors";

/** Canonical actions — single source of truth for authorization. */
export const SITE_PROJECT_ACTIONS = [
  "project.read",
  "project.create",
  "project.update",
  "project.delete",
  "generation.enqueue",
  "generation.approve",
  "generation.cancel",
  "media.upload",
  "changeRequest.create",
  "publish.execute",
  "publish.rollback",
  "social.callback.complete",
  "reconcile.run",
  "operator.retry",
  "operator.cancel",
  "operator.releaseLease",
] as const;

export type SiteProjectAction = (typeof SITE_PROJECT_ACTIONS)[number];

export type AuthPrincipalType =
  | "customer"
  | "agency"
  | "wl_admin"
  | "affiliate"
  | "api_key"
  | "system_worker";

const MATRIX: Record<AuthPrincipalType, ReadonlySet<SiteProjectAction>> = {
  customer: new Set([
    "project.read",
    "project.update",
    "generation.enqueue",
    "generation.approve",
    "generation.cancel",
    "media.upload",
    "changeRequest.create",
  ]),
  agency: new Set([
    "project.read",
    "project.create",
    "project.update",
    "generation.enqueue",
    "generation.approve",
    "generation.cancel",
    "media.upload",
    "changeRequest.create",
    "publish.execute",
    "publish.rollback",
    "social.callback.complete",
  ]),
  wl_admin: new Set([
    "project.read",
    "project.create",
    "project.update",
    "project.delete",
    "generation.enqueue",
    "generation.approve",
    "generation.cancel",
    "media.upload",
    "changeRequest.create",
    "publish.execute",
    "publish.rollback",
    "social.callback.complete",
    "operator.retry",
    "operator.cancel",
    "operator.releaseLease",
  ]),
  affiliate: new Set([]),
  api_key: new Set(["reconcile.run", "generation.enqueue"]),
  system_worker: new Set([
    "project.read",
    "generation.enqueue",
    "reconcile.run",
    "operator.retry",
    "operator.cancel",
    "operator.releaseLease",
  ]),
};

export function personaToPrincipal(persona: GoogleAuthPersona): AuthPrincipalType {
  if (persona === "customer") return "customer";
  if (persona === "white-label") return "agency";
  return "affiliate";
}

export function canPerform(principal: AuthPrincipalType, action: SiteProjectAction): boolean {
  return MATRIX[principal].has(action);
}

export function assertPermission(
  ctx: {principal: AuthPrincipalType; apiKeyScopes: string[]},
  action: SiteProjectAction,
): void {
  if (!canPerform(ctx.principal, action)) {
    throw forbidden(`Principal ${ctx.principal} cannot perform ${action}`);
  }
  if (
    ctx.principal === "api_key" &&
    !ctx.apiKeyScopes.includes("*") &&
    !ctx.apiKeyScopes.includes(action)
  ) {
    throw forbidden(`API key missing scope: ${action}`);
  }
}
