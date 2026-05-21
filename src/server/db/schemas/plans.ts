import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export const PLAN_INTERVALS = ["monthly", "annual"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export interface PlanDoc extends BaseDoc {
  slug: string;
  name: string;
  tagline: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  /** Affiliate commission % against MRR. */
  commissionPercent: number;
  highlight: boolean;
  highlights: string[];
  ctaLabel: string;
}

export interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  commissionPercent: number;
  highlight?: boolean;
  highlights: readonly string[];
  ctaLabel: string;
}

export const planInputSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().default(""),
  monthlyPriceCents: z.number().int().min(0),
  annualPriceCents: z.number().int().min(0),
  commissionPercent: z.number().min(0).max(100),
  highlight: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
  ctaLabel: z.string().default("Choose plan"),
});
export type PlanInput = z.infer<typeof planInputSchema>;

export function serializePlan(doc: PlanDoc): PlanTier {
  return {
    id: idToString(doc._id),
    name: doc.name,
    tagline: doc.tagline,
    monthlyPrice: Math.round(doc.monthlyPriceCents / 100),
    annualPrice: Math.round(doc.annualPriceCents / 100),
    commissionPercent: doc.commissionPercent,
    highlight: doc.highlight,
    highlights: doc.highlights,
    ctaLabel: doc.ctaLabel,
  };
}
