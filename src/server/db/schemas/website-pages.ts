import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const PAGE_TYPES = ["Page", "Service", "Blog"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const PAGE_STATUSES = ["Published", "Draft", "Generating", "Needs review"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

export const PAGE_STATUS_COLORS: Record<PageStatus, ChipColor> = {
  Draft: "default",
  Generating: "accent",
  "Needs review": "warning",
  Published: "success",
};

export interface WebsitePageDoc extends BaseDoc {
  customerOrgId: string;
  title: string;
  slug: string;
  excerpt: string;
  pageType: PageType;
  status: PageStatus;
  views: number;
  conversion: number;
  aiGenerated: boolean;
  publishedAt: Date | null;
}

export interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  pageType: PageType;
  status: PageStatus;
  updatedAt: string;
  views: number;
  conversion: number;
  aiGenerated: boolean;
  excerpt: string;
}

export const websitePageInputSchema = z.object({
  customerOrgId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().default(""),
  pageType: z.enum(PAGE_TYPES).default("Page"),
  status: z.enum(PAGE_STATUSES).default("Draft"),
  views: z.number().int().min(0).default(0),
  conversion: z.number().min(0).default(0),
  aiGenerated: z.boolean().default(true),
});
export type WebsitePageInput = z.infer<typeof websitePageInputSchema>;

export function serializeWebsitePage(doc: WebsitePageDoc): WebsitePage {
  return {
    id: idToString(doc._id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    pageType: doc.pageType,
    status: doc.status,
    updatedAt: dateToIso(doc.updatedAt).slice(0, 10),
    views: doc.views,
    conversion: doc.conversion,
    aiGenerated: doc.aiGenerated,
  };
}
