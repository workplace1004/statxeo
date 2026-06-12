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
  
  // Calculate stable mocks from document properties or hash of ID
  const hash = doc.domain.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const trend: "up" | "down" | "neutral" = hash % 3 === 0 ? "up" : hash % 3 === 1 ? "down" : "neutral";
  const trendValNum = (hash % 15) + 1;
  const trendValue = trend === "neutral" ? "0%" : `${trend === "up" ? "+" : "-"}${trendValNum}%`;
  
  const visibility = doc.visibilityScore ?? (hash % 30) + 10;
  const keywordsCount = (hash % 450) + 50;
  const domainRating = doc.averagePosition ? Math.max(1, 100 - doc.averagePosition) : (hash % 50) + 30;
  const overlap = (hash % 40) + 20;

  return {
    id: idToString(doc._id),
    domain: doc.domain,
    visibilityScore: visibility,
    averagePosition: doc.averagePosition ?? (100 - domainRating),
    name,
    trend,
    trendValue,
    visibility,
    keywords: keywordsCount,
    domainRating,
    overlap,
  };
}

