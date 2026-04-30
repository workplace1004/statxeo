import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import type { NormalizedIntake } from "../schemas/intake"
import type { SeoByRoute } from "./generate-seo"
import type { SlotsByRoute } from "./map-slots"

/**
 * Stage: building_manifest
 *
 * Assembles the final RenderManifest from all previous artifacts.
 * The manifest is the single source of truth for the renderer and Vercel deployment.
 *
 * Shape:
 * {
 *   templateName: string
 *   rendererVersion: string
 *   slotsByRoute: Record<routeKey, Record<string, unknown>>
 *   seoByRoute:   Record<routeKey, SeoBundle>
 *   meta: { businessName, phone, email, address, primaryColor, secondaryColor, socialLinks }
 *   assets: { logos, photos }
 *   generatedAt: string
 * }
 */

export type RenderManifest = {
  templateName: string
  rendererVersion: string
  slotsByRoute: SlotsByRoute
  seoByRoute: SeoByRoute
  meta: {
    businessName: string
    phone: string | null | undefined
    email: string | null | undefined
    address: string | null | undefined
    primaryColor: string
    secondaryColor: string
    socialLinks: Record<string, string>
  }
  assets: {
    logos: Array<{ storagePath: string; placementHint: string | null; originalFilename: string | null }>
    photos: Array<{ storagePath: string; placementHint: string | null; sortOrder: number; originalFilename: string | null }>
  }
  generatedAt: string
  projectId: string
  jobId: string
}

export async function buildManifest(ctx: JobContext): Promise<void> {
  const validatedArtifact = await readArtifact<{
    content: unknown
    templateName: string
    slotsByRoute: SlotsByRoute
  }>(ctx.projectId, "validated_slots")

  const seoArtifact = await readArtifact<{
    seoByRoute: SeoByRoute
  }>(ctx.projectId, "seo_bundle")

  const copyArtifact = await readArtifact<{
    normalizedIntake: NormalizedIntake
    template: { name: string; pages: string[]; rendererVersion: string }
  }>(ctx.projectId, "generated_copy")

  const snapshotArtifact = await readArtifact<{
    mediaAssets: Array<{
      id: string
      asset_type: string
      storage_path: string
      placement_hint: string | null
      sort_order: number
      original_filename: string | null
    }>
  }>(ctx.projectId, "prompt")

  const { normalizedIntake: intake, template } = copyArtifact
  const { slotsByRoute } = validatedArtifact
  const { seoByRoute } = seoArtifact
  const mediaAssets = snapshotArtifact.mediaAssets ?? []

  const logos = mediaAssets.filter((a) => a.asset_type === "logo")
  const photos = mediaAssets.filter((a) => a.asset_type === "photo")

  const manifest: RenderManifest = {
    templateName: template.name,
    rendererVersion: template.rendererVersion,

    slotsByRoute,
    seoByRoute,

    meta: {
      businessName: intake.businessName,
      phone: intake.phone,
      email: intake.email,
      address: intake.businessAddress,
      primaryColor: intake.primaryColor ?? "#1a1a2e",
      secondaryColor: intake.secondaryColor ?? "#16213e",
      socialLinks: (intake.socialLinks as Record<string, string>) ?? {},
    },

    assets: {
      logos: logos.map((l) => ({
        storagePath: l.storage_path,
        placementHint: l.placement_hint,
        originalFilename: l.original_filename,
      })),
      photos: photos.map((p) => ({
        storagePath: p.storage_path,
        placementHint: p.placement_hint,
        sortOrder: p.sort_order,
        originalFilename: p.original_filename,
      })),
    },

    generatedAt: new Date().toISOString(),
    projectId: ctx.projectId,
    jobId: ctx.jobId,
  }

  await writeArtifact(ctx.jobId, ctx.projectId, "render_manifest", manifest)

  // Write llms.txt from the index page SEO bundle
  const indexSeo = seoByRoute["index"]
  if (indexSeo?.llmsTxt) {
    await writeArtifact(ctx.jobId, ctx.projectId, "llms_txt", { content: indexSeo.llmsTxt })
  }
}
