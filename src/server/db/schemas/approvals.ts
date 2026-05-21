import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const APPROVAL_KINDS = ["social", "website", "content", "ads", "email"] as const;
export type ApprovalKind = (typeof APPROVAL_KINDS)[number];

export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export interface ApprovalDoc extends BaseDoc {
  orgId: string;
  customerId: string | null;
  customerName: string;
  customerAvatar: string | null;
  kind: ApprovalKind;
  summary: string;
  count: number;
  payloadRef: string | null;
  requestedBy: string | null;
  requestedAt: Date;
  dueAt: Date | null;
  status: ApprovalStatus;
}

export interface Approval {
  id: string;
  customer: string;
  customerAvatar: string;
  kind: ApprovalKind;
  summary: string;
  count: number;
  due: string;
}

export const approvalInputSchema = z.object({
  orgId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  customerName: z.string().default(""),
  customerAvatar: z.string().url().nullable().optional(),
  kind: z.enum(APPROVAL_KINDS),
  summary: z.string().min(1),
  count: z.number().int().min(1).default(1),
  payloadRef: z.string().nullable().optional(),
  requestedBy: z.string().nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
});
export type ApprovalInput = z.infer<typeof approvalInputSchema>;

export function serializeApproval(doc: ApprovalDoc): Approval {
  return {
    id: idToString(doc._id),
    customer: doc.customerName,
    customerAvatar: doc.customerAvatar ?? "",
    kind: doc.kind,
    summary: doc.summary,
    count: doc.count,
    due: doc.dueAt ? dateToIso(doc.dueAt) : "—",
  };
}
