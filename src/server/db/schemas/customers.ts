import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const CUSTOMER_STATUSES = ["Active", "Onboarding", "Paused", "Churned", "Trial"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const CUSTOMER_PLANS = ["Starter", "Growth", "Pro", "Enterprise"] as const;
export type CustomerPlan = (typeof CUSTOMER_PLANS)[number];

export const CUSTOMER_STATUS_COLOR: Record<CustomerStatus, ChipColor> = {
  Active: "success",
  Churned: "danger",
  Onboarding: "accent",
  Paused: "default",
  Trial: "warning",
};

export const CUSTOMER_PLAN_COLOR: Record<CustomerPlan, ChipColor> = {
  Enterprise: "accent",
  Growth: "success",
  Pro: "warning",
  Starter: "default",
};

export interface CustomerDoc extends BaseDoc {
  agencyOrgId: string;
  name: string;
  contactName: string;
  contactEmail: string;
  avatar: string | null;
  industry: string;
  city: string;
  plan: CustomerPlan;
  status: CustomerStatus;
  /** Monthly recurring revenue in cents. */
  mrrCents: number;
  /** Cached website count for list views. */
  sites: number;
  /** Cached tracked-keyword count for list views. */
  keywords: number;
  joinedAt: Date;
  lastActivityAt: Date | null;
  /** 0..100 health score. */
  health: number;
}

export interface Customer {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  avatar: string;
  industry: string;
  city: string;
  plan: CustomerPlan;
  status: CustomerStatus;
  /** Monthly recurring revenue in dollars (the view formats as currency). */
  mrr: number;
  sites: number;
  keywords: number;
  joinedAt: string;
  lastActivity: string;
  health: number;
}

export const customerInputSchema = z.object({
  agencyOrgId: z.string().min(1),
  name: z.string().min(1, "Customer name is required"),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  avatar: z.string().url().nullable().optional(),
  industry: z.string().min(1),
  city: z.string().min(1),
  plan: z.enum(CUSTOMER_PLANS),
  status: z.enum(CUSTOMER_STATUSES),
  mrrCents: z.number().int().min(0),
  sites: z.number().int().min(0).optional(),
  keywords: z.number().int().min(0).optional(),
  health: z.number().int().min(0).max(100).optional(),
});
export type CustomerInput = z.infer<typeof customerInputSchema>;

export function serializeCustomer(doc: CustomerDoc): Customer {
  return {
    id: idToString(doc._id),
    name: doc.name,
    contactName: doc.contactName,
    contactEmail: doc.contactEmail,
    avatar: doc.avatar ?? "",
    industry: doc.industry,
    city: doc.city,
    plan: doc.plan,
    status: doc.status,
    mrr: Math.round(doc.mrrCents / 100),
    sites: doc.sites,
    keywords: doc.keywords,
    joinedAt: dateToIso(doc.joinedAt).slice(0, 10),
    lastActivity: doc.lastActivityAt ? dateToIso(doc.lastActivityAt) : dateToIso(doc.updatedAt),
    health: doc.health,
  };
}
