import { z } from "zod"

export const WhiteLabelerApplicationPayloadSchema = z
  .object({
    contactFullName: z.string().trim().min(1).max(200),
    contactEmail: z.string().trim().email().max(320),
    companyName: z.string().trim().min(1).max(200),
    companyWebsite: z.string().trim().max(500).optional().or(z.literal("")),
    desiredSlug: z.string().trim().max(80).optional().or(z.literal("")),
    referredBy: z.string().trim().max(200).optional().or(z.literal("")),
    notes: z.string().trim().max(4000).optional().or(z.literal("")),
  })
  .strict()

export type WhiteLabelerApplicationPayload = z.infer<typeof WhiteLabelerApplicationPayloadSchema>