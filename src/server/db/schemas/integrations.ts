import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export const INTEGRATION_KINDS = [
  "gbp",
  "ga4",
  "stripe",
  "yelp",
  "facebook",
  "statxt",
  "statxe",
  "bing",
  "instagram",
] as const;
export type IntegrationKind = (typeof INTEGRATION_KINDS)[number];

export const INTEGRATION_STATUSES = ["Connected", "Disconnected", "Coming soon"] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const INTEGRATION_CATEGORIES = [
  "Listings",
  "Payments",
  "Comms",
  "Analytics",
  "Reviews",
] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export const INTEGRATION_STATUS_COLORS: Record<IntegrationStatus, ChipColor> = {
  "Coming soon": "warning",
  Connected: "success",
  Disconnected: "default",
};

export interface IntegrationDoc extends BaseDoc {
  orgId: string;
  kind: IntegrationKind;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  connectedAccount: string | null;
  initial: string;
  accent: string;
  settings: Record<string, unknown>;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  connectedAccount?: string;
  initial: string;
  accent: string;
}

export const integrationInputSchema = z.object({
  orgId: z.string().min(1),
  kind: z.enum(INTEGRATION_KINDS),
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.enum(INTEGRATION_CATEGORIES),
  status: z.enum(INTEGRATION_STATUSES).default("Disconnected"),
  connectedAccount: z.string().nullable().optional(),
  initial: z.string().length(1),
  accent: z.string().default("bg-content2 text-foreground"),
  settings: z.record(z.string(), z.unknown()).default({}),
});
export type IntegrationInput = z.infer<typeof integrationInputSchema>;

export function serializeIntegration(doc: IntegrationDoc): Integration {
  return {
    id: idToString(doc._id),
    name: doc.name,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    connectedAccount: doc.connectedAccount ?? undefined,
    initial: doc.initial,
    accent: doc.accent,
  };
}
