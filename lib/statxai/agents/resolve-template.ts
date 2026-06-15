import { getStatxaiSupabase } from "../supabase"
import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import type { NormalizedIntake } from "../schemas/intake"

/**
 * Stage: resolving_template
 *
 * Picks the correct template from statxeo_site_template_registry based on
 * package_tier. Updates template_id on site_projects if not already set.
 *
 * Priority:
 *   1. Template already set on the project (user preference)
 *   2. First active template that supports the package tier
 *   3. Hardcoded fallback: lander-default
 */

const PACKAGE_TEMPLATE_DEFAULTS: Record<string, string> = {
  statxeo_lander: "lander-default",
  statxeo_core: "core-default",
  statxeo_titan: "titan-default",
}

export async function resolveTemplate(ctx: JobContext): Promise<void> {
  const supabase = getStatxaiSupabase()

  // Read normalized intake from previous stage
  const artifact = await readArtifact<{ normalizedIntake: NormalizedIntake }>(
    ctx.projectId,
    "generated_copy",
  )
  const { normalizedIntake } = artifact

  // Check if project already has a template set
  const { data: project } = await supabase
    .from("statxeo_site_projects")
    .select("id, template_id")
    .eq("id", ctx.projectId)
    .single()

  let templateRow: { id: string; name: string; slot_schema: unknown; pages: string[]; renderer_version: string } | null = null

  if (project?.template_id) {
    // Use existing template preference
    const { data } = await supabase
      .from("statxeo_site_template_registry")
      .select("id, name, slot_schema, pages, renderer_version")
      .eq("id", project.template_id)
      .eq("is_active", true)
      .single()
    templateRow = data
  }

  if (!templateRow) {
    // Find best template for this package tier
    const preferredName = PACKAGE_TEMPLATE_DEFAULTS[normalizedIntake.packageTier] ?? "lander-default"

    const { data } = await supabase
      .from("statxeo_site_template_registry")
      .select("id, name, slot_schema, pages, renderer_version")
      .eq("is_active", true)
      .contains("supported_packages", [normalizedIntake.packageTier])
      .eq("name", preferredName)
      .maybeSingle()

    if (data) {
      templateRow = data
    } else {
      // Fallback: any active template supporting this package
      const { data: fallback } = await supabase
        .from("statxeo_site_template_registry")
        .select("id, name, slot_schema, pages, renderer_version")
        .eq("is_active", true)
        .contains("supported_packages", [normalizedIntake.packageTier])
        .limit(1)
        .maybeSingle()

      templateRow = fallback
    }
  }

  if (!templateRow) {
    throw new Error(`No active template found for package tier: ${normalizedIntake.packageTier}`)
  }

  // Persist template_id on the project if not already set
  if (!project?.template_id) {
    await supabase
      .from("statxeo_site_projects")
      .update({ template_id: templateRow.id })
      .eq("id", ctx.projectId)
  }

  // Write updated artifact with template info attached
  await writeArtifact(ctx.jobId, ctx.projectId, "generated_copy", {
    normalizedIntake,
    template: {
      id: templateRow.id,
      name: templateRow.name,
      slotSchema: templateRow.slot_schema,
      pages: templateRow.pages,
      rendererVersion: templateRow.renderer_version,
    },
  })
}
