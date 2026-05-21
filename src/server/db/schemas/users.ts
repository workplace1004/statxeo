import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const USER_ROLES = [
  "agency_owner",
  "agency_member",
  "affiliate",
  "customer_owner",
  "customer_member",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserDoc extends BaseDoc {
  googleSub: string | null;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  accountType: "agency" | "customer" | "affiliate";
  organizationId: string | null;
}

export interface User {
  id: string;
  googleSub: string | null;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  accountType: "agency" | "customer" | "affiliate";
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const userInputSchema = z.object({
  googleSub: z.string().nullable().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  role: z.enum(USER_ROLES),
  accountType: z.enum(["agency", "customer", "affiliate"]),
  organizationId: z.string().nullable().optional(),
});
export type UserInput = z.infer<typeof userInputSchema>;

export function serializeUser(doc: UserDoc): User {
  return {
    id: idToString(doc._id),
    googleSub: doc.googleSub,
    email: doc.email,
    name: doc.name,
    avatarUrl: doc.avatarUrl,
    role: doc.role,
    accountType: doc.accountType,
    organizationId: doc.organizationId,
    createdAt: dateToIso(doc.createdAt),
    updatedAt: dateToIso(doc.updatedAt),
  };
}
