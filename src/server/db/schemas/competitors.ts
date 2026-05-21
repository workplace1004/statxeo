import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export interface CompetitorDoc extends BaseDoc {
  customerOrgId: string;
  name: string;
  website: string;
  visibility: number;
  delta: number;
  keywords: number;
  overlap: number;
  domainRating: number;
}

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  visibility: number;
  delta: number;
  keywords: number;
  overlap: number;
  domainRating: number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
}

export const competitorInputSchema = z.object({
  customerOrgId: z.string().min(1),
  name: z.string().min(1),
  website: z.string().min(1),
  visibility: z.number().min(0).max(100).default(0),
  delta: z.number().default(0),
  keywords: z.number().int().min(0).default(0),
  overlap: z.number().int().min(0).max(100).default(0),
  domainRating: z.number().int().min(0).max(100).default(0),
});
export type CompetitorInput = z.infer<typeof competitorInputSchema>;

export function serializeCompetitor(doc: CompetitorDoc): Competitor {
  const trend: Competitor["trend"] = doc.delta > 0.5 ? "up" : doc.delta < -0.5 ? "down" : "neutral";

  return {
    id: idToString(doc._id),
    name: doc.name,
    domain: doc.website,
    visibility: doc.visibility,
    delta: doc.delta,
    keywords: doc.keywords,
    overlap: doc.overlap,
    domainRating: doc.domainRating,
    trend,
    trendValue: `${Math.abs(doc.delta).toFixed(1)}%`,
  };
}
