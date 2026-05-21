import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const WORKFLOW_STATUSES = ["Active", "Paused", "Draft", "Error"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const WORKFLOW_TRIGGERS = [
  "New lead",
  "Form submission",
  "Review posted",
  "Schedule",
  "Rank change",
  "Booking",
  "Webhook",
] as const;
export type WorkflowTrigger = (typeof WORKFLOW_TRIGGERS)[number];

export const WORKFLOW_STATUS_COLOR: Record<WorkflowStatus, ChipColor> = {
  Active: "success",
  Draft: "default",
  Error: "danger",
  Paused: "warning",
};

export interface WorkflowDoc extends BaseDoc {
  agencyOrgId: string;
  customerId: string | null;
  customerName: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: number;
  enabled: boolean;
  runsLast7Days: number;
  successRate: number;
  actions: unknown;
  lastRunAt: Date | null;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: number;
  runsLast7Days: number;
  successRate: number;
  customer: string;
  updatedAt: string;
}

export const workflowInputSchema = z.object({
  agencyOrgId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  status: z.enum(WORKFLOW_STATUSES),
  trigger: z.enum(WORKFLOW_TRIGGERS),
  steps: z.number().int().min(0).default(0),
  enabled: z.boolean().default(true),
});
export type WorkflowInput = z.infer<typeof workflowInputSchema>;

export function serializeWorkflow(doc: WorkflowDoc): Workflow {
  return {
    id: idToString(doc._id),
    name: doc.name,
    description: doc.description,
    status: doc.status,
    trigger: doc.trigger,
    steps: doc.steps,
    runsLast7Days: doc.runsLast7Days,
    successRate: doc.successRate,
    customer: doc.customerName,
    updatedAt: dateToIso(doc.updatedAt).slice(0, 10),
  };
}
