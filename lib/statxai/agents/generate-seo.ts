import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"

import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import { SeoBundleSchema } from "../schemas/seo-bundle"
import type { SeoBundle } from "../schemas/seo-bundle"
import type { NormalizedIntake } from "../schemas/intake"
import type { LanderContent } from "../schemas/lander-content"
import type { CoreContent } from "../schemas/core-content"
import type { TitanContent } from "../schemas/titan-content"

/**
 * Stage: generating_seo
 *
 * Generates per-route SEO metadata.
 * Output: seoByRoute — Record<routeKey, SeoBundle>
 *
 * Lander:  single SEO call for index
 * Core:    4 SEO calls (index, services, about, contact)
 * Titan:   Core calls + lightweight SEO for service/city pages
 *          (service/city pages already have seo fields from generate-content,
 *           so we only generate the full bundle for the 4 core pages)
 */

const DEFAULT_MODEL = "gpt-4o"

export type SeoByRoute = Record<string, SeoBundle>

export async function generateSeo(ctx: JobContext): Promise<void> {
  const validatedArtifact = await readArtifact<{
    content: unknown
    templateName: string
  }>(ctx.projectId, "validated_slots")

  const copyArtifact = await readArtifact<{
    normalizedIntake: NormalizedIntake
  }>(ctx.projectId, "generated_copy")

  const { normalizedIntake: intake } = copyArtifact
  const { content, templateName } = validatedArtifact
  const modelId = process.env.AI_MODEL ?? DEFAULT_MODEL

  const seoByRoute = await buildSeoByRoute(templateName, content, intake, modelId)

  await writeArtifact(ctx.jobId, ctx.projectId, "seo_bundle", {
    seoByRoute,
    generatedAt: new Date().toISOString(),
  })
}

async function buildSeoByRoute(
  templateName: string,
  content: unknown,
  intake: NormalizedIntake,
  modelId: string,
): Promise<SeoByRoute> {
  switch (templateName) {
    case "lander-default":
      return buildLanderSeo(content as LanderContent, intake, modelId)
    case "core-default":
      return buildCoreSeo(content as CoreContent, intake, modelId)
    case "titan-default":
      return buildTitanSeo(content as TitanContent, intake, modelId)
    default:
      return buildLanderSeo(content as LanderContent, intake, modelId)
  }
}

async function buildLanderSeo(
  content: LanderContent,
  intake: NormalizedIntake,
  modelId: string,
): Promise<SeoByRoute> {
  const seo = await callSeoModel(
    buildSeoPrompt(intake, content.hero.headline, content.hero.subheadline, "home"),
    modelId,
  )
  return { index: seo }
}

async function buildCoreSeo(
  content: CoreContent,
  intake: NormalizedIntake,
  modelId: string,
): Promise<SeoByRoute> {
  const [indexSeo, servicesSeo, aboutSeo, contactSeo] = await Promise.all([
    callSeoModel(buildSeoPrompt(intake, content.home.hero.headline, content.home.hero.subheadline, "home"), modelId),
    callSeoModel(buildSeoPrompt(intake, content.servicesPage.headline, content.servicesPage.intro, "services"), modelId),
    callSeoModel(buildSeoPrompt(intake, content.aboutPage.headline, content.aboutPage.story.slice(0, 100), "about"), modelId),
    callSeoModel(buildSeoPrompt(intake, content.contactPage.headline, content.contactPage.intro, "contact"), modelId),
  ])

  return {
    index: indexSeo,
    services: servicesSeo,
    about: aboutSeo,
    contact: contactSeo,
  }
}

async function buildTitanSeo(
  content: TitanContent,
  intake: NormalizedIntake,
  modelId: string,
): Promise<SeoByRoute> {
  const coreSeo = await buildCoreSeo(content, intake, modelId)

  // Service/city pages already have seo.title and seo.description from generate-content.
  // We build lightweight SeoBundle objects from those rather than making extra LLM calls.
  const extraRoutes: SeoByRoute = {}

  for (const sp of content.servicePages) {
    extraRoutes[`services/${sp.slug}`] = buildMinimalSeoBundle(
      sp.seo.title,
      sp.seo.description,
      intake,
    )
  }

  for (const cp of content.cityPages) {
    extraRoutes[cp.slug] = buildMinimalSeoBundle(
      cp.seo.title,
      cp.seo.description,
      intake,
    )
  }

  return { ...coreSeo, ...extraRoutes }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function callSeoModel(prompt: string, modelId: string): Promise<SeoBundle> {
  const result = await generateObject({
    model: openai(modelId),
    schema: SeoBundleSchema,
    system: `You are an SEO specialist writing metadata for a local business website.
Output strict JSON only. No prose. No markdown.
All text must be factual — do not invent services, locations, or credentials.`,
    prompt,
    temperature: 0.2,
  })
  return result.object
}

function buildSeoPrompt(
  intake: NormalizedIntake,
  headline: string,
  subheadline: string,
  pageType: string,
): string {
  return [
    `Generate SEO metadata for the "${pageType}" page of this local business website:`,
    ``,
    `Business: ${intake.businessName}`,
    `Industry: ${intake.businessIndustry ?? "Local Business"}`,
    `Location: ${intake.businessAddress ?? ""}`,
    `Phone: ${intake.phone ?? ""}`,
    `Email: ${intake.email ?? ""}`,
    `Services: ${intake.businessProductsServices ?? ""}`,
    ``,
    `Page headline: ${headline}`,
    `Page subheadline: ${subheadline}`,
    ``,
    `Service areas: ${(intake.serviceAreas ?? []).join(", ") || "Local area"}`,
    ``,
    `For the llms.txt field: write a clear 150-300 word plain-text summary of what this business`,
    `does, where it operates, and how to contact them. This is for AI systems to understand the site.`,
    ``,
    `For schema.org type: choose the most specific applicable type`,
    `(e.g. Plumber, Electrician, HVACBusiness, Dentist, LegalService, etc.)`,
  ].join("\n")
}

function buildMinimalSeoBundle(
  title: string,
  description: string,
  intake: NormalizedIntake,
): SeoBundle {
  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImagePrompt: `${intake.businessName} ${intake.businessIndustry ?? "local business"} professional photo`,
    schemaOrg: {
      type: "LocalBusiness",
      name: intake.businessName,
      description,
      address: null,
      telephone: intake.phone ?? null,
      email: intake.email ?? null,
      url: null,
      priceRange: null,
      openingHours: null,
      sameAs: null,
    },
    llmsTxt: `${intake.businessName} is a ${intake.businessIndustry ?? "local business"} serving ${(intake.serviceAreas ?? []).join(", ") || "the local area"}.`,
  }
}
