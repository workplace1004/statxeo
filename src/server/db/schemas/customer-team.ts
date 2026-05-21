import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const CUSTOMER_TEAM_ROLES = ["Owner", "Admin", "Editor", "Viewer"] as const;
export type CustomerTeamRole = (typeof CUSTOMER_TEAM_ROLES)[number];

export const CUSTOMER_TEAM_ROLE_COLORS: Record<CustomerTeamRole, ChipColor> = {
  Admin: "warning",
  Editor: "accent",
  Owner: "success",
  Viewer: "default",
};

export interface CustomerTeamMemberDoc extends BaseDoc {
  customerOrgId: string;
  userId: string | null;
  name: string;
  email: string;
  avatar: string | null;
  role: CustomerTeamRole;
  joinedAt: Date;
  lastActiveAt: Date | null;
}

export interface CustomerTeamMember {
  id: string;
  name: string;
  email: string;
  role: CustomerTeamRole;
  avatar: string;
  lastActive: string;
}

export const customerTeamMemberInputSchema = z.object({
  customerOrgId: z.string().min(1),
  userId: z.string().nullable().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().url().nullable().optional(),
  role: z.enum(CUSTOMER_TEAM_ROLES).default("Viewer"),
});
export type CustomerTeamMemberInput = z.infer<typeof customerTeamMemberInputSchema>;

export function serializeCustomerTeamMember(doc: CustomerTeamMemberDoc): CustomerTeamMember {
  return {
    id: idToString(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    avatar: doc.avatar ?? "",
    lastActive: doc.lastActiveAt ? dateToIso(doc.lastActiveAt) : "—",
  };
}
