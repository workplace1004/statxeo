import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export interface AiSettingDoc extends BaseDoc {
  customerOrgId: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  position: number;
}

export interface AiSettings {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const aiSettingInputSchema = z.object({
  customerOrgId: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().default(""),
  enabled: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
});
export type AiSettingInput = z.infer<typeof aiSettingInputSchema>;

export function serializeAiSetting(doc: AiSettingDoc): AiSettings {
  return {
    id: idToString(doc._id),
    label: doc.label,
    description: doc.description,
    enabled: doc.enabled,
  };
}
