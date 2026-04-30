import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"

import { readArtifact, writeArtifact, updateTokenUsage, type JobContext } from "../orchestrator"
import { selectContentSchema } from "../schemas"
import { CoreContentSchema } from "../schemas/core-content"
import { TitanServicePageSchema, TitanCityPageSchema } from "../schemas/titan-content"
import type { NormalizedIntake } from "../schemas/intake"
import type { CoreContent } from "../schemas/core-content"
import type { TitanContent } from "../schemas/titan-content"

/**
 * Stage: llm_calling
 *
 * Routes generation by template:
 *   - lander-default: single call with LanderContentSchema
 *   - core-default:   single call with CoreContentSchema
 *   - titan-default:  3 sequential calls:
 *       1. Core base content (home, services, about, contact)
 *       2. Service pages batch (one per offeredService)
 *       3. City pages batch (one per serviceArea)
 *
 * Token usage is accumulated across all calls for Titan.
 */

const DEFAULT_MODEL = "gpt-4o"

export async function generateContent(ctx: JobContext): Promise<void> {
  const artifact = await readArtifact<{
    normalizedIntake: NormalizedIntake
    template: { name: string; slotSchema: unknown; pages: string[] }
    systemPrompt: string
    userPrompt: string
    serviceSlugs: Record<string, string> | null
    citySlugs: Record<string, string> | null
  }>(ctx.projectId, "generated_copy")

  const { systemPrompt, userPrompt, template, normalizedIntake: intake } = artifact
  const modelId = process.env.AI_MODEL ?? DEFAULT_MODEL

  let rawOutput: unknown
  let totalInputTokens = 0
  let totalOutputTokens = 0

  if (template.name === "titan-default") {
    const result = await generateTitanContent(
      systemPrompt,
      userPrompt,
      intake,
      artifact.serviceSlugs ?? {},
      artifact.citySlugs ?? {},
      modelId,
    )
    rawOutput = result.content
    totalInputTokens = result.inputTokens
    totalOutputTokens = result.outputTokens
  } else {
    const schema = selectContentSchema(template.name)
    const result = await generateObject({
      model: openai(modelId),
      schema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.4,
    })
    rawOutput = result.object
    totalInputTokens = result.usage?.inputTokens ?? 0
    totalOutputTokens = result.usage?.outputTokens ?? 0
  }

  await updateTokenUsage(ctx.jobId, totalInputTokens, totalOutputTokens, modelId)

  await writeArtifact(ctx.jobId, ctx.projectId, "generated_copy", {
    ...artifact,
    rawOutput,
    generatedAt: new Date().toISOString(),
    modelId,
  })
}

/**
 * Titan 3-call generation strategy:
 * 1. Generate Core base content (home, services, about, contact)
 * 2. Generate each service page individually (batched sequentially)
 * 3. Generate each city page individually (batched sequentially)
 *
 * This avoids context-window overflows for large Titan sites and makes
 * each call independently retryable.
 */
async function generateTitanContent(
  systemPrompt: string,
  userPrompt: string,
  intake: NormalizedIntake,
  serviceSlugs: Record<string, string>,
  citySlugs: Record<string, string>,
  modelId: string,
): Promise<{ content: TitanContent; inputTokens: number; outputTokens: number }> {
  let totalInput = 0
  let totalOutput = 0

  // ── Call 1: Core base content ─────────────────────────────────────────────
  const baseResult = await generateObject({
    model: openai(modelId),
    schema: CoreContentSchema,
    system: systemPrompt,
    prompt: userPrompt + "\n\nGenerate ONLY the core pages: home, servicesPage, aboutPage, contactPage.",
    temperature: 0.4,
  })
  totalInput += baseResult.usage?.inputTokens ?? 0
  totalOutput += baseResult.usage?.outputTokens ?? 0
  const baseContent = baseResult.object as CoreContent

  // ── Call 2: Service pages ─────────────────────────────────────────────────
  const servicePages = []
  const services = intake.offeredServices ?? []

  for (const service of services) {
    const slug = serviceSlugs[service]
    if (!slug) continue

    const serviceResult = await generateObject({
      model: openai(modelId),
      schema: TitanServicePageSchema,
      system: systemPrompt,
      prompt: buildServicePagePrompt(intake, service, slug, services),
      temperature: 0.4,
    })
    totalInput += serviceResult.usage?.inputTokens ?? 0
    totalOutput += serviceResult.usage?.outputTokens ?? 0
    servicePages.push(serviceResult.object)
  }

  // ── Call 3: City pages ────────────────────────────────────────────────────
  const cityPages = []
  const cities = intake.serviceAreas ?? []

  for (const city of cities) {
    const slug = citySlugs[city]
    if (!slug) continue

    const cityResult = await generateObject({
      model: openai(modelId),
      schema: TitanCityPageSchema,
      system: systemPrompt,
      prompt: buildCityPagePrompt(intake, city, slug, services),
      temperature: 0.4,
    })
    totalInput += cityResult.usage?.inputTokens ?? 0
    totalOutput += cityResult.usage?.outputTokens ?? 0
    cityPages.push(cityResult.object)
  }

  const titanContent: TitanContent = {
    ...baseContent,
    servicePages,
    cityPages,
  }

  return { content: titanContent, inputTokens: totalInput, outputTokens: totalOutput }
}

function buildServicePagePrompt(
  intake: NormalizedIntake,
  service: string,
  slug: string,
  allServices: string[],
): string {
  const relatedSlugs = allServices
    .filter((s) => s !== service)
    .slice(0, 3)
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))

  return `Generate a service detail page for: "${service}"

Business: ${intake.businessName}
Industry: ${intake.businessIndustry ?? "Local Business"}
Location: ${intake.businessAddress ?? ""}
Phone: ${intake.phone ?? ""}
Brand Tone: ${intake.brandTone ?? "professional"}

IMPORTANT: Use this exact slug: "${slug}"
Related service slugs (for relatedServices field): ${JSON.stringify(relatedSlugs)}

Write content specific to the "${service}" service. Include realistic benefits, a clear process, and FAQs a customer would actually ask.`
}

function buildCityPagePrompt(
  intake: NormalizedIntake,
  city: string,
  slug: string,
  services: string[],
): string {
  return `Generate a city/area SEO page for: "${city}"

Business: ${intake.businessName}
Industry: ${intake.businessIndustry ?? "Local Business"}
Services: ${services.join(", ")}
Phone: ${intake.phone ?? ""}
Brand Tone: ${intake.brandTone ?? "professional"}

IMPORTANT: Use this exact slug: "${slug}"
City field must be: "${city}"

Write location-specific content that naturally mentions ${city}. Include local trust signals and city-specific service highlights.`
}
