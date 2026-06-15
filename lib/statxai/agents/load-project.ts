import { getStatxaiSupabase } from "../supabase"
import { writeArtifact, type JobContext } from "../orchestrator"

/**
 * Stage: loading_project
 *
 * Fetches the full project row, latest intake submission, and media assets.
 * Writes a 'prompt' seed artifact containing the raw project snapshot so
 * downstream agents don't need to re-query.
 */
export async function loadProjectData(ctx: JobContext): Promise<void> {
  const supabase = getStatxaiSupabase()

  const { data: project, error: projectError } = await supabase
    .from("statxeo_site_projects")
    .select(`
      id,
      lead_id,
      purchase_id,
      package_tier,
      template_id,
      template_version,
      business_name,
      business_industry,
      business_address,
      business_products_services,
      owner_full_name,
      email,
      phone,
      brand_tone,
      primary_color,
      secondary_color,
      target_audience,
      unique_selling_points,
      service_areas,
      cta_preference,
      business_hours,
      social_links,
      domain_name
    `)
    .eq("id", ctx.projectId)
    .single()

  if (projectError || !project) {
    throw new Error(`Project not found: ${projectError?.message ?? ctx.projectId}`)
  }

  // Fetch latest intake submission for the versioned preference snapshot
  const { data: latestIntake } = await supabase
    .from("statxeo_site_intake_submissions")
    .select("version, normalized_payload, raw_payload, created_at")
    .eq("project_id", ctx.projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch media assets
  const { data: mediaAssets } = await supabase
    .from("statxeo_site_media_assets")
    .select("id, asset_type, storage_path, placement_hint, sort_order, original_filename")
    .eq("project_id", ctx.projectId)
    .order("sort_order", { ascending: true })

  // Write the project snapshot artifact for downstream agents
  await writeArtifact(ctx.jobId, ctx.projectId, "prompt", {
    project,
    latestIntake: latestIntake ?? null,
    mediaAssets: mediaAssets ?? [],
    loadedAt: new Date().toISOString(),
  })
}
