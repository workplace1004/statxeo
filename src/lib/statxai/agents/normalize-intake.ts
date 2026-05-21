// @ts-nocheck — legacy pipeline; Mongo compat shim types are loose during migration.
import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import { NormalizedIntakeSchema, type NormalizedIntake } from "../schemas/intake"

/**
 * Stage: normalizing_intake
 *
 * Merges the project row fields (seeded from checkout intake_json) with
 * the latest post-purchase preference submission. Produces a single clean
 * NormalizedIntake object that all downstream agents read from.
 */
export async function normalizeIntake(ctx: JobContext): Promise<void> {
  const snapshot = await readArtifact<{
    project: Record<string, unknown>
    latestIntake: { normalized_payload: Record<string, unknown> } | null
  }>(ctx.projectId, "prompt")

  const { project, latestIntake } = snapshot
  const prefs = (latestIntake?.normalized_payload ?? {}) as Record<string, unknown>

  // Merge: checkout data provides business basics, preferences override/extend
  const raw: Record<string, unknown> = {
    businessName: project.business_name,
    businessIndustry: project.business_industry,
    businessAddress: project.business_address,
    businessProductsServices: project.business_products_services,
    ownerFullName: project.owner_full_name,
    email: project.email,
    phone: project.phone,
    packageTier: project.package_tier,

    // Post-purchase preferences (can override checkout values if re-submitted)
    brandTone: prefs.brandTone ?? project.brand_tone,
    primaryColor: prefs.primaryColor ?? project.primary_color,
    secondaryColor: prefs.secondaryColor ?? project.secondary_color,
    targetAudience: prefs.targetAudience ?? project.target_audience,
    uniqueSellingPoints: prefs.uniqueSellingPoints ?? project.unique_selling_points,
    serviceAreas: prefs.serviceAreas ?? project.service_areas,
    ctaPreference: prefs.ctaPreference ?? project.cta_preference,
    ctaCustomText: prefs.ctaCustomText,
    businessHours: prefs.businessHours ?? project.business_hours,
    socialLinks: prefs.socialLinks ?? project.social_links,
    offeredServices: prefs.offeredServices ?? project.offered_services,
  }

  const parsed = NormalizedIntakeSchema.safeParse(raw)

  if (!parsed.success) {
    // Collect which required fields are missing
    const missing = parsed.error.issues
      .filter((i) => i.code === "invalid_type" && i.received === "undefined")
      .map((i) => i.path.join("."))

    if (missing.length > 0) {
      throw new Error(`Missing required intake fields: ${missing.join(", ")}`)
    }

    // Non-critical validation issues — use raw data with defaults
  }

  const normalized: NormalizedIntake = parsed.success
    ? parsed.data
    : {
        businessName: String(raw.businessName ?? ""),
        ownerFullName: String(raw.ownerFullName ?? ""),
        packageTier: String(raw.packageTier ?? "statxeo_lander"),
        ...Object.fromEntries(
          Object.entries(raw).filter(([, v]) => v != null),
        ),
      } as NormalizedIntake

  await writeArtifact(ctx.jobId, ctx.projectId, "generated_copy", {
    normalizedIntake: normalized,
  })
}
