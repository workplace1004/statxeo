import type {BaseDoc} from "./_helpers";
import {z} from "zod";
import {dateToIso, idToString} from "./_helpers";

export const CREATIVE_STATUSES = ["draft", "approved", "active", "paused", "failed"] as const;
export type CreativeStatus = (typeof CREATIVE_STATUSES)[number];

export const CAMPAIGN_STATUSES = ["draft", "pending_approval", "active", "paused", "failed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export interface Creative {
  type: "video" | "image";
  url: string;
  headline: string;
  description: string;
  ctr: number;
  conversionRate: number;
  spend: number;
  status: CreativeStatus;
  aiPrompt?: string;
  generationId?: string;
}

export interface PerformanceHistory {
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface CampaignDoc extends BaseDoc {
  clientOrgId: string;
  whiteLabelerId: string;
  campaignName: string;
  channel: "meta" | "google";
  metaCampaignId?: string;
  googleCampaignId?: string;
  budget: {
    dailyLimit: number;
    totalAllocated: number;
    spendToDate: number;
  };
  status: CampaignStatus;
  keywords: string[];
  creatives: Creative[];
  guardrails: {
    maxDailyDrift: number;
    autoPauseFatigueScore: number;
  };
  performanceHistory: PerformanceHistory[];
}

export interface SerializedPerformanceHistory {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface Campaign {
  id: string;
  clientOrgId: string;
  whiteLabelerId: string;
  campaignName: string;
  channel: "meta" | "google";
  metaCampaignId?: string;
  googleCampaignId?: string;
  budget: {
    dailyLimit: number;
    totalAllocated: number;
    spendToDate: number;
  };
  status: CampaignStatus;
  keywords: string[];
  creatives: Creative[];
  guardrails: {
    maxDailyDrift: number;
    autoPauseFatigueScore: number;
  };
  performanceHistory: SerializedPerformanceHistory[];
  createdAt: string;
  updatedAt: string;
}

export const creativeInputSchema = z.object({
  type: z.enum(["video", "image"]),
  url: z.string().url(),
  headline: z.string().min(1),
  description: z.string().min(1),
  ctr: z.number().default(0),
  conversionRate: z.number().default(0),
  spend: z.number().default(0),
  status: z.enum(CREATIVE_STATUSES).default("draft"),
  aiPrompt: z.string().optional(),
  generationId: z.string().optional(),
});

export const campaignInputSchema = z.object({
  clientOrgId: z.string().min(1),
  whiteLabelerId: z.string().min(1),
  campaignName: z.string().min(1, "Campaign name is required"),
  channel: z.enum(["meta", "google"]),
  metaCampaignId: z.string().optional(),
  googleCampaignId: z.string().optional(),
  budget: z.object({
    dailyLimit: z.number().positive(),
    totalAllocated: z.number().positive(),
    spendToDate: z.number().default(0),
  }),
  status: z.enum(CAMPAIGN_STATUSES).default("draft"),
  keywords: z.array(z.string()).default([]),
  creatives: z.array(creativeInputSchema).default([]),
  guardrails: z.object({
    maxDailyDrift: z.number().default(0.2),
    autoPauseFatigueScore: z.number().default(0.8),
  }).default({ maxDailyDrift: 0.2, autoPauseFatigueScore: 0.8 }),
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;

export function serializeCampaign(doc: CampaignDoc): Campaign {
  return {
    id: idToString(doc._id),
    clientOrgId: doc.clientOrgId,
    whiteLabelerId: doc.whiteLabelerId,
    campaignName: doc.campaignName,
    channel: doc.channel,
    metaCampaignId: doc.metaCampaignId,
    googleCampaignId: doc.googleCampaignId,
    budget: doc.budget,
    status: doc.status,
    keywords: doc.keywords,
    creatives: doc.creatives ?? [],
    guardrails: doc.guardrails,
    performanceHistory: (doc.performanceHistory ?? []).map((p) => ({
      date: dateToIso(p.date).slice(0, 10),
      impressions: p.impressions,
      clicks: p.clicks,
      conversions: p.conversions,
      spend: p.spend,
    })),
    createdAt: dateToIso(doc.createdAt),
    updatedAt: dateToIso(doc.updatedAt),
  };
}
