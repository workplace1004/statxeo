import type {BaseDoc} from "./_helpers";

import {z} from "zod";

export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface BusinessProfileDoc extends BaseDoc {
  customerOrgId: string;
  name: string;
  tagline: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
  hours: string;
  address: BusinessAddress;
  serviceAreas: string[];
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
  hours: string;
  address: BusinessAddress;
  serviceAreas: string[];
}

const addressSchema = z.object({
  street: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  postalCode: z.string().default(""),
});

export const businessProfileInputSchema = z.object({
  customerOrgId: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().default(""),
  industry: z.string().default(""),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),
  website: z.string().default(""),
  hours: z.string().default(""),
  address: addressSchema.default({street: "", city: "", state: "", postalCode: ""}),
  serviceAreas: z.array(z.string()).default([]),
});
export type BusinessProfileInput = z.infer<typeof businessProfileInputSchema>;

export function serializeBusinessProfile(doc: BusinessProfileDoc): BusinessProfile {
  return {
    name: doc.name,
    tagline: doc.tagline,
    industry: doc.industry,
    email: doc.email,
    phone: doc.phone,
    website: doc.website,
    hours: doc.hours,
    address: doc.address,
    serviceAreas: doc.serviceAreas,
  };
}
