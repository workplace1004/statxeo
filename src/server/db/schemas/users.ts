import type {BaseDoc} from "./_helpers";
import {z} from "zod";
import {dateToIso, idToString} from "./_helpers";

export const USER_ROLES = [
  // ── Platform level ────────────────────────────────────────────────────
  /** Full global access: manage all tenants, override billing/DNS, impersonate */
  "platform_admin",

  // ── Agency / White-Labeler level ──────────────────────────────────────
  /** Owns the agency org: full access to all client data and billing */
  "agency_owner",
  /** Ops staff: manage clients, run workflows — cannot touch billing or DNS */
  "agency_staff",
  /** Approve or reject AI-generated content only — no write access elsewhere */
  "content_reviewer",
  /** Billing and payout access only — no content or client mutations */
  "billing_manager",
  /** Standard agency team member with read + limited task access */
  "agency_member",

  // ── Client level ──────────────────────────────────────────────────────
  /** Owns the client org: full access within their own org */
  "customer_owner",
  /** Member of a client org: limited operational access */
  "customer_member",

  // ── Partner level ─────────────────────────────────────────────────────
  "affiliate",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserDoc extends BaseDoc {
  googleSub: string | null;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  accountType: "agency" | "customer" | "affiliate" | "platform";
  organizationId: string | null;
  metaAdsAccessToken?: string | null;
  googleAdsRefreshToken?: string | null;
  googleAdsCustomerId?: string | null;
  microsoftAdsRefreshToken?: string | null;
  microsoftAdsCustomerId?: string | null;
  linkedinAdsAccessToken?: string | null;
  linkedinAdsAccountId?: string | null;
  tiktokAdsAccessToken?: string | null;
  tiktokAdsAdvertiserId?: string | null;
  amazonAdsRefreshToken?: string | null;
  amazonAdsProfileId?: string | null;
}

export interface User {
  id: string;
  googleSub: string | null;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  accountType: "agency" | "customer" | "affiliate" | "platform";
  organizationId: string | null;
  metaAdsAccessToken?: string | null;
  googleAdsRefreshToken?: string | null;
  googleAdsCustomerId?: string | null;
  microsoftAdsRefreshToken?: string | null;
  microsoftAdsCustomerId?: string | null;
  linkedinAdsAccessToken?: string | null;
  linkedinAdsAccountId?: string | null;
  tiktokAdsAccessToken?: string | null;
  tiktokAdsAdvertiserId?: string | null;
  amazonAdsRefreshToken?: string | null;
  amazonAdsProfileId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const userInputSchema = z.object({
  googleSub: z.string().nullable().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  role: z.enum(USER_ROLES),
  accountType: z.enum(["agency", "customer", "affiliate", "platform"]),
  organizationId: z.string().nullable().optional(),
  metaAdsAccessToken: z.string().nullable().optional(),
  googleAdsRefreshToken: z.string().nullable().optional(),
  googleAdsCustomerId: z.string().nullable().optional(),
  microsoftAdsRefreshToken: z.string().nullable().optional(),
  microsoftAdsCustomerId: z.string().nullable().optional(),
  linkedinAdsAccessToken: z.string().nullable().optional(),
  linkedinAdsAccountId: z.string().nullable().optional(),
  tiktokAdsAccessToken: z.string().nullable().optional(),
  tiktokAdsAdvertiserId: z.string().nullable().optional(),
  amazonAdsRefreshToken: z.string().nullable().optional(),
  amazonAdsProfileId: z.string().nullable().optional(),
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
    metaAdsAccessToken: doc.metaAdsAccessToken,
    googleAdsRefreshToken: doc.googleAdsRefreshToken,
    googleAdsCustomerId: doc.googleAdsCustomerId,
    microsoftAdsRefreshToken: doc.microsoftAdsRefreshToken,
    microsoftAdsCustomerId: doc.microsoftAdsCustomerId,
    linkedinAdsAccessToken: doc.linkedinAdsAccessToken,
    linkedinAdsAccountId: doc.linkedinAdsAccountId,
    tiktokAdsAccessToken: doc.tiktokAdsAccessToken,
    tiktokAdsAdvertiserId: doc.tiktokAdsAdvertiserId,
    amazonAdsRefreshToken: doc.amazonAdsRefreshToken,
    amazonAdsProfileId: doc.amazonAdsProfileId,
    createdAt: dateToIso(doc.createdAt),
    updatedAt: dateToIso(doc.updatedAt),
  };
}
