import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const SOCIAL_PLATFORMS = [
  "Facebook",
  "Instagram",
  "TikTok",
  "LinkedIn",
  "X",
  "Google",
  "YouTube",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_STATUSES = [
  "Draft",
  "Scheduled",
  "Published",
  "Awaiting Approval",
  "Failed",
] as const;
export type SocialStatus = (typeof SOCIAL_STATUSES)[number];

export const SOCIAL_STATUS_COLOR: Record<SocialStatus, ChipColor> = {
  "Awaiting Approval": "warning",
  Draft: "default",
  Failed: "danger",
  Published: "success",
  Scheduled: "accent",
};

export interface SocialPostDoc extends BaseDoc {
  agencyOrgId: string | null;
  customerOrgId: string | null;
  customerId: string | null;
  customerName: string;
  customerAvatar: string | null;
  platform: SocialPlatform;
  status: SocialStatus;
  title: string;
  body: string;
  mediaUrls: string[];
  scheduledFor: Date;
  aiGenerated: boolean;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
  approvalRequestedAt: Date | null;
  approvedAt: Date | null;
}

export interface SocialPostAgency {
  id: string;
  customer: string;
  customerAvatar: string;
  platform: SocialPlatform;
  status: SocialStatus;
  caption: string;
  scheduledFor: string;
  engagement: number;
}

export interface SocialPostCustomer {
  id: string;
  title: string;
  body: string;
  platform: SocialPlatform;
  status: SocialStatus;
  scheduledFor: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
  aiGenerated: boolean;
}

export const socialPostInputSchema = z.object({
  agencyOrgId: z.string().nullable().optional(),
  customerOrgId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1),
  customerAvatar: z.string().url().nullable().optional(),
  platform: z.enum(SOCIAL_PLATFORMS),
  status: z.enum(SOCIAL_STATUSES),
  title: z.string().min(1),
  body: z.string().min(1),
  mediaUrls: z.array(z.string().url()).default([]),
  scheduledFor: z.coerce.date(),
  aiGenerated: z.boolean().default(true),
});
export type SocialPostInput = z.infer<typeof socialPostInputSchema>;

export function serializeSocialPostAgency(doc: SocialPostDoc): SocialPostAgency {
  const e = doc.engagement;

  return {
    id: idToString(doc._id),
    customer: doc.customerName,
    customerAvatar: doc.customerAvatar ?? "",
    platform: doc.platform,
    status: doc.status,
    caption: doc.body,
    scheduledFor: dateToIso(doc.scheduledFor),
    engagement: e.likes + e.comments + e.shares,
  };
}

export function serializeSocialPostCustomer(doc: SocialPostDoc): SocialPostCustomer {
  return {
    id: idToString(doc._id),
    title: doc.title,
    body: doc.body,
    platform: doc.platform,
    status: doc.status,
    scheduledFor: dateToIso(doc.scheduledFor),
    engagement: doc.engagement,
    aiGenerated: doc.aiGenerated,
  };
}
