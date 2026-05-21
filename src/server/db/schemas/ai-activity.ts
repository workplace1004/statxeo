import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const ACTIVITY_KINDS = [
  "seo",
  "content",
  "social",
  "automation",
  "website",
  "lead",
  "review",
  "call",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface AiActivityDoc extends BaseDoc {
  orgId: string;
  customerId: string | null;
  customerName: string;
  kind: ActivityKind;
  title: string;
  summary: string;
  agentName: string;
  occurredAt: Date;
}

export interface AiActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  customer: string;
  timestamp: string;
  agent: string;
}

export const aiActivityInputSchema = z.object({
  orgId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  customerName: z.string().default(""),
  kind: z.enum(ACTIVITY_KINDS),
  title: z.string().min(1),
  summary: z.string().default(""),
  agentName: z.string().default("StatXEO"),
  occurredAt: z.coerce.date().default(() => new Date()),
});
export type AiActivityInput = z.infer<typeof aiActivityInputSchema>;

export function serializeAiActivity(doc: AiActivityDoc): AiActivity {
  return {
    id: idToString(doc._id),
    kind: doc.kind,
    title: doc.title,
    customer: doc.customerName,
    timestamp: dateToIso(doc.occurredAt),
    agent: doc.agentName,
  };
}
