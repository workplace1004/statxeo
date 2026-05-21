import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export const KEYWORD_INTENTS = ["Local", "Transactional", "Informational", "Navigational"] as const;
export type KeywordIntent = (typeof KEYWORD_INTENTS)[number];

export interface KeywordDoc extends BaseDoc {
  agencyOrgId: string;
  customerId: string;
  customerName: string;
  term: string;
  locale: string;
  locationCity: string;
  rank: number | null;
  prevRank: number | null;
  volume: number;
  difficulty: number;
  intent: KeywordIntent;
  ctr: number;
  lastCheckedAt: Date | null;
}

export interface Keyword {
  id: string;
  term: string;
  customer: string;
  city: string;
  rank: number;
  previousRank: number;
  volume: number;
  difficulty: number;
  intent: KeywordIntent;
  ctr: number;
}

export const keywordInputSchema = z.object({
  agencyOrgId: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  term: z.string().min(1),
  locale: z.string().default("en-US"),
  locationCity: z.string().default(""),
  rank: z.number().int().min(0).nullable().optional(),
  prevRank: z.number().int().min(0).nullable().optional(),
  volume: z.number().int().min(0).default(0),
  difficulty: z.number().int().min(0).max(100).default(0),
  intent: z.enum(KEYWORD_INTENTS).default("Local"),
  ctr: z.number().min(0).max(1).default(0),
});
export type KeywordInput = z.infer<typeof keywordInputSchema>;

export function serializeKeyword(doc: KeywordDoc): Keyword {
  return {
    id: idToString(doc._id),
    term: doc.term,
    customer: doc.customerName,
    city: doc.locationCity,
    rank: doc.rank ?? 0,
    previousRank: doc.prevRank ?? 0,
    volume: doc.volume,
    difficulty: doc.difficulty,
    intent: doc.intent,
    ctr: doc.ctr,
  };
}
