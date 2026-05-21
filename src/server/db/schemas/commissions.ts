import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const COMMISSION_KINDS = ["Paid", "Pending", "Upcoming", "Clawback"] as const;
export type CommissionStatus = (typeof COMMISSION_KINDS)[number];

export const COMMISSION_STATUS_COLORS: Record<CommissionStatus, ChipColor> = {
  Clawback: "danger",
  Paid: "success",
  Pending: "warning",
  Upcoming: "default",
};

export interface CommissionDoc extends BaseDoc {
  affiliateUserId: string;
  leadId: string | null;
  reference: string;
  company: string;
  plan: string;
  /** Signed amount in cents (clawbacks are negative). */
  amountCents: number;
  currency: string;
  status: CommissionStatus;
  closedDate: Date;
  payoutDate: Date | null;
  reason: string | null;
}

export interface Commission {
  id: string;
  reference: string;
  company: string;
  plan: string;
  amount: number;
  currency: string;
  status: CommissionStatus;
  closedDate: string;
  payoutDate?: string;
  reason?: string;
}

export const commissionInputSchema = z.object({
  affiliateUserId: z.string().min(1),
  leadId: z.string().nullable().optional(),
  reference: z.string().min(1),
  company: z.string().min(1),
  plan: z.string().min(1),
  amountCents: z.number().int(),
  currency: z.string().length(3).default("USD"),
  status: z.enum(COMMISSION_KINDS).default("Pending"),
  closedDate: z.coerce.date(),
  payoutDate: z.coerce.date().nullable().optional(),
  reason: z.string().nullable().optional(),
});
export type CommissionInput = z.infer<typeof commissionInputSchema>;

export function serializeCommission(doc: CommissionDoc): Commission {
  return {
    id: idToString(doc._id),
    reference: doc.reference,
    company: doc.company,
    plan: doc.plan,
    amount: Math.round(doc.amountCents / 100),
    currency: doc.currency,
    status: doc.status,
    closedDate: dateToIso(doc.closedDate).slice(0, 10),
    payoutDate: doc.payoutDate ? dateToIso(doc.payoutDate).slice(0, 10) : undefined,
    reason: doc.reason ?? undefined,
  };
}

export const PAYOUT_METHODS = ["ACH", "Wire", "PayPal"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const PAYOUT_STATUSES = ["Sent", "Processing", "Scheduled"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export interface PayoutDoc extends BaseDoc {
  affiliateUserId: string;
  reference: string;
  amountCents: number;
  currency: string;
  method: PayoutMethod;
  status: PayoutStatus;
  scheduledFor: Date;
}

export interface Payout {
  id: string;
  reference: string;
  date: string;
  amount: number;
  currency: string;
  method: PayoutMethod;
  status: PayoutStatus;
}

export function serializePayout(doc: PayoutDoc): Payout {
  return {
    id: idToString(doc._id),
    reference: doc.reference,
    date: dateToIso(doc.scheduledFor).slice(0, 10),
    amount: Math.round(doc.amountCents / 100),
    currency: doc.currency,
    method: doc.method,
    status: doc.status,
  };
}
