import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export const CUSTOMER_KEYWORD_INTENTS = ["Local", "Commercial", "Informational", "Brand"] as const;
export type CustomerKeywordIntent = (typeof CUSTOMER_KEYWORD_INTENTS)[number];

export interface CustomerKeywordDoc extends BaseDoc {
  customerOrgId: string;
  keyword: string;
  /** Target URL on the customer's own site. */
  url: string;
  position: number | null;
  previousPosition: number | null;
  searchVolume: number;
  difficulty: number;
  intent: CustomerKeywordIntent;
  lastCheckedAt: Date | null;
}

export interface CustomerKeyword {
  id: string;
  keyword: string;
  position: number;
  previousPosition: number;
  change: number;
  searchVolume: number;
  difficulty: number;
  url: string;
  intent: CustomerKeywordIntent;
}

export const customerKeywordInputSchema = z.object({
  customerOrgId: z.string().min(1),
  keyword: z.string().min(1),
  url: z.string().min(1).default("/"),
  position: z.number().int().min(0).nullable().optional(),
  previousPosition: z.number().int().min(0).nullable().optional(),
  searchVolume: z.number().int().min(0).default(0),
  difficulty: z.number().int().min(0).max(100).default(0),
  intent: z.enum(CUSTOMER_KEYWORD_INTENTS).default("Local"),
});
export type CustomerKeywordInput = z.infer<typeof customerKeywordInputSchema>;

export function serializeCustomerKeyword(doc: CustomerKeywordDoc): CustomerKeyword {
  const position = doc.position ?? 0;
  const previousPosition = doc.previousPosition ?? position;

  return {
    id: idToString(doc._id),
    keyword: doc.keyword,
    position,
    previousPosition,
    change: previousPosition - position,
    searchVolume: doc.searchVolume,
    difficulty: doc.difficulty,
    url: doc.url,
    intent: doc.intent,
  };
}
