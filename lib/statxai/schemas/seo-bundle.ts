import { z } from "zod"

/**
 * SEO metadata generated alongside website content.
 * Stored as a generation artifact with artifact_type = 'seo_bundle'.
 *
 * All fields use .nullable() instead of .optional() so OpenAI structured
 * outputs can include every key in `required` (which it mandates).
 */
export const SeoBundleSchema = z.object({
  title: z.string().max(60).describe("Page title tag, under 60 chars, includes business name"),
  description: z.string().max(160).describe("Meta description, under 160 chars, includes location + service"),
  ogTitle: z.string().max(60).describe("Open Graph title"),
  ogDescription: z.string().max(200).describe("Open Graph description"),
  ogImagePrompt: z.string().describe("Prompt for OG image generation, 10-20 words"),

  schemaOrg: z
    .object({
      type: z.string().describe("Schema.org type: LocalBusiness, ProfessionalService, etc."),
      name: z.string(),
      description: z.string(),
      address: z
        .object({
          streetAddress: z.string(),
          addressLocality: z.string(),
          addressRegion: z.string(),
          postalCode: z.string(),
          addressCountry: z.string().describe("Country name, e.g. United States"),
        })
        .nullable()
        .describe("Business address, or null if not available"),
      telephone: z.string().nullable().describe("Phone number, or null if not available"),
      email: z.string().nullable().describe("Email address, or null if not available"),
      url: z.string().nullable().describe("Website URL, or null if not available"),
      priceRange: z.string().nullable().describe("Price range like '$' or '$$', or null if unknown"),
      openingHours: z.array(z.string()).nullable().describe("Opening hours array, or null if unknown"),
      sameAs: z.array(z.string()).nullable().describe("Social/directory profile URLs, or null if none"),
    })
    .describe("Schema.org JSON-LD data for LocalBusiness structured data"),

  llmsTxt: z.string().describe("Plain-text summary for LLM discoverability (llms.txt), 100-300 words"),
})

export type SeoBundle = z.infer<typeof SeoBundleSchema>
