import "server-only";

import {can, PermissionError} from "@/server/auth/permissions";
import type {UserRole} from "@/server/db/schemas/users";
import type {SessionPayload} from "@/server/auth/session";
import {collections} from "@/server/db/collections";

/**
 * AI Safety Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side hard guards enforcing the 4 core AI safety rules from the
 * XEO Architecture Planning doc:
 *
 *  1. AI must NOT auto-publish without a matching approved Approval record
 *  2. AI must NOT override billing
 *  3. AI must NOT delete production sites
 *  4. AI must NOT modify DNS without explicit owner/admin permission
 *
 * Each guard:
 *  - Throws an AiSafetyError (403) if the check fails
 *  - Writes an audit log entry to the workflow-executions collection
 *
 * Usage in any API route handler:
 *   await assertCanPublish({ orgId, actorEmail, workflowId });
 */

// ─────────────────────────────────────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────────────────────────────────────

export class AiSafetyError extends Error {
  readonly status = 403;
  readonly code = "AI_SAFETY_VIOLATION";
  readonly rule: string;

  constructor(rule: string, detail: string) {
    super(`[AI Safety] ${rule}: ${detail}`);
    this.name = "AiSafetyError";
    this.rule = rule;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: write a safety audit trail entry
// ─────────────────────────────────────────────────────────────────────────────

async function writeAuditEntry(opts: {
  workflowId?: string;
  actor: string;
  action: string;
  description: string;
  allowed: boolean;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const col = await collections.workflowExecutions();
    if (!opts.workflowId) return;
    await col.updateOne(
      {_id: opts.workflowId as any},
      {
        $push: {
          auditLogs: {
            timestamp: new Date(),
            actor: "system",
            action: opts.action,
            description: opts.description,
            meta: {
              actorEmail: opts.actor,
              allowed: opts.allowed,
              ...(opts.meta ?? {}),
            },
          },
        },
        $set: {updatedAt: new Date()},
      },
    );
  } catch {
    // Audit logging must never block the main flow
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Guard 1 — Publish gate
// AI must not auto-publish without an approved Approval record
// ─────────────────────────────────────────────────────────────────────────────

export async function assertCanPublish(opts: {
  orgId: string;
  approvalId: string;
  actorEmail: string;
  workflowId?: string;
}): Promise<void> {
  const {orgId, approvalId, actorEmail, workflowId} = opts;

  const col = await collections.approvals();
  const approval = await col.findOne({
    _id: approvalId as any,
    orgId,
    status: "approved",
  });

  const allowed = approval !== null;

  await writeAuditEntry({
    workflowId,
    actor: actorEmail,
    action: "ai_publish_check",
    description: allowed
      ? `Publish approved via approval record ${approvalId}`
      : `Publish BLOCKED — no approved record found for approvalId=${approvalId} in org=${orgId}`,
    allowed,
    meta: {approvalId, orgId},
  });

  if (!allowed) {
    throw new AiSafetyError(
      "PUBLISH_WITHOUT_APPROVAL",
      `No approved Approval record found (approvalId=${approvalId}, orgId=${orgId}). ` +
        `AI cannot auto-publish — a human must approve first.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Guard 1B — Ads Mutation gate
// AI must not pause ads or shift budgets without an approved Approval record
// ─────────────────────────────────────────────────────────────────────────────

export async function assertCanMutateAds(opts: {
  orgId: string;
  approvalId: string | undefined;
  actorEmail: string;
  workflowId?: string;
}): Promise<void> {
  const {orgId, approvalId, actorEmail, workflowId} = opts;

  if (!approvalId) {
    await writeAuditEntry({
      workflowId,
      actor: actorEmail,
      action: "ai_ads_mutation_check",
      description: `Ads mutation BLOCKED — no approvalId provided for org=${orgId}`,
      allowed: false,
      meta: {orgId},
    });
    throw new AiSafetyError(
      "ADS_MUTATION_WITHOUT_APPROVAL",
      `AI cannot mutate ads autonomously without a prior human approval record.`
    );
  }

  const col = await collections.approvals();
  const approval = await col.findOne({
    _id: approvalId as any,
    orgId,
    status: "approved",
  });

  const allowed = approval !== null;

  await writeAuditEntry({
    workflowId,
    actor: actorEmail,
    action: "ai_ads_mutation_check",
    description: allowed
      ? `Ads mutation approved via approval record ${approvalId}`
      : `Ads mutation BLOCKED — no approved record found for approvalId=${approvalId} in org=${orgId}`,
    allowed,
    meta: {approvalId, orgId},
  });

  if (!allowed) {
    throw new AiSafetyError(
      "ADS_MUTATION_WITHOUT_APPROVAL",
      `No approved Approval record found (approvalId=${approvalId}, orgId=${orgId}). ` +
        `AI cannot autonomously pause ads or shift budgets.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Guard 2 — Billing mutation gate
// AI must not override billing — restricted to owner/admin/billing_manager
// ─────────────────────────────────────────────────────────────────────────────

export async function assertCanModifyBilling(opts: {
  role: UserRole;
  actorEmail: string;
  workflowId?: string;
}): Promise<void> {
  const {role, actorEmail, workflowId} = opts;
  const allowed = can(role, "modify_billing");

  await writeAuditEntry({
    workflowId,
    actor: actorEmail,
    action: "ai_billing_check",
    description: allowed
      ? `Billing modification permitted for role=${role}`
      : `Billing modification BLOCKED for role=${role}`,
    allowed,
    meta: {role},
  });

  if (!allowed) {
    throw new PermissionError(role, "modify_billing");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Guard 3 — Site deletion gate
// AI must not delete production sites — only agency_owner or platform_admin
// ─────────────────────────────────────────────────────────────────────────────

export async function assertCanDeleteSite(opts: {
  role: UserRole;
  actorEmail: string;
  siteId: string;
  workflowId?: string;
}): Promise<void> {
  const {role, actorEmail, siteId, workflowId} = opts;
  const allowed = can(role, "delete_site");

  await writeAuditEntry({
    workflowId,
    actor: actorEmail,
    action: "ai_site_delete_check",
    description: allowed
      ? `Site deletion permitted for role=${role}, siteId=${siteId}`
      : `Site deletion BLOCKED for role=${role} on siteId=${siteId}`,
    allowed,
    meta: {role, siteId},
  });

  if (!allowed) {
    throw new AiSafetyError(
      "DELETE_SITE_WITHOUT_PERMISSION",
      `Role '${role}' cannot delete production sites. ` +
        `Only agency_owner and platform_admin may perform this action. (siteId=${siteId})`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Guard 4 — DNS modification gate
// AI must not modify DNS without explicit owner/admin permission
// ─────────────────────────────────────────────────────────────────────────────

export async function assertCanModifyDns(opts: {
  role: UserRole;
  actorEmail: string;
  domain: string;
  workflowId?: string;
}): Promise<void> {
  const {role, actorEmail, domain, workflowId} = opts;
  const allowed = can(role, "modify_dns");

  await writeAuditEntry({
    workflowId,
    actor: actorEmail,
    action: "ai_dns_check",
    description: allowed
      ? `DNS modification permitted for role=${role}, domain=${domain}`
      : `DNS modification BLOCKED for role=${role} on domain=${domain}`,
    allowed,
    meta: {role, domain},
  });

  if (!allowed) {
    throw new AiSafetyError(
      "MODIFY_DNS_WITHOUT_PERMISSION",
      `Role '${role}' cannot modify DNS records. ` +
        `Only agency_owner and platform_admin may change DNS. (domain=${domain})`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: convert any safety/permission error to a NextResponse-ready shape
// ─────────────────────────────────────────────────────────────────────────────

export function safetyErrorToResponse(err: unknown): {
  status: number;
  body: {ok: false; error: {code: string; message: string}};
} {
  if (err instanceof AiSafetyError) {
    return {
      status: 403,
      body: {ok: false, error: {code: err.code, message: err.message}},
    };
  }
  if (err instanceof PermissionError) {
    return {
      status: 403,
      body: {ok: false, error: {code: err.code, message: err.message}},
    };
  }
  return {
    status: 500,
    body: {ok: false, error: {code: "INTERNAL_ERROR", message: "Internal server error"}},
  };
}
