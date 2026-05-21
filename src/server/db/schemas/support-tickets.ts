import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const SUPPORT_AUDIENCES = ["customer", "affiliate", "agency"] as const;
export type SupportAudience = (typeof SUPPORT_AUDIENCES)[number];

export const CUSTOMER_TICKET_STATUSES = ["Open", "Waiting", "Resolved"] as const;
export type CustomerTicketStatus = (typeof CUSTOMER_TICKET_STATUSES)[number];

export const AFFILIATE_TICKET_STATUSES = ["Open", "Awaiting reply", "Resolved"] as const;
export type AffiliateTicketStatus = (typeof AFFILIATE_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_STATUSES = [
  "Open",
  "Waiting",
  "Awaiting reply",
  "Resolved",
] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_CATEGORIES = [
  "Payouts",
  "Tracking",
  "Assets",
  "Account",
  "Other",
  "Product",
  "Billing",
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const CUSTOMER_TICKET_STATUS_COLORS: Record<CustomerTicketStatus, ChipColor> = {
  Open: "warning",
  Resolved: "success",
  Waiting: "accent",
};

export const AFFILIATE_TICKET_STATUS_COLORS: Record<AffiliateTicketStatus, ChipColor> = {
  "Awaiting reply": "warning",
  Open: "accent",
  Resolved: "success",
};

export interface SupportTicketDoc extends BaseDoc {
  audience: SupportAudience;
  orgId: string | null;
  userId: string | null;
  reference: string;
  subject: string;
  excerpt: string;
  lastMessage: string;
  category: SupportCategory;
  assignee: string;
  status: SupportTicketStatus;
  lastUpdatedAt: Date;
}

export interface CustomerSupportTicket {
  id: string;
  subject: string;
  status: CustomerTicketStatus;
  createdAt: string;
  lastUpdate: string;
  assignee: string;
  excerpt: string;
}

export interface AffiliateSupportTicket {
  id: string;
  reference: string;
  subject: string;
  status: AffiliateTicketStatus;
  category: SupportCategory;
  updatedAt: string;
  lastMessage: string;
}

export const supportTicketInputSchema = z.object({
  audience: z.enum(SUPPORT_AUDIENCES),
  orgId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  reference: z.string().min(1),
  subject: z.string().min(1),
  excerpt: z.string().default(""),
  lastMessage: z.string().default(""),
  category: z.enum(SUPPORT_CATEGORIES).default("Other"),
  assignee: z.string().default("Support"),
  status: z.enum(SUPPORT_TICKET_STATUSES).default("Open"),
});
export type SupportTicketInput = z.infer<typeof supportTicketInputSchema>;

function coerceCustomerStatus(s: SupportTicketStatus): CustomerTicketStatus {
  if (s === "Resolved") return "Resolved";
  if (s === "Waiting" || s === "Awaiting reply") return "Waiting";

  return "Open";
}

function coerceAffiliateStatus(s: SupportTicketStatus): AffiliateTicketStatus {
  if (s === "Resolved") return "Resolved";
  if (s === "Awaiting reply" || s === "Waiting") return "Awaiting reply";

  return "Open";
}

export function serializeCustomerTicket(doc: SupportTicketDoc): CustomerSupportTicket {
  return {
    id: idToString(doc._id),
    subject: doc.subject,
    status: coerceCustomerStatus(doc.status),
    createdAt: dateToIso(doc.createdAt).slice(0, 10),
    lastUpdate: dateToIso(doc.lastUpdatedAt),
    assignee: doc.assignee,
    excerpt: doc.excerpt,
  };
}

export function serializeAffiliateTicket(doc: SupportTicketDoc): AffiliateSupportTicket {
  return {
    id: idToString(doc._id),
    reference: doc.reference,
    subject: doc.subject,
    status: coerceAffiliateStatus(doc.status),
    category: doc.category,
    updatedAt: dateToIso(doc.lastUpdatedAt),
    lastMessage: doc.lastMessage,
  };
}

export interface FaqDoc extends BaseDoc {
  audience: SupportAudience;
  question: string;
  answer: string;
  position: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function serializeFaq(doc: FaqDoc): FaqItem {
  return {
    id: idToString(doc._id),
    question: doc.question,
    answer: doc.answer,
  };
}

export interface KnowledgeArticleDoc extends BaseDoc {
  audience: SupportAudience;
  title: string;
  category: string;
  readMinutes: number;
  url: string | null;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  readMinutes: number;
}

export function serializeKnowledgeArticle(doc: KnowledgeArticleDoc): KnowledgeArticle {
  return {
    id: idToString(doc._id),
    title: doc.title,
    category: doc.category,
    readMinutes: doc.readMinutes,
  };
}
