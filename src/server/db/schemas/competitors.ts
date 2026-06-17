import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export interface CompetitorDoc extends BaseDoc {
  agencyOrgId: string;
  domain: string;
  visibilityScore: number;
  averagePosition: number;
}

export interface Competitor {
  id: string;
  domain: string;
  visibilityScore: number;
  averagePosition: number;
  name: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  visibility: number;
  keywords: number;
  domainRating: number;
  overlap: number;
}

export const competitorInputSchema = z.object({
  agencyOrgId: z.string().min(1),
  domain: z.string().min(1),
  visibilityScore: z.number().min(0).max(100).default(0),
  averagePosition: z.number().min(1).default(100),
});
export type CompetitorInput = z.infer<typeof competitorInputSchema>;

export function serializeCompetitor(doc: CompetitorDoc): Competitor {
  const domainParts = doc.domain.split(".");
  const name = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
  
  return {
    id: idToString(doc._id),
    domain: doc.domain,
    visibilityScore: doc.visibilityScore ?? 0,
    averagePosition: doc.averagePosition ?? 0,
    name,
    trend: "neutral",
    trendValue: "0%",
    visibility: doc.visibilityScore ?? 0,
    keywords: 0,
    domainRating: 0,
    overlap: 0,
  };
}

