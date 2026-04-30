import { z } from "zod"

/**
 * Website preference fields collected post-purchase.
 * These are NOT sent through the checkout payload (which uses .strict()).
 * Collected via the customer portal "My Website" setup form.
 */
export const WebsitePreferencesSchema = z.object({
  brandTone: z
    .enum(["professional", "friendly", "bold", "minimal", "luxury", "playful"])
    .optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
  targetAudience: z.string().trim().max(500).optional(),
  uniqueSellingPoints: z.array(z.string().trim().max(200)).max(10).optional(),
  serviceAreas: z.array(z.string().trim().max(100)).max(20).optional(),
  ctaPreference: z.enum(["call", "book", "quote", "contact", "custom"]).optional(),
  ctaCustomText: z.string().trim().max(50).optional(),
  businessHours: z
    .object({
      monday: z.string().optional(),
      tuesday: z.string().optional(),
      wednesday: z.string().optional(),
      thursday: z.string().optional(),
      friday: z.string().optional(),
      saturday: z.string().optional(),
      sunday: z.string().optional(),
      notes: z.string().max(200).optional(),
    })
    .optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      youtube: z.string().url().optional().or(z.literal("")),
      tiktok: z.string().url().optional().or(z.literal("")),
      yelp: z.string().url().optional().or(z.literal("")),
      googleBusiness: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  preferredTemplate: z.string().optional(),
  domainPreference: z.string().trim().max(253).optional(),
  offeredServices: z.array(z.string().trim().max(120)).max(12).optional(),
})

export type WebsitePreferences = z.infer<typeof WebsitePreferencesSchema>

/**
 * Combined intake data normalized from checkout intake_json + website preferences.
 * This is the canonical input to the generation pipeline.
 */
export const NormalizedIntakeSchema = z.object({
  // From checkout intake_json (statxeo_leads.intake_json)
  businessName: z.string(),
  businessIndustry: z.string().optional(),
  businessAddress: z.string().optional(),
  businessProductsServices: z.string().optional(),
  ownerFullName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  ein: z.string().optional(),
  packageTier: z.string(),

  // From website preferences (collected post-purchase)
  brandTone: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  targetAudience: z.string().optional(),
  uniqueSellingPoints: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  ctaPreference: z.string().optional(),
  ctaCustomText: z.string().optional(),
  businessHours: z.record(z.string()).optional(),
  socialLinks: z.record(z.string()).optional(),
  offeredServices: z.array(z.string()).optional(),
})

export type NormalizedIntake = z.infer<typeof NormalizedIntakeSchema>
