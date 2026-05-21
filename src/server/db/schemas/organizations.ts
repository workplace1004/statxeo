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
}

export interface OrganizationDoc extends BaseDoc {
  type: OrganizationType;
  name: string;
  ownerUserId: string | null;
  brand: BrandSettings;
}

export interface Organization {
  id: string;
  type: OrganizationType;
  name: string;
  ownerUserId: string | null;
  brand: BrandSettings;
  createdAt: string;
  updatedAt: string;
}

export const brandSettingsSchema = z.object({
  logoLightUrl: z.string().url().nullable(),
  logoDarkUrl: z.string().url().nullable(),
  primaryColor: z.string().nullable(),
  secondaryColor: z.string().nullable(),
  accentColor: z.string().nullable(),
  customDomain: z.string().nullable(),
  emailFrom: z.string().email().nullable(),
});

export const organizationInputSchema = z.object({
  type: z.enum(ORG_TYPES),
  name: z.string().min(1),
  ownerUserId: z.string().nullable().optional(),
  brand: brandSettingsSchema.partial().optional(),
});
export type OrganizationInput = z.infer<typeof organizationInputSchema>;

export function serializeOrganization(doc: OrganizationDoc): Organization {
  return {
    id: idToString(doc._id),
    type: doc.type,
    name: doc.name,
    ownerUserId: doc.ownerUserId,
    brand: doc.brand,
    createdAt: dateToIso(doc.createdAt),
    updatedAt: dateToIso(doc.updatedAt),
  };
}
