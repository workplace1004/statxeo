import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export interface OnboardingStepDoc extends BaseDoc {
  agencyOrgId: string;
  key: string;
  title: string;
  description: string;
  position: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

export function serializeOnboardingStep(doc: OnboardingStepDoc): OnboardingStep {
  return {
    id: doc.key || idToString(doc._id),
    title: doc.title,
    description: doc.description,
  };
}

export interface OnboardingFlowDoc extends BaseDoc {
  agencyOrgId: string;
  customerId: string | null;
  customerName: string;
  customerAvatar: string | null;
  city: string;
  industry: string;
  currentStep: number;
  startedAt: Date;
  assignedTo: string;
}

export interface OnboardingCustomer {
  id: string;
  name: string;
  avatar: string;
  city: string;
  industry: string;
  currentStep: number;
  startedAt: string;
  assignedTo: string;
}

export const onboardingFlowInputSchema = z.object({
  agencyOrgId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1),
  customerAvatar: z.string().url().nullable().optional(),
  city: z.string().default(""),
  industry: z.string().default(""),
  currentStep: z.number().int().min(0).default(0),
  assignedTo: z.string().default(""),
});
export type OnboardingFlowInput = z.infer<typeof onboardingFlowInputSchema>;

export function serializeOnboardingFlow(doc: OnboardingFlowDoc): OnboardingCustomer {
  return {
    id: idToString(doc._id),
    name: doc.customerName,
    avatar: doc.customerAvatar ?? "",
    city: doc.city,
    industry: doc.industry,
    currentStep: doc.currentStep,
    startedAt: dateToIso(doc.startedAt).slice(0, 10),
    assignedTo: doc.assignedTo,
  };
}

export interface ServiceOptionDoc extends BaseDoc {
  agencyOrgId: string;
  key: string;
  name: string;
  description: string;
  priceCents: number;
  recommended: boolean;
  position: number;
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  recommended?: boolean;
}

export function serializeServiceOption(doc: ServiceOptionDoc): ServiceOption {
  return {
    id: doc.key || idToString(doc._id),
    name: doc.name,
    description: doc.description,
    price: Math.round(doc.priceCents / 100),
    recommended: doc.recommended || undefined,
  };
}
