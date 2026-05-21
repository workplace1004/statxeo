import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const MEETING_STATUSES = ["Confirmed", "Tentative", "Reschedule", "Completed", "Canceled"] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const MEETING_KINDS = ["Demo", "Discovery", "Follow-up"] as const;
export type MeetingKind = (typeof MEETING_KINDS)[number];

export const MEETING_STATUS_COLORS: Record<MeetingStatus, ChipColor> = {
  Canceled: "danger",
  Completed: "default",
  Confirmed: "success",
  Reschedule: "warning",
  Tentative: "accent",
};

export interface MeetingDoc extends BaseDoc {
  affiliateUserId: string;
  prospectId: string | null;
  company: string;
  attendeeName: string;
  attendeeAvatar: string | null;
  repUserId: string | null;
  repName: string;
  repAvatar: string | null;
  title: string;
  kind: MeetingKind;
  scheduledFor: Date;
  durationMinutes: number;
  status: MeetingStatus;
  joinUrl: string;
}

export interface Meeting {
  id: string;
  title: string;
  company: string;
  attendeeName: string;
  attendeeAvatar: string;
  rep: {
    name: string;
    avatar: string;
  };
  start: string;
  end: string;
  display: string;
  status: MeetingStatus;
  type: MeetingKind;
  joinUrl: string;
}

export const meetingInputSchema = z.object({
  affiliateUserId: z.string().min(1),
  prospectId: z.string().nullable().optional(),
  company: z.string().min(1),
  attendeeName: z.string().min(1),
  attendeeAvatar: z.string().url().nullable().optional(),
  repUserId: z.string().nullable().optional(),
  repName: z.string().min(1),
  repAvatar: z.string().url().nullable().optional(),
  title: z.string().min(1),
  kind: z.enum(MEETING_KINDS).default("Demo"),
  scheduledFor: z.coerce.date(),
  durationMinutes: z.number().int().min(0).default(30),
  status: z.enum(MEETING_STATUSES).default("Confirmed"),
  joinUrl: z.string().min(1).default(""),
});
export type MeetingInput = z.infer<typeof meetingInputSchema>;

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZoneName: "short",
});
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {month: "short", day: "numeric"});

function display(start: Date): string {
  return `${DATE_FORMATTER.format(start)} · ${TIME_FORMATTER.format(start)}`;
}

export function serializeMeeting(doc: MeetingDoc): Meeting {
  const start = doc.scheduledFor;
  const end = new Date(start.getTime() + doc.durationMinutes * 60_000);

  return {
    id: idToString(doc._id),
    title: doc.title,
    company: doc.company,
    attendeeName: doc.attendeeName,
    attendeeAvatar: doc.attendeeAvatar ?? "",
    rep: {name: doc.repName, avatar: doc.repAvatar ?? ""},
    start: dateToIso(start),
    end: dateToIso(end),
    display: display(start),
    status: doc.status,
    type: doc.kind,
    joinUrl: doc.joinUrl,
  };
}
