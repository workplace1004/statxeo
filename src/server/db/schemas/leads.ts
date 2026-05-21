import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export const LEAD_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Demo Booked",
  "Closed Won",
  "Closed Lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_SOURCES = [
  "Cold Email",
  "QR Code",
  "Newsletter",
  "Social",
  "Referral",
  "Webinar",
  "Other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const STAGE_INDICATOR: Record<LeadStage, string> = {
  Contacted: "bg-warning",
  "Closed Lost": "bg-danger",
  "Closed Won": "bg-success",
  "Demo Booked": "bg-accent",
  New: "bg-muted",
  Qualified: "bg-accent",
};

export interface LeadTag {
  color: ChipColor;
  label: string;
}

export interface LeadDoc extends BaseDoc {
  affiliateUserId: string;
  company: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactAvatar: string | null;
  industry: string;
  source: LeadSource;
  stage: LeadStage;
  /** Deal value in cents. */
  dealValueCents: number;
  expectedCloseDate: Date | null;
  notes: string | null;
  tag: LeadTag;
}

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  contactAvatar: string;
  contactRole: string;
  dealValue: number;
  stage: LeadStage;
  source: LeadSource;
  industry: string;
  expectedClose: string;
  note?: string;
  tag: LeadTag;
}

const tagSchema = z.object({
  color: z.enum(["accent", "success", "warning", "danger", "default"]),
  label: z.string().min(1),
});

export const leadInputSchema = z.object({
  affiliateUserId: z.string().min(1),
  company: z.string().min(1),
  contactName: z.string().min(1),
  contactRole: z.string().default(""),
  contactEmail: z.string().email(),
  contactAvatar: z.string().url().nullable().optional(),
  industry: z.string().default(""),
  source: z.enum(LEAD_SOURCES).default("Other"),
  stage: z.enum(LEAD_STAGES).default("New"),
  dealValueCents: z.number().int().min(0).default(0),
  expectedCloseDate: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  tag: tagSchema.default({color: "default", label: "New"}),
});
export type LeadInput = z.infer<typeof leadInputSchema>;

function formatExpectedClose(d: Date | null): string {
  if (!d) return "—";

  return d.toLocaleDateString("en-US", {day: "2-digit", month: "short"});
}

export function serializeLead(doc: LeadDoc): Lead {
  return {
    id: idToString(doc._id),
    company: doc.company,
    contactName: doc.contactName,
    contactAvatar: doc.contactAvatar ?? "",
    contactRole: doc.contactRole,
    dealValue: Math.round(doc.dealValueCents / 100),
    stage: doc.stage,
    source: doc.source,
    industry: doc.industry,
    expectedClose: formatExpectedClose(doc.expectedCloseDate),
    note: doc.notes ?? undefined,
    tag: doc.tag,
  };
}
