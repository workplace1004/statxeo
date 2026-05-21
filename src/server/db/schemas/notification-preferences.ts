import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export interface NotificationPreferenceDoc extends BaseDoc {
  orgId: string | null;
  userId: string | null;
  key: string;
  label: string;
  description: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  email: boolean;
  sms: boolean;
}

export const notificationPreferenceInputSchema = z.object({
  orgId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().default(""),
  channels: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(false),
  }),
});
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceInputSchema>;

export function serializeNotificationPreference(
  doc: NotificationPreferenceDoc,
): NotificationPreference {
  return {
    id: idToString(doc._id),
    label: doc.label,
    description: doc.description,
    email: doc.channels.email,
    sms: doc.channels.sms,
  };
}
