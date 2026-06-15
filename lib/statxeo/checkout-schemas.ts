import { z } from "zod"

const WebsitePackageIdSchema = z.enum(["statxeo_lander", "statxeo_core", "statxeo_titan"])
const BoostPackageIdSchema = z.enum(["mach_1_foundation", "mach_2_accelerator", "mach_3_xeo"])

export const WebsiteCheckoutPayloadSchema = z
  .object({
    packageId: WebsitePackageIdSchema.default("statxeo_lander"),
    ownerFullName: z.string().trim().min(1).max(200),
    businessAddressFull: z.string().trim().min(1).max(400),
    ein: z.string().trim().min(1).max(64),
    businessName: z.string().trim().min(1).max(200),
    businessIndustry: z.string().trim().min(1).max(120),
    businessProductsServices: z.string().trim().min(1).max(500),
    email: z.string().trim().email().max(320).optional().or(z.literal("")),
    phone: z.string().trim().max(64).optional().or(z.literal("")),
    acceptStatxtSiteTerms: z.literal(true),
    acceptLeadFunnelTerms: z.literal(true),
  })
  .strict()

export const BoostCheckoutPayloadSchema = z
  .object({
    packageId: BoostPackageIdSchema,
    ownerFullName: z.string().trim().min(1).max(200),
    businessName: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().min(10).max(64),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .strict()

export const CombinedCheckoutPayloadSchema = z
  .object({
    websitePackageId: WebsitePackageIdSchema.optional(),
    boostPackageId: BoostPackageIdSchema.optional(),
    ownerFullName: z.string().trim().min(1).max(200),
    businessName: z.string().trim().min(1).max(200),
    businessAddressFull: z.string().trim().max(400).optional().or(z.literal("")),
    ein: z.string().trim().max(64).optional().or(z.literal("")),
    businessIndustry: z.string().trim().max(120).optional().or(z.literal("")),
    businessProductsServices: z.string().trim().max(500).optional().or(z.literal("")),
    email: z.string().trim().email().max(320).optional().or(z.literal("")),
    phone: z.string().trim().max(64).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    acceptStatxtSiteTerms: z.literal(true),
    acceptLeadFunnelTerms: z.literal(true),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasWebsite = Boolean(data.websitePackageId)
    const hasBoost = Boolean(data.boostPackageId)

    if (!hasWebsite && !hasBoost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["websitePackageId"],
        message: "Select at least one package.",
      })
      return
    }

    if (hasWebsite) {
      if (!data.businessAddressFull?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["businessAddressFull"],
          message: "Business address is required when a website package is selected.",
        })
      }

      if (!data.ein?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ein"],
          message: "EIN is required when a website package is selected.",
        })
      }

      if (!data.businessIndustry?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["businessIndustry"],
          message: "Industry is required when a website package is selected.",
        })
      }

      if (!data.businessProductsServices?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["businessProductsServices"],
          message: "Products and services are required when a website package is selected.",
        })
      }
    }

    if (hasBoost) {
      const email = data.email?.trim() ?? ""
      const phone = data.phone?.trim() ?? ""

      if (!email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Email is required when a boost package is selected.",
        })
      }

      if (!phone || phone.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Phone must be at least 10 characters when a boost package is selected.",
        })
      }
    }
  })

export type WebsiteCheckoutPayload = z.infer<typeof WebsiteCheckoutPayloadSchema>
export type BoostCheckoutPayload = z.infer<typeof BoostCheckoutPayloadSchema>
export type CombinedCheckoutPayload = z.infer<typeof CombinedCheckoutPayloadSchema>