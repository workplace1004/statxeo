import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const CALL_DIRECTIONS = ["Inbound", "Outbound", "Missed"] as const;
export type CallType = (typeof CALL_DIRECTIONS)[number];

export const CALL_TAGS = [
  "Booking request",
  "Quote request",
  "Service follow-up",
  "Spam",
  "Existing customer",
  "Emergency",
] as const;
export type CallTag = (typeof CALL_TAGS)[number];

export const CALL_TAG_COLORS: Record<CallTag, ChipColor> = {
  "Booking request": "success",
  Emergency: "danger",
  "Existing customer": "accent",
  "Quote request": "warning",
  "Service follow-up": "default",
  Spam: "default",
};

export interface CallDoc extends BaseDoc {
  customerOrgId: string;
  callerName: string;
  fromNumber: string;
  toNumber: string;
  direction: CallType;
  durationSeconds: number;
  startedAt: Date;
  recordingUrl: string | null;
  transcriptId: string | null;
  aiSummary: string;
  tag: CallTag;
  aiTags: string[];
  bookedJob: boolean;
}

export interface Call {
  id: string;
  callerName: string;
  callerPhone: string;
  direction: CallType;
  durationSeconds: number;
  startedAt: string;
  tag: CallTag;
  aiSummary: string;
  bookedJob: boolean;
  recordingUrl?: string;
}

export const callInputSchema = z.object({
  customerOrgId: z.string().min(1),
  callerName: z.string().default("Unknown caller"),
  fromNumber: z.string().min(1),
  toNumber: z.string().min(1),
  direction: z.enum(CALL_DIRECTIONS).default("Inbound"),
  durationSeconds: z.number().int().min(0).default(0),
  startedAt: z.coerce.date().default(() => new Date()),
  recordingUrl: z.string().url().nullable().optional(),
  transcriptId: z.string().nullable().optional(),
  aiSummary: z.string().default(""),
  tag: z.enum(CALL_TAGS).default("Quote request"),
  aiTags: z.array(z.string()).default([]),
  bookedJob: z.boolean().default(false),
});
export type CallInput = z.infer<typeof callInputSchema>;

export function serializeCall(doc: CallDoc): Call {
  return {
    id: idToString(doc._id),
    callerName: doc.callerName,
    callerPhone: doc.fromNumber,
    direction: doc.direction,
    durationSeconds: doc.durationSeconds,
    startedAt: dateToIso(doc.startedAt),
    tag: doc.tag,
    aiSummary: doc.aiSummary,
    bookedJob: doc.bookedJob,
    recordingUrl: doc.recordingUrl ?? undefined,
  };
}

export const PHONE_TYPES = ["Local", "Toll-free"] as const;
export type PhoneType = (typeof PHONE_TYPES)[number];

export interface PhoneNumberDoc extends BaseDoc {
  customerOrgId: string;
  e164: string;
  label: string;
  type: PhoneType;
  providerRef: string | null;
  forwardingTo: string;
  isPrimary: boolean;
}

export interface PhoneNumber {
  number: string;
  label: string;
  type: PhoneType;
  forwardingTo: string;
  isPrimary: boolean;
}

export function serializePhoneNumber(doc: PhoneNumberDoc): PhoneNumber {
  return {
    number: doc.e164,
    label: doc.label,
    type: doc.type,
    forwardingTo: doc.forwardingTo,
    isPrimary: doc.isPrimary,
  };
}
