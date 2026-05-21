import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export interface BrandPaletteDoc extends BaseDoc {
  agencyOrgId: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

export interface BrandPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

export const brandPaletteInputSchema = z.object({
  agencyOrgId: z.string().min(1),
  name: z.string().min(1),
  primary: z.string().min(1),
  secondary: z.string().min(1),
  accent: z.string().min(1),
  background: z.string().min(1),
  foreground: z.string().min(1),
});
export type BrandPaletteInput = z.infer<typeof brandPaletteInputSchema>;

export function serializeBrandPalette(doc: BrandPaletteDoc): BrandPalette {
  return {
    id: idToString(doc._id),
    name: doc.name,
    primary: doc.primary,
    secondary: doc.secondary,
    accent: doc.accent,
    background: doc.background,
    foreground: doc.foreground,
  };
}

export interface BrandAssetDoc extends BaseDoc {
  agencyOrgId: string;
  key: string;
  label: string;
  description: string;
  fileUrl: string | null;
}

export interface BrandAsset {
  id: string;
  label: string;
  description: string;
}

export function serializeBrandAsset(doc: BrandAssetDoc): BrandAsset {
  return {
    id: doc.key || idToString(doc._id),
    label: doc.label,
    description: doc.description,
  };
}

export const BRANDED_DOMAIN_TYPES = ["app", "email", "tracking"] as const;
export type BrandedDomainType = (typeof BRANDED_DOMAIN_TYPES)[number];

export const BRANDED_DOMAIN_STATUSES = ["Active", "Pending", "Error"] as const;
export type BrandedDomainStatus = (typeof BRANDED_DOMAIN_STATUSES)[number];

export interface BrandedDomainDoc extends BaseDoc {
  agencyOrgId: string;
  domain: string;
  type: BrandedDomainType;
  status: BrandedDomainStatus;
}

export interface BrandedDomain {
  id: string;
  domain: string;
  type: BrandedDomainType;
  status: BrandedDomainStatus;
}

export function serializeBrandedDomain(doc: BrandedDomainDoc): BrandedDomain {
  return {
    id: idToString(doc._id),
    domain: doc.domain,
    type: doc.type,
    status: doc.status,
  };
}

export interface BrandVoiceDoc extends BaseDoc {
  agencyOrgId: string;
  customerId: string | null;
  customerName: string;
  tone: string;
  personality: string;
  emoji: boolean;
  hashtags: number;
}

export interface BrandVoice {
  id: string;
  customer: string;
  tone: string;
  personality: string;
  emoji: boolean;
  hashtags: number;
}

export function serializeBrandVoice(doc: BrandVoiceDoc): BrandVoice {
  return {
    id: idToString(doc._id),
    customer: doc.customerName,
    tone: doc.tone,
    personality: doc.personality,
    emoji: doc.emoji,
    hashtags: doc.hashtags,
  };
}
