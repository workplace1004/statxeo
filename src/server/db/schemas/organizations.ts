import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const ORG_TYPES = ["agency", "customer", "affiliate"] as const;
export type OrganizationType = (typeof ORG_TYPES)[number];

export interface BrandSettings {
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  customDomain: string | null;
  emailFrom: string | null;
  emailFromName: string | null;
  emailFromAddress: string | null;
  emailFooter: string | null;
  emailHideBranding: boolean | null;
  loginHeadline: string | null;
  loginSubhead: string | null;
  loginBgUrl: string | null;
}

export interface OrganizationDoc extends BaseDoc {
  type: OrganizationType;
  name: string;
  ownerUserId: string | null;
  brand: BrandSettings;
  timezone?: string | null;
  defaultAiTone?: string | null;
  showPoweredByBadge?: boolean | null;
  stripeConnected?: boolean | null;
}

export interface Organization {
  id: string;
  type: OrganizationType;
  name: string;
  ownerUserId: string | null;
  brand: BrandSettings;
  timezone: string | null;
  defaultAiTone: string | null;
  showPoweredByBadge: boolean | null;
  stripeConnected: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export const brandSettingsSchema = z.object({
  logoLightUrl: z.string().nullable(),
  logoDarkUrl: z.string().nullable(),
  primaryColor: z.string().nullable(),
  secondaryColor: z.string().nullable(),
  accentColor: z.string().nullable(),
  customDomain: z.string().nullable(),
  emailFrom: z.string().nullable(),
  emailFromName: z.string().nullable(),
  emailFromAddress: z.string().nullable(),
  emailFooter: z.string().nullable(),
  emailHideBranding: z.boolean().nullable(),
  loginHeadline: z.string().nullable(),
  loginSubhead: z.string().nullable(),
  loginBgUrl: z.string().nullable(),
});

export const organizationInputSchema = z.object({
  type: z.enum(ORG_TYPES),
  name: z.string().min(1),
  ownerUserId: z.string().nullable().optional(),
  brand: brandSettingsSchema.partial().optional(),
  timezone: z.string().nullable().optional(),
  defaultAiTone: z.string().nullable().optional(),
  showPoweredByBadge: z.boolean().nullable().optional(),
  stripeConnected: z.boolean().nullable().optional(),
});
export type OrganizationInput = z.infer<typeof organizationInputSchema>;

export function serializeOrganization(doc: OrganizationDoc): Organization {
  return {
    id: idToString(doc._id),
    type: doc.type,
    name: doc.name,
    ownerUserId: doc.ownerUserId,
    brand: doc.brand,
    timezone: doc.timezone ?? null,
    defaultAiTone: doc.defaultAiTone ?? null,
    showPoweredByBadge: doc.showPoweredByBadge ?? null,
    stripeConnected: doc.stripeConnected ?? null,
    createdAt: dateToIso(doc.createdAt),
    updatedAt: dateToIso(doc.updatedAt),
  };
}
