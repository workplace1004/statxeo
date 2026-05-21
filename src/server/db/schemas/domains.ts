import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const DOMAIN_STATUSES = ["Active", "Pending DNS", "Failed"] as const;
export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

export const SSL_STATUSES = ["Issued", "Pending"] as const;
export type SslStatus = (typeof SSL_STATUSES)[number];

export interface DomainDoc extends BaseDoc {
  customerOrgId: string;
  domain: string;
  status: DomainStatus;
  isPrimary: boolean;
  sslStatus: SslStatus;
  expiresAt: Date | null;
}

export interface Domain {
  id: string;
  domain: string;
  status: DomainStatus;
  isPrimary: boolean;
  sslStatus: SslStatus;
  expiresAt: string;
}

export const domainInputSchema = z.object({
  customerOrgId: z.string().min(1),
  domain: z.string().min(1),
  status: z.enum(DOMAIN_STATUSES).default("Pending DNS"),
  isPrimary: z.boolean().default(false),
  sslStatus: z.enum(SSL_STATUSES).default("Pending"),
  expiresAt: z.coerce.date().nullable().optional(),
});
export type DomainInput = z.infer<typeof domainInputSchema>;

export function serializeDomain(doc: DomainDoc): Domain {
  return {
    id: idToString(doc._id),
    domain: doc.domain,
    status: doc.status,
    isPrimary: doc.isPrimary,
    sslStatus: doc.sslStatus,
    expiresAt: doc.expiresAt ? dateToIso(doc.expiresAt).slice(0, 10) : "—",
  };
}
