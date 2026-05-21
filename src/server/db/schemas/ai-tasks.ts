import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const AI_TASK_STATUSES = ["Completed", "Running", "Suggested", "Waiting for approval"] as const;
export type AiTaskStatus = (typeof AI_TASK_STATUSES)[number];

export const AI_TASK_CATEGORIES = ["Content", "SEO", "Reviews", "Calls", "Social"] as const;
export type AiTaskCategory = (typeof AI_TASK_CATEGORIES)[number];

export const AI_TASK_IMPACTS = ["high", "medium", "low"] as const;
export type AiTaskImpact = (typeof AI_TASK_IMPACTS)[number];

export const AI_TASK_STATUS_COLORS: Record<AiTaskStatus, ChipColor> = {
  Completed: "success",
  Running: "accent",
  Suggested: "default",
  "Waiting for approval": "warning",
};

export interface AiTaskDoc extends BaseDoc {
  customerOrgId: string;
  title: string;
  description: string;
  status: AiTaskStatus;
  category: AiTaskCategory;
  impact: AiTaskImpact;
  completedAt: Date | null;
}

export interface AiTask {
  id: string;
  title: string;
  description: string;
  status: AiTaskStatus;
  category: AiTaskCategory;
  impact: AiTaskImpact;
  completedAt?: string;
}

export const aiTaskInputSchema = z.object({
  customerOrgId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  status: z.enum(AI_TASK_STATUSES).default("Suggested"),
  category: z.enum(AI_TASK_CATEGORIES).default("Content"),
  impact: z.enum(AI_TASK_IMPACTS).default("medium"),
});
export type AiTaskInput = z.infer<typeof aiTaskInputSchema>;

const RELATIVE = new Intl.RelativeTimeFormat("en-US", {numeric: "auto"});

function relativeOrDate(date: Date): string {
  const diffMin = Math.round((date.getTime() - Date.now()) / 60_000);

  if (Math.abs(diffMin) < 60) return RELATIVE.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);

  if (Math.abs(diffH) < 24) return RELATIVE.format(diffH, "hour");

  return dateToIso(date).slice(0, 10);
}

export function serializeAiTask(doc: AiTaskDoc): AiTask {
  return {
    id: idToString(doc._id),
    title: doc.title,
    description: doc.description,
    status: doc.status,
    category: doc.category,
    impact: doc.impact,
    completedAt: doc.completedAt ? relativeOrDate(doc.completedAt) : undefined,
  };
}
