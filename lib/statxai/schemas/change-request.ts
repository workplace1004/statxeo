import { z } from "zod"

export const CreateChangeRequestSchema = z.object({
  scopeType: z.enum(["site", "page", "section", "seo", "media"]).default("site"),
  pageKey: z.string().trim().max(50).optional(),
  sectionKey: z.string().trim().max(50).optional(),
  description: z.string().trim().min(10).max(2000),
})

export type CreateChangeRequest = z.infer<typeof CreateChangeRequestSchema>
