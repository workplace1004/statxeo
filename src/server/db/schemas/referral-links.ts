import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const LINK_STATUSES = ["active", "paused", "archived"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export const LINK_CHANNELS = ["email", "social", "blog", "qr", "widget", "ads"] as const;
export type LinkChannel = (typeof LINK_CHANNELS)[number];

export const LINK_STATUS_COLOR: Record<LinkStatus, ChipColor> = {
  active: "success",
  archived: "default",
  paused: "warning",
};

export interface UtmParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
}

export interface ReferralLinkDoc extends BaseDoc {
  affiliateUserId: string;
  slug: string;
  destinationPath: string;
  url: string;
  campaign: string;
  channel: LinkChannel;
  utmParams: UtmParams;
  clicks: number;
  conversions: number;
  /** Earnings per click in cents. */
  epcCents: number;
  status: LinkStatus;
}

export interface ReferralLink {
  id: string;
  campaign: string;
  url: string;
  channel: LinkChannel;
  clicks: number;
  conversions: number;
  epc: number;
  status: LinkStatus;
  createdAt: string;
}

export const referralLinkInputSchema = z.object({
  affiliateUserId: z.string().min(1),
  slug: z.string().min(1),
  destinationPath: z.string().default("/"),
  campaign: z.string().min(1),
  channel: z.enum(LINK_CHANNELS).default("email"),
  utmParams: z
    .object({
      source: z.string().nullable().default(null),
      medium: z.string().nullable().default(null),
      campaign: z.string().nullable().default(null),
      term: z.string().nullable().default(null),
      content: z.string().nullable().default(null),
    })
    .default({source: null, medium: null, campaign: null, term: null, content: null}),
  status: z.enum(LINK_STATUSES).default("active"),
});
export type ReferralLinkInput = z.infer<typeof referralLinkInputSchema>;

export function serializeReferralLink(doc: ReferralLinkDoc): ReferralLink {
  return {
    id: idToString(doc._id),
    campaign: doc.campaign,
    url: doc.url,
    channel: doc.channel,
    clicks: doc.clicks,
    conversions: doc.conversions,
    epc: doc.epcCents / 100,
    status: doc.status,
    createdAt: dateToIso(doc.createdAt).slice(0, 10),
  };
}
