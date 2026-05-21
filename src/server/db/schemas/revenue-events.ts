import type {BaseDoc} from "./_helpers";

import {z} from "zod";

export const REVENUE_KINDS = ["subscription", "addon", "usage", "expansion", "churn"] as const;
export type RevenueKind = (typeof REVENUE_KINDS)[number];

export interface RevenueEventDoc extends BaseDoc {
  orgId: string;
  customerId: string | null;
  kind: RevenueKind;
  amountCents: number;
  currency: string;
  occurredAt: Date;
}

export const revenueEventInputSchema = z.object({
  orgId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  kind: z.enum(REVENUE_KINDS),
  amountCents: z.number().int(),
  currency: z.string().length(3).default("USD"),
  occurredAt: z.coerce.date(),
});
export type RevenueEventInput = z.infer<typeof revenueEventInputSchema>;
