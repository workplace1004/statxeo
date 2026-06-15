import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import { selectContentSchema } from "../schemas"
import type { TitanContent } from "../schemas/titan-content"

/**
 * Stage: validating_output
 *
 * Re-validates the generated output against the Zod schema.
 * generateObject() already enforces the schema, but this stage
 * provides an explicit audit checkpoint and catches edge cases.
 *
 * Titan-specific validations:
 *   - Slug echo validity: every service/city slug must match what was generated
 *   - City uniqueness: no two city pages may share a slug
 *
 * On failure: throws with a descriptive retryable error.
 */
export async function validateOutput(ctx: JobContext): Promise<void> {
  const artifact = await readArtifact<{
    rawOutput: unknown
    template: { name: string }
    serviceSlugs: Record<string, string> | null
    citySlugs: Record<string, string> | null
  }>(ctx.projectId, "generated_copy")

  const schema = selectContentSchema(artifact.template.name)
  const parsed = schema.safeParse(artifact.rawOutput)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")
    throw new Error(`Generated content failed schema validation: ${issues}`)
  }

  // Titan-specific validations
  if (artifact.template.name === "titan-default") {
    const content = parsed.data as TitanContent
    const serviceSlugs = artifact.serviceSlugs ?? {}
    const citySlugs = artifact.citySlugs ?? {}

    validateTitanSlugs(content, serviceSlugs, citySlugs)
    validateCityUniqueness(content)
  }

  await writeArtifact(ctx.jobId, ctx.projectId, "validated_slots", {
    content: parsed.data,
    templateName: artifact.template.name,
    validatedAt: new Date().toISOString(),
  })
}

/**
 * Validates that the LLM echoed back the exact slugs we provided.
 * Throws a descriptive error listing any mismatches.
 */
function validateTitanSlugs(
  content: TitanContent,
  serviceSlugs: Record<string, string>,
  citySlugs: Record<string, string>,
): void {
  const expectedServiceSlugs = new Set(Object.values(serviceSlugs))
  const expectedCitySlugs = new Set(Object.values(citySlugs))

  const badServiceSlugs = content.servicePages
    .filter((p) => !expectedServiceSlugs.has(p.slug))
    .map((p) => p.slug)

  const badCitySlugs = content.cityPages
    .filter((p) => !expectedCitySlugs.has(p.slug))
    .map((p) => p.slug)

  const errors: string[] = []
  if (badServiceSlugs.length > 0) {
    errors.push(`Service pages contain invalid slugs: ${badServiceSlugs.join(", ")}. Expected: ${[...expectedServiceSlugs].join(", ")}`)
  }
  if (badCitySlugs.length > 0) {
    errors.push(`City pages contain invalid slugs: ${badCitySlugs.join(", ")}. Expected: ${[...expectedCitySlugs].join(", ")}`)
  }

  if (errors.length > 0) {
    throw new Error(`Titan slug validation failed:\n${errors.join("\n")}`)
  }
}

/**
 * Validates that no two city pages share the same slug.
 */
function validateCityUniqueness(content: TitanContent): void {
  const slugs = content.cityPages.map((p) => p.slug)
  const seen = new Set<string>()
  const duplicates: string[] = []

  for (const slug of slugs) {
    if (seen.has(slug)) {
      duplicates.push(slug)
    }
    seen.add(slug)
  }

  if (duplicates.length > 0) {
    throw new Error(`Titan city pages contain duplicate slugs: ${duplicates.join(", ")}`)
  }
}
