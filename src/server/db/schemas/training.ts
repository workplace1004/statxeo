import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export const TRAINING_STATUSES = ["Completed", "In Progress", "Not Started"] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export const TRAINING_CATEGORIES = ["Product", "Sales", "Compliance", "Demo"] as const;
export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number];

export const TRAINING_STATUS_COLORS: Record<TrainingStatus, ChipColor> = {
  Completed: "success",
  "In Progress": "warning",
  "Not Started": "default",
};

export interface TrainingModuleDoc extends BaseDoc {
  title: string;
  description: string;
  contentUrl: string | null;
  durationSeconds: number;
  lessons: number;
  category: TrainingCategory;
  isRequired: boolean;
  badge: string | null;
  thumbnail: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  durationMinutes: number;
  lessons: number;
  status: TrainingStatus;
  progress: number;
  badge?: string;
  thumbnail: string;
  isRequired: boolean;
}

export interface TrainingProgressDoc extends BaseDoc {
  userId: string;
  moduleId: string;
  percent: number;
  completedAt: Date | null;
}

export const trainingModuleInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  contentUrl: z.string().url().nullable().optional(),
  durationSeconds: z.number().int().min(0).default(0),
  lessons: z.number().int().min(0).default(1),
  category: z.enum(TRAINING_CATEGORIES).default("Product"),
  isRequired: z.boolean().default(false),
  badge: z.string().nullable().optional(),
  thumbnail: z.string().default("from-content2 via-content1 to-content2"),
});
export type TrainingModuleInput = z.infer<typeof trainingModuleInputSchema>;

export function serializeTrainingModule(
  doc: TrainingModuleDoc,
  progress: TrainingProgressDoc | null,
): TrainingModule {
  const percent = progress?.percent ?? 0;
  const status: TrainingStatus =
    percent >= 100 ? "Completed" : percent > 0 ? "In Progress" : "Not Started";

  return {
    id: idToString(doc._id),
    title: doc.title,
    description: doc.description,
    category: doc.category,
    durationMinutes: Math.round(doc.durationSeconds / 60),
    lessons: doc.lessons,
    status,
    progress: percent,
    badge: doc.badge ?? undefined,
    thumbnail: doc.thumbnail,
    isRequired: doc.isRequired,
  };
}
