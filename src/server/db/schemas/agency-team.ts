import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const AGENCY_TEAM_ROLES = [
  "Owner",
  "Admin",
  "Account Manager",
  "SEO Specialist",
  "Designer",
  "Viewer",
] as const;
export type AgencyTeamRole = (typeof AGENCY_TEAM_ROLES)[number];

export const AGENCY_TEAM_STATUSES = ["Active", "Invited", "Suspended"] as const;
export type AgencyTeamStatus = (typeof AGENCY_TEAM_STATUSES)[number];

export const TEAM_ROLE_COLOR: Record<AgencyTeamRole, ChipColor> = {
  Admin: "warning",
  "Account Manager": "success",
  Designer: "default",
  Owner: "accent",
  "SEO Specialist": "success",
  Viewer: "default",
};

export interface AgencyTeamMemberDoc extends BaseDoc {
  agencyOrgId: string;
  userId: string | null;
  name: string;
  email: string;
  avatar: string | null;
  role: AgencyTeamRole;
  customers: number;
  status: AgencyTeamStatus;
  lastActiveAt: Date | null;
}

export interface AgencyTeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: AgencyTeamRole;
  customers: number;
  lastActive: string;
  status: AgencyTeamStatus;
}

export const agencyTeamMemberInputSchema = z.object({
  agencyOrgId: z.string().min(1),
  userId: z.string().nullable().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().url().nullable().optional(),
  role: z.enum(AGENCY_TEAM_ROLES),
  customers: z.number().int().min(0).default(0),
  status: z.enum(AGENCY_TEAM_STATUSES).default("Invited"),
});
export type AgencyTeamMemberInput = z.infer<typeof agencyTeamMemberInputSchema>;

export function serializeAgencyTeamMember(doc: AgencyTeamMemberDoc): AgencyTeamMember {
  return {
    id: idToString(doc._id),
    name: doc.name,
    email: doc.email,
    avatar: doc.avatar ?? "",
    role: doc.role,
    customers: doc.customers,
    lastActive: doc.lastActiveAt ? dateToIso(doc.lastActiveAt) : "—",
    status: doc.status,
  };
}

export interface ActivityLogEntryDoc extends BaseDoc {
  agencyOrgId: string;
  actorUserId: string | null;
  actorName: string;
  action: string;
  target: string;
  occurredAt: Date;
}

export interface ActivityLogEntry {
  id: string;
  who: string;
  action: string;
  target: string;
  timestamp: string;
}

export function serializeActivityLogEntry(doc: ActivityLogEntryDoc): ActivityLogEntry {
  return {
    id: idToString(doc._id),
    who: doc.actorName,
    action: doc.action,
    target: doc.target,
    timestamp: dateToIso(doc.occurredAt),
  };
}
