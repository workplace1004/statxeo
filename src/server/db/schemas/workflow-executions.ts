import type {BaseDoc} from "./_helpers";
import {z} from "zod";
import {dateToIso, idToString} from "./_helpers";

export const WORKFLOW_TYPES = ["ad_campaign", "seo_generation", "site_generation", "social_schedule", "local_seo"] as const;
export type WorkflowType = (typeof WORKFLOW_TYPES)[number];

export const WORKFLOW_STATUSES = ["queued", "running", "completed", "failed", "cancelled"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export interface StateTransition {
  stage: string;
  status: string;
  transitionedAt: Date;
  errorMessage?: string;
}

export interface Snapshot {
  version: number;
  createdAt: Date;
  createdBy: string;
  payload: Record<string, any>;
}

export interface AuditLog {
  timestamp: Date;
  actor: "system" | "user" | "ai";
  action: string;
  description: string;
  meta?: Record<string, any>;
}

export interface WorkflowExecutionDoc extends BaseDoc {
  projectId?: string;
  campaignId?: string;
  whiteLabelerId: string;
  clientOrgId?: string;
  /** Original client intent prompt — captured at Scene 1 */
  intent?: string;
  workflowType: WorkflowType;
  status: WorkflowStatus;
  stage: string;
  history: StateTransition[];
  snapshots: Snapshot[];
  auditLogs: AuditLog[];
}

export interface SerializedStateTransition {
  stage: string;
  status: string;
  transitionedAt: string;
  errorMessage?: string;
}

export interface SerializedSnapshot {
  version: number;
  createdAt: string;
  createdBy: string;
  payload: Record<string, any>;
}

export interface SerializedAuditLog {
  timestamp: string;
  actor: "system" | "user" | "ai";
  action: string;
  description: string;
  meta?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  projectId?: string;
  campaignId?: string;
  whiteLabelerId: string;
  clientOrgId?: string;
  intent?: string;
  workflowType: WorkflowType;
  status: WorkflowStatus;
  stage: string;
  history: SerializedStateTransition[];
  snapshots: SerializedSnapshot[];
  auditLogs: SerializedAuditLog[];
  createdAt: string;
  updatedAt: string;
}

export const workflowExecutionInputSchema = z.object({
  projectId: z.string().optional(),
  campaignId: z.string().optional(),
  whiteLabelerId: z.string().min(1),
  clientOrgId: z.string().optional(),
  intent: z.string().optional(),
  workflowType: z.enum(WORKFLOW_TYPES),
  status: z.enum(WORKFLOW_STATUSES).default("queued"),
  stage: z.string().min(1),
  history: z.array(z.object({
    stage: z.string(),
    status: z.string(),
    transitionedAt: z.date().or(z.string().transform((v) => new Date(v))).default(() => new Date()),
    errorMessage: z.string().optional(),
  })).default([]),
  snapshots: z.array(z.object({
    version: z.number().int(),
    createdAt: z.date().or(z.string().transform((v) => new Date(v))).default(() => new Date()),
    createdBy: z.string(),
    payload: z.record(z.string(), z.any()).default({}),
  })).default([]),
  auditLogs: z.array(z.object({
    timestamp: z.date().or(z.string().transform((v) => new Date(v))).default(() => new Date()),
    actor: z.enum(["system", "user", "ai"]),
    action: z.string(),
    description: z.string(),
    meta: z.record(z.string(), z.any()).optional(),
  })).default([]),
});

export type WorkflowExecutionInput = z.infer<typeof workflowExecutionInputSchema>;

export function serializeWorkflowExecution(doc: WorkflowExecutionDoc): WorkflowExecution {
  return {
    id: idToString(doc._id),
    projectId: doc.projectId,
    campaignId: doc.campaignId,
    whiteLabelerId: doc.whiteLabelerId,
    clientOrgId: doc.clientOrgId,
    intent: doc.intent,
    workflowType: doc.workflowType,
    status: doc.status,
    stage: doc.stage,
    history: (doc.history ?? []).map((h) => ({
      stage: h.stage,
      status: h.status,
      transitionedAt: dateToIso(h.transitionedAt),
      errorMessage: h.errorMessage,
    })),
    snapshots: (doc.snapshots ?? []).map((s) => ({
      version: s.version,
      createdAt: dateToIso(s.createdAt),
      createdBy: s.createdBy,
      payload: s.payload ?? {},
    })),
    auditLogs: (doc.auditLogs ?? []).map((a) => ({
      timestamp: dateToIso(a.timestamp),
      actor: a.actor,
      action: a.action,
      description: a.description,
      meta: a.meta,
    })),
    createdAt: dateToIso(doc.createdAt),
    updatedAt: dateToIso(doc.updatedAt),
  };
}
