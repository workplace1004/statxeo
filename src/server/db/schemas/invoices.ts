import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const INVOICE_STATUSES = ["Paid", "Open", "Overdue", "Refunded", "Void", "Failed", "Draft"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, ChipColor> = {
  Draft: "default",
  Failed: "danger",
  Open: "warning",
  Overdue: "danger",
  Paid: "success",
  Refunded: "default",
  Void: "default",
};

export interface InvoiceDoc extends BaseDoc {
  orgId: string;
  customerId: string | null;
  customerName: string;
  customerAvatar: string | null;
  number: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  period: string | null;
  pdfUrl: string | null;
  issuedAt: Date;
  dueAt: Date | null;
  paidAt: Date | null;
}

export interface InvoiceAgency {
  id: string;
  number: string;
  customer: string;
  customerAvatar: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
}

export interface InvoiceCustomer {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  period: string;
}

export const invoiceInputSchema = z.object({
  orgId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  customerName: z.string().default(""),
  customerAvatar: z.string().url().nullable().optional(),
  number: z.string().min(1),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3).default("USD"),
  status: z.enum(INVOICE_STATUSES),
  period: z.string().nullable().optional(),
  pdfUrl: z.string().url().nullable().optional(),
  issuedAt: z.coerce.date(),
  dueAt: z.coerce.date().nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
});
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

export function serializeInvoiceAgency(doc: InvoiceDoc): InvoiceAgency {
  return {
    id: idToString(doc._id),
    number: doc.number,
    customer: doc.customerName,
    customerAvatar: doc.customerAvatar ?? "",
    amount: Math.round(doc.amountCents / 100),
    currency: doc.currency,
    status: doc.status,
    issuedAt: dateToIso(doc.issuedAt).slice(0, 10),
    dueAt: doc.dueAt ? dateToIso(doc.dueAt).slice(0, 10) : "—",
  };
}

export function serializeInvoiceCustomer(doc: InvoiceDoc): InvoiceCustomer {
  return {
    id: idToString(doc._id),
    invoiceNumber: doc.number,
    date: dateToIso(doc.issuedAt).slice(0, 10),
    amount: Math.round(doc.amountCents / 100),
    currency: doc.currency,
    status: doc.status,
    period: doc.period ?? "",
  };
}
