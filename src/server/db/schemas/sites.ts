import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const SITE_STATUSES = ["Published", "Draft", "Generating", "Review", "Archived"] as const;
export type SiteStatus = (typeof SITE_STATUSES)[number];

export const SITE_STATUS_COLOR: Record<SiteStatus, ChipColor> = {
  Archived: "default",
  Draft: "warning",
  Generating: "accent",
  Published: "success",
  Review: "warning",
};

export interface SiteDoc extends BaseDoc {
  agencyOrgId: string;
  customerId: string | null;
  customerName: string;
  customerAvatar: string | null;
  name: string;
  domain: string;
  themeId: string | null;
  themeLabel: string;
  status: SiteStatus;
  pages: number;
  lastPublishedAt: Date | null;
  monthlyVisits: number;
  previewUrl: string | null;
  tier?: string | null;
}

export interface Site {
  id: string;
  customer: string;
  customerAvatar: string;
  domain: string;
  theme: string;
  status: SiteStatus;
  pages: number;
  lastPublished: string;
  monthlyVisits: number;
  preview: string;
  tier: string | null;
}

export const siteInputSchema = z.object({
  agencyOrgId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1),
  customerAvatar: z.string().url().nullable().optional(),
  name: z.string().min(1),
  domain: z.string().min(1),
  themeLabel: z.string().min(1),
  status: z.enum(SITE_STATUSES),
  pages: z.number().int().min(0).optional(),
  monthlyVisits: z.number().int().min(0).optional(),
  previewUrl: z.string().url().nullable().optional(),
  tier: z.string().nullable().optional(),
});
export type SiteInput = z.infer<typeof siteInputSchema>;

export function serializeSite(doc: SiteDoc): Site {
  return {
    id: idToString(doc._id),
    customer: doc.customerName,
    customerAvatar: doc.customerAvatar ?? "",
    domain: doc.domain,
    theme: doc.themeLabel,
    status: doc.status,
    pages: doc.pages,
    lastPublished: doc.lastPublishedAt ? dateToIso(doc.lastPublishedAt).slice(0, 10) : "—",
    monthlyVisits: doc.monthlyVisits,
    preview: doc.previewUrl ?? "",
    tier: doc.tier ?? "Standard",
  };
}
